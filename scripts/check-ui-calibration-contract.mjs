import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const FIGMA_URL =
  'https://www.figma.com/design/sECUN6qSqUygWoG7PhC548/THECollector---UI-Kit---Screens?t=UVQ55HTnnPvLrqyo-0';
const FIGMA_KEY = 'sECUN6qSqUygWoG7PhC548';

const FILES = [
  path.join(ROOT, 'tests/visual/ui-parity.spec.mjs'),
  path.join(ROOT, 'docs/ui-handoff.md'),
];

function assertContains(content, value, label, filePath) {
  if (!content.includes(value)) {
    throw new Error(`${label} missing in ${filePath}`);
  }
}

async function main() {
  for (const filePath of FILES) {
    const content = await fs.readFile(filePath, 'utf8');
    assertContains(content, FIGMA_URL, 'Canonical Figma URL', filePath);
    assertContains(content, FIGMA_KEY, 'Canonical Figma file key', filePath);
  }

  console.log('PASS UI calibration contract: Figma source-of-truth mapping is aligned.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
