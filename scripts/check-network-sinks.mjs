import fs from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'espree';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');

const FILE_ALLOWLIST = new Map([
  // Capture pipeline converts local data URLs to Blobs.
  [path.join(SRC_DIR, 'background', 'capture-service.js'), new Set(['fetch'])],
  // Guardrail wrapper is the explicit gateway for roadmap fetch usage.
  [path.join(SRC_DIR, 'shared', 'roadmap-guardrails.js'), new Set(['fetch'])],
]);

async function listFiles(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await listFiles(full)));
      continue;
    }
    if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) out.push(full);
  }
  return out;
}

function walk(node, visit) {
  if (!node || typeof node !== 'object') return;
  visit(node);
  for (const value of Object.values(node)) {
    if (!value) continue;
    if (Array.isArray(value)) {
      for (const child of value) walk(child, visit);
    } else if (typeof value === 'object' && value.type) {
      walk(value, visit);
    }
  }
}

function nodeLabel(node) {
  if (node.type === 'CallExpression' && node.callee?.type === 'Identifier') {
    if (node.callee.name === 'fetch') return 'fetch';
  }
  if (
    node.type === 'CallExpression' &&
    node.callee?.type === 'MemberExpression' &&
    node.callee.object?.type === 'Identifier' &&
    node.callee.property?.type === 'Identifier' &&
    node.callee.object.name === 'navigator' &&
    node.callee.property.name === 'sendBeacon'
  ) {
    return 'sendBeacon';
  }
  if (node.type === 'NewExpression' && node.callee?.type === 'Identifier') {
    if (node.callee.name === 'WebSocket') return 'WebSocket';
    if (node.callee.name === 'XMLHttpRequest') return 'XMLHttpRequest';
  }
  return null;
}

function isAllowed(file, label) {
  const allowed = FILE_ALLOWLIST.get(file);
  return Boolean(allowed && allowed.has(label));
}

async function main() {
  const files = await listFiles(SRC_DIR);
  const violations = [];

  for (const file of files) {
    const text = await fs.readFile(file, 'utf8');
    const ast = parse(text, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      loc: true,
    });

    walk(ast, (node) => {
      const label = nodeLabel(node);
      if (!label) return;
      if (isAllowed(file, label)) return;
      violations.push({
        file: path.relative(ROOT, file),
        label,
        line: node.loc?.start?.line ?? 0,
      });
    });
  }

  if (violations.length > 0) {
    console.error('Network sink policy violations found:');
    for (const v of violations) {
      console.error(`- ${v.file}:${v.line} [${v.label}]`);
    }
    process.exit(1);
  }

  console.log('PASS network sink policy: fetch/XHR/WebSocket/sendBeacon usage is constrained.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
