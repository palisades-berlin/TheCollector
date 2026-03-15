import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseMarkerBlocks, validateMarkerSync } from '../scripts/marker-sync-lib.mjs';

function testParseMarkerBlocks() {
  const text = ['<!-- HELP_RULES:START -->', 'line a', 'line b', '<!-- HELP_RULES:END -->'].join(
    '\n'
  );
  const blocks = parseMarkerBlocks(text, 'sample.md');
  assert.equal(blocks.has('HELP_RULES'), true);
  assert.equal(blocks.get('HELP_RULES').content, 'line a\nline b');
}

function testParseErrors() {
  assert.throws(() => parseMarkerBlocks('<!-- X:END -->', 'bad.md'), /END marker without START/);
  assert.throws(() => parseMarkerBlocks('<!-- X:START -->', 'bad.md'), /START marker without END/);
  assert.throws(
    () =>
      parseMarkerBlocks(
        '<!-- X:START -->\n<!-- X:END -->\n<!-- X:START -->\n<!-- X:END -->',
        'bad.md'
      ),
    /duplicate marker id/
  );
}

function writeFile(root, relPath, content) {
  const abs = path.join(root, relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
}

function testValidateSync() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'marker-sync-test-'));
  try {
    writeFile(
      root,
      'docs/marker-sync-contract.json',
      JSON.stringify(
        {
          allowedMarkerIds: ['A'],
          requiredMarkersByFile: {
            'a.md': ['A'],
            'b.md': ['A'],
          },
          canonicalMirrors: [{ id: 'A', canonical: 'a.md', mirrors: ['b.md'] }],
        },
        null,
        2
      )
    );
    writeFile(root, 'a.md', '<!-- A:START -->\nvalue\n<!-- A:END -->\n');
    writeFile(root, 'b.md', '<!-- A:START -->\nvalue\n<!-- A:END -->\n');
    assert.deepEqual(validateMarkerSync(root).errors, []);

    writeFile(root, 'b.md', '<!-- A:START -->\nchanged\n<!-- A:END -->\n');
    const mismatches = validateMarkerSync(root).errors.join('\n');
    assert.match(mismatches, /Marker mismatch for A/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

testParseMarkerBlocks();
testParseErrors();
testValidateSync();
process.stdout.write('PASS marker sync tests\n');
