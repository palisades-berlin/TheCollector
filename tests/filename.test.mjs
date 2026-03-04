import assert from 'node:assert/strict';
import {
  sanitizeFilenameSegment,
  sanitizeDirPath,
} from '../src/shared/filename.js';

function test(name, fn) {
  try {
    fn();
    process.stdout.write(`PASS ${name}\n`);
  } catch (err) {
    process.stderr.write(`FAIL ${name}\n${err.stack}\n`);
    process.exitCode = 1;
  }
}

test('sanitizeFilenameSegment removes reserved characters and trims', () => {
  const out = sanitizeFilenameSegment('  bad<>:"/\\|?* name  ');
  assert.equal(out, 'bad name');
});

test('sanitizeDirPath strips traversal and unsafe characters', () => {
  const out = sanitizeDirPath('../My Folder//nested/..//shots');
  assert.equal(out, 'MyFolder/nested/shots');
});

test('sanitizeDirPath returns empty string for falsy input', () => {
  assert.equal(sanitizeDirPath(''), '');
  assert.equal(sanitizeDirPath(null), '');
});
