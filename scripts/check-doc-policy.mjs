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

// ── 2. Help-doc freshness gate ────────────────────────────────────────────────
// These phrases identify features that are NOT yet shipped. They must never
// appear in user-facing help files. Update this list whenever a feature ships
// (remove its entry) or a new unshipped feature is mistakenly documented (add entry).
const UNSHIPPED_PHRASES = [
  // Command Palette — planned for v1.10
  'Cmd/Ctrl + K',
  'Cmd/Ctrl+K',
  // Omnibox Actions — planned for v2.1
  'tc research',
  'tc star',
  'tc queue',
  'omnibox action',
  'Omnibox action',
  // URL Collector 2.0 views — planned for v2.0
  'Saved URL Views',
  'By Domain',
  // URL Tags — planned for v2.0
  'Add Tags to a URL',
  // URL Notes — planned for v2.0
  'Add a Note to a URL',
  // Magic Mode — planned for v2.1
  'Magic Mode',
  // Workflow Automations — planned for v2.1
  'Workflow Automation',
];

const HELP_FILES = [
  { label: 'docs/help-user-guide.md', path: path.join(root, 'docs/help-user-guide.md') },
  {
    label: 'src/options/options.html (Help & FAQ section)',
    path: path.join(root, 'src/options/options.html'),
  },
];

for (const file of HELP_FILES) {
  const text = fs.readFileSync(file.path, 'utf8');
  const hits = UNSHIPPED_PHRASES.filter((phrase) => text.includes(phrase));
  if (hits.length > 0) {
    console.error(
      `FAIL help-doc freshness: ${file.label} references unshipped feature(s): ${hits.map((h) => `"${h}"`).join(', ')}`
    );
    failed = true;
  } else {
    console.log(
      `PASS help-doc freshness: ${file.label} contains no references to unshipped features.`
    );
  }
}

if (failed) process.exit(1);
