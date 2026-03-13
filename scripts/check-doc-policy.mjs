#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
let failed = false;

// ── 1. README Top Changes gate ────────────────────────────────────────────────
const readmePath = path.join(root, 'README.md');
const readmeText = fs.readFileSync(readmePath, 'utf8');

const overviewIdx = readmeText.indexOf('## Overview');
const topChangesIdx = readmeText.indexOf('## Top Changes');
if (overviewIdx === -1 || topChangesIdx === -1 || topChangesIdx < overviewIdx) {
  console.error('FAIL docs policy: README must contain "## Top Changes" after "## Overview".');
  failed = true;
} else {
  const sectionStart = topChangesIdx + '## Top Changes'.length;
  const rest = readmeText.slice(sectionStart);
  const nextHeading = rest.search(/\n##\s+/);
  const topChangesSection = nextHeading === -1 ? rest : rest.slice(0, nextHeading);
  const topLevelBullets = topChangesSection
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => /^- /.test(line));

  if (topLevelBullets.length === 0) {
    console.error('FAIL docs policy: README Top Changes must contain at least one bullet.');
    failed = true;
  } else if (topLevelBullets.length > 5) {
    console.error(
      `FAIL docs policy: README Top Changes has ${topLevelBullets.length} items (max 5 required).`
    );
    failed = true;
  } else {
    console.log(
      `PASS docs policy: README Top Changes is present after Overview with ${topLevelBullets.length} item(s).`
    );
  }
}

// ── 2. Tiered docs freshness gate (repo-wide discovery) ──────────────────────
// These phrases identify features that are NOT yet shipped.
// They must never appear in "user_facing_strict" documents.
// They are allowed in "internal_planning_allowed" documents.
const USER_FACING_UNSHIPPED_PHRASES = [
  // Command Palette — planned for v1.10
  'Cmd/Ctrl + K',
  'Cmd/Ctrl+K',
  // Magic Mode — planned for v2.1
  'Magic Mode',
  // Workflow Automations — planned for v2.1
  'Workflow Automation',
];

const USER_FACING_STRICT_ALLOWLIST = new Set([
  'README.md',
  'docs/help-user-guide.md',
  'src/options/options.html',
]);

const HELP_SURFACE_ALLOWLIST = new Set(['docs/help-user-guide.md', 'src/options/options.html']);

const REQUIRED_HELP_CUES = [
  {
    key: 'history_compare_visual_diff',
    any: ['compare', 'visual diff'],
  },
  {
    key: 'queue_capture',
    any: ['queue current', 'queue window', 'run queue'],
  },
  {
    key: 'url_popup_quick_actions',
    any: ['copy all urls', 'txt/csv', 'email draft', 'clear', 'restore'],
  },
  {
    key: 'keyboard_shortcut_capture',
    any: ['alt+shift+p'],
  },
  {
    key: 'preview_editing_export',
    any: ['crop', 'blur', 'highlight', 'text', 'rectangle', 'emoji', 'png', 'jpg', 'pdf'],
  },
  {
    key: 'screenshots_diagnostics',
    any: ['diagnostic', 'slow', 'failure'],
  },
  {
    key: 'screenshots_bulk_actions',
    any: ['bulk'],
  },
  {
    key: 'settings_explicit_save',
    any: ['save settings'],
  },
  {
    key: 'smart_revisit_nudges',
    any: ['smart revisit nudges'],
  },
  {
    key: 'weekly_value_report',
    any: ['weekly value report'],
  },
  {
    key: 'storage_guardrails_autopurge',
    any: ['auto-purge', 'storage usage', '500 screenshots'],
  },
];

const INTERNAL_PLANNING_ALLOWED_PATTERNS = [
  /^docs\/adr\//i,
  /^docs\/.*roadmap.*\.md$/i,
  /^docs\/.*implementation-plan.*\.md$/i,
  /^docs\/.*(assessment|audit).*\.(md|html)$/i,
  /^docs\/.*todo.*\.md$/i,
];

const DOCS_DIR = path.join(root, 'docs');
const SELECTED_HTML_DOCS = [path.join(root, 'src/options/options.html')];

function toRepoRel(absPath) {
  return path.relative(root, absPath).split(path.sep).join('/');
}

function listMarkdownDocsInDir(dirAbs) {
  if (!fs.existsSync(dirAbs)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dirAbs, { withFileTypes: true })) {
    const abs = path.join(dirAbs, entry.name);
    if (entry.isDirectory()) {
      out.push(...listMarkdownDocsInDir(abs));
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      out.push(abs);
    }
  }
  return out;
}

function listRootMarkdownDocs() {
  const out = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (!entry.name.toLowerCase().endsWith('.md')) continue;
    out.push(path.join(root, entry.name));
  }
  return out;
}

function discoverDocs() {
  const discovered = [
    ...listRootMarkdownDocs(),
    ...listMarkdownDocsInDir(DOCS_DIR),
    ...SELECTED_HTML_DOCS.filter((absPath) => fs.existsSync(absPath)),
  ];
  const byRel = new Map();
  for (const absPath of discovered) {
    byRel.set(toRepoRel(absPath), absPath);
  }
  return [...byRel.entries()]
    .map(([relPath, absPath]) => ({ relPath, absPath }))
    .sort((a, b) => a.relPath.localeCompare(b.relPath));
}

function classifyDoc(relPath) {
  if (USER_FACING_STRICT_ALLOWLIST.has(relPath)) return 'user_facing_strict';
  if (INTERNAL_PLANNING_ALLOWED_PATTERNS.some((pattern) => pattern.test(relPath))) {
    return 'internal_planning_allowed';
  }
  return 'internal_planning_allowed';
}

const classified = {
  user_facing_strict: [],
  internal_planning_allowed: [],
};

for (const doc of discoverDocs()) {
  const cls = classifyDoc(doc.relPath);
  classified[cls].push(doc);
}

for (const doc of classified.user_facing_strict) {
  const text = fs.readFileSync(doc.absPath, 'utf8');
  const hits = USER_FACING_UNSHIPPED_PHRASES.filter((phrase) => text.includes(phrase));
  if (hits.length > 0) {
    console.error(
      `FAIL docs policy [user_facing_strict]: ${doc.relPath} references unshipped feature(s): ${hits.map((h) => `"${h}"`).join(', ')}`
    );
    failed = true;
  }
}

for (const doc of classified.user_facing_strict) {
  if (!HELP_SURFACE_ALLOWLIST.has(doc.relPath)) continue;
  const text = fs.readFileSync(doc.absPath, 'utf8').toLowerCase();
  const missingCues = REQUIRED_HELP_CUES.filter(
    (cue) => !cue.any.some((needle) => text.includes(needle))
  ).map((cue) => cue.key);
  if (missingCues.length > 0) {
    console.error(
      `FAIL docs policy [help_coverage]: ${doc.relPath} is missing shipped feature cue(s): ${missingCues.join(', ')}`
    );
    failed = true;
  }
}

if (!failed) {
  console.log(
    `PASS docs policy [user_facing_strict]: scanned ${classified.user_facing_strict.length} file(s).`
  );
  console.log(
    `PASS docs policy [help_coverage]: scanned ${HELP_SURFACE_ALLOWLIST.size} help surface file(s) with ${REQUIRED_HELP_CUES.length} required cue(s).`
  );
}

console.log(
  `PASS docs policy [internal_planning_allowed]: discovered ${classified.internal_planning_allowed.length} file(s); unshipped-feature mentions are allowed by policy.`
);

if (classified.user_facing_strict.length === 0) {
  console.error(
    'FAIL docs policy: user_facing_strict classification is empty (at least one strict doc is required).'
  );
  failed = true;
}

if (failed) process.exit(1);
