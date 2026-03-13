import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const ENTRY_SURFACES = [
  'src/popup/popup.js',
  'src/history/history.js',
  'src/options/options.js',
  'src/preview/preview.js',
];

async function read(file) {
  return fs.readFile(file, 'utf8');
}

async function main() {
  for (const file of ENTRY_SURFACES) {
    const source = await read(file);
    assert.match(
      source,
      /import\s*\{[^}]*applySavedTheme[^}]*\}\s*from\s*['"][^'"]*shared\/theme\.js['"]/,
      `${file}: must import applySavedTheme`
    );
    assert.match(
      source,
      /await\s+applySavedTheme\s*\(\s*\)/,
      `${file}: must apply saved theme during init`
    );
  }

  process.stdout.write('PASS theme contract across primary surfaces\n');
}

main().catch((err) => {
  process.stderr.write(`FAIL theme contract across primary surfaces\n${err.stack}\n`);
  process.exitCode = 1;
});
