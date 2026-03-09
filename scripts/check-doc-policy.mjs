#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const readmePath = path.join(root, 'README.md');
const text = fs.readFileSync(readmePath, 'utf8');

const overviewIdx = text.indexOf('## Overview');
const topChangesIdx = text.indexOf('## Top Changes');
if (overviewIdx === -1 || topChangesIdx === -1 || topChangesIdx < overviewIdx) {
  console.error('FAIL docs policy: README must contain "## Top Changes" after "## Overview".');
  process.exit(1);
}

const sectionStart = topChangesIdx + '## Top Changes'.length;
const rest = text.slice(sectionStart);
const nextHeading = rest.search(/\n##\s+/);
const topChangesSection = nextHeading === -1 ? rest : rest.slice(0, nextHeading);
const topLevelBullets = topChangesSection
  .split('\n')
  .map((line) => line.trimEnd())
  .filter((line) => /^- /.test(line));

if (topLevelBullets.length === 0) {
  console.error('FAIL docs policy: README Top Changes must contain at least one bullet.');
  process.exit(1);
}

if (topLevelBullets.length > 5) {
  console.error(
    `FAIL docs policy: README Top Changes has ${topLevelBullets.length} items (max 5 required).`
  );
  process.exit(1);
}

console.log(
  `PASS docs policy: README Top Changes is present after Overview with ${topLevelBullets.length} item(s).`
);
