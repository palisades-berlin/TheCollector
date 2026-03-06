import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');

const DENY_PATTERNS = [
  { label: 'external-http', regex: /\bhttps?:\/\//g },
  { label: 'sendBeacon', regex: /\bnavigator\.sendBeacon\s*\(/g },
  { label: 'websocket', regex: /\bnew\s+WebSocket\s*\(/g },
  { label: 'fetch-external-literal', regex: /\bfetch\s*\(\s*['"]https?:\/\//g },
];

const ALLOWLIST = new Map([
  [path.join(SRC_DIR, 'shared', 'roadmap-guardrails.js'), new Set(['external-http'])],
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

function isAllowed(file, label) {
  const allowed = ALLOWLIST.get(file);
  return Boolean(allowed && allowed.has(label));
}

function lineFromIndex(text, index) {
  return text.slice(0, index).split('\n').length;
}

async function main() {
  const files = await listFiles(SRC_DIR);
  const violations = [];

  for (const file of files) {
    const text = await fs.readFile(file, 'utf8');
    for (const pattern of DENY_PATTERNS) {
      if (isAllowed(file, pattern.label)) continue;
      for (const match of text.matchAll(pattern.regex)) {
        violations.push({
          file,
          label: pattern.label,
          line: lineFromIndex(text, match.index ?? 0),
          snippet: match[0],
        });
      }
    }
  }

  if (violations.length > 0) {
    console.error('Security policy violations found:');
    for (const v of violations) {
      console.error(`- ${path.relative(ROOT, v.file)}:${v.line} [${v.label}] ${v.snippet}`);
    }
    process.exit(1);
  }

  console.log('PASS security policy: no disallowed external network/tracking patterns in src/.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
