#!/usr/bin/env node
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED_VERSION_FILES = [
  { key: 'manifest.json', type: 'json', file: 'manifest.json', jsonPath: ['version'] },
  { key: 'package.json', type: 'json', file: 'package.json', jsonPath: ['version'] },
  {
    key: 'README.md',
    type: 'regex',
    file: 'README.md',
    pattern: /Current extension version:\s*`([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)`\./,
  },
  {
    key: 'AGENTS.md',
    type: 'regex',
    file: 'AGENTS.md',
    pattern: /Current extension version:\s*`([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)`\./,
  },
  {
    key: 'CLAUDE.md',
    type: 'regex',
    file: 'CLAUDE.md',
    pattern: /Current extension version:\s*`([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)`\./,
  },
  {
    key: 'CHANGELOG.md',
    type: 'regex',
    file: 'CHANGELOG.md',
    pattern: /^##\s+([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)\s+-\s+\d{4}-\d{2}-\d{2}/m,
  },
];

const ROOT_DOCS_ONLY_FILES = new Set([
  'README.md',
  'CHANGELOG.md',
  'SESSION.md',
  'AGENTS.md',
  'CLAUDE.md',
  'CONTRIBUTING.md',
  'WORKFLOW.md',
  'SECURITY.md',
  'CODE_OF_CONDUCT.md',
]);

export function parseVersion(version, { allowThreePart = false } = {}) {
  const pattern = allowThreePart
    ? /^(\d+)\.(\d+)\.(\d+)(?:\.(\d+))?$/
    : /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/;
  const match = String(version).trim().match(pattern);
  if (!match) {
    return null;
  }
  const nums = match
    .slice(1)
    .filter((v) => v !== undefined)
    .map((v) => Number.parseInt(v, 10));
  if (nums.some((n) => Number.isNaN(n))) {
    return null;
  }
  if (nums.length === 3) {
    nums.push(0);
  }
  return {
    raw: String(version).trim(),
    parts: nums,
    originalSegments: match[4] === undefined ? 3 : 4,
  };
}

export function isDocsTestsOnlyPath(filePath) {
  if (!filePath) return false;
  const normalized = filePath.replace(/\\/g, '/');
  if (normalized.startsWith('docs/')) return true;
  if (normalized.startsWith('tests/')) return true;
  if (ROOT_DOCS_ONLY_FILES.has(normalized)) return true;
  if (normalized === 'src/options/options.html') return true;
  return false;
}

export function classifyChangeScope(changedFiles) {
  if (!Array.isArray(changedFiles) || changedFiles.length === 0) {
    return { docsOnly: false, reason: 'no_changed_files' };
  }
  const docsOnly = changedFiles.every((file) => isDocsTestsOnlyPath(file));
  return { docsOnly, reason: docsOnly ? 'docs_tests_only' : 'includes_code_or_ops' };
}

export function validateBumpRule({
  baseVersion,
  currentVersion,
  docsOnly,
  allowThreePartBaseMigration = true,
}) {
  const baseParsed = parseVersion(baseVersion, { allowThreePart: allowThreePartBaseMigration });
  const currentParsed = parseVersion(currentVersion, { allowThreePart: false });
  if (!baseParsed || !currentParsed) {
    return { ok: false, reason: 'invalid_version_format' };
  }

  const [bx, by, bz, bw] = baseParsed.parts;
  const [cx, cy, cz, cw] = currentParsed.parts;

  if (
    allowThreePartBaseMigration &&
    baseParsed.originalSegments === 3 &&
    cx === bx &&
    cy === by &&
    cz === bz &&
    cw === 0
  ) {
    return { ok: true, reason: 'three_to_four_part_migration' };
  }

  if (cx !== bx || cy !== by) {
    return { ok: true, reason: 'manual_major_minor_change' };
  }

  if (docsOnly) {
    if (cz !== bz) {
      return {
        ok: false,
        reason: 'docs_only_must_not_change_patch',
        expected: `${bx}.${by}.${bz}.${bw + 1}`,
      };
    }
    if (cw !== bw + 1) {
      return {
        ok: false,
        reason: 'docs_only_requires_revision_increment',
        expected: `${bx}.${by}.${bz}.${bw + 1}`,
      };
    }
    return { ok: true, reason: 'docs_only_valid' };
  }

  if (cz !== bz + 1 || cw !== 0) {
    return {
      ok: false,
      reason: 'code_change_requires_patch_increment_and_revision_reset',
      expected: `${bx}.${by}.${bz + 1}.0`,
    };
  }
  return { ok: true, reason: 'code_change_valid' };
}

async function readVersionFromSource(definition) {
  const absPath = path.join(ROOT, definition.file);
  const text = await fs.readFile(absPath, 'utf8');
  if (definition.type === 'json') {
    const data = JSON.parse(text);
    const value = definition.jsonPath.reduce((acc, key) => acc?.[key], data);
    return String(value ?? '').trim();
  }
  const match = text.match(definition.pattern);
  return match?.[1] ?? '';
}

function gitOutput(args) {
  return execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

function tryGitOutput(args) {
  try {
    return gitOutput(args);
  } catch {
    return '';
  }
}

function resolveBaseRef() {
  const explicit = process.env.VERSION_POLICY_BASE_SHA?.trim();
  if (explicit) return explicit;

  const eventName = process.env.GITHUB_EVENT_NAME?.trim();
  const baseRef = process.env.GITHUB_BASE_REF?.trim();
  if (eventName === 'pull_request' && baseRef) {
    const remoteRef = `origin/${baseRef}`;
    const mergeBase = tryGitOutput(['merge-base', 'HEAD', remoteRef]);
    if (mergeBase) return mergeBase;
  }

  const prev = tryGitOutput(['rev-parse', '--verify', 'HEAD~1']);
  return prev || '';
}

function getChangedFiles(baseRef) {
  if (!baseRef) return [];
  const out = tryGitOutput(['diff', '--name-only', `${baseRef}..HEAD`]);
  return out
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

async function main() {
  const versions = {};
  for (const source of REQUIRED_VERSION_FILES) {
    versions[source.key] = await readVersionFromSource(source);
  }

  for (const [key, value] of Object.entries(versions)) {
    assert.match(
      value,
      /^\d+\.\d+\.\d+\.\d+$/,
      `${key}: version must use four-part format X.Y.Z.W`
    );
  }

  const unique = new Set(Object.values(versions));
  assert.equal(unique.size, 1, `Version lockstep failed: ${JSON.stringify(versions, null, 2)}`);

  const currentVersion = versions['manifest.json'];

  const tag = tryGitOutput(['describe', '--tags', '--exact-match']);
  if (tag) {
    assert.match(tag, /^v\d+\.\d+\.\d+\.\d+$/, `Git tag must use vX.Y.Z.W format (found ${tag})`);
    assert.equal(
      tag,
      `v${currentVersion}`,
      'Git exact-match tag must equal manifest/changelog version'
    );
  }

  const baseRef = resolveBaseRef();
  const changedFiles = getChangedFiles(baseRef);
  if (!baseRef || changedFiles.length === 0) {
    process.stdout.write(
      'PASS version policy: four-part lockstep validated (bump-rule check skipped: no base diff).\n'
    );
    return;
  }

  const baseManifestText = tryGitOutput(['show', `${baseRef}:manifest.json`]);
  if (!baseManifestText) {
    process.stdout.write(
      'PASS version policy: four-part lockstep validated (bump-rule check skipped: no base manifest).\n'
    );
    return;
  }
  const baseManifest = JSON.parse(baseManifestText);
  const baseVersion = String(baseManifest.version ?? '').trim();
  const scope = classifyChangeScope(changedFiles);

  const bump = validateBumpRule({
    baseVersion,
    currentVersion,
    docsOnly: scope.docsOnly,
  });
  assert.equal(
    bump.ok,
    true,
    `Version bump rule failed (${bump.reason}). Base=${baseVersion}, Current=${currentVersion}, DocsOnly=${scope.docsOnly}, Expected=${bump.expected ?? 'n/a'}`
  );

  process.stdout.write(
    `PASS version policy: ${currentVersion} (${scope.reason}; base=${baseVersion}; rule=${bump.reason}).\n`
  );
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((err) => {
    process.stderr.write(`FAIL version policy\n${err.stack}\n`);
    process.exitCode = 1;
  });
}
