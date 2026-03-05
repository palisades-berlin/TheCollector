import assert from 'node:assert/strict';
import {
  sanitizeFilenameSegment,
  sanitizeDirPath,
  buildDownloadFilename,
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

test('buildDownloadFilename composes sanitized path and part suffix', () => {
  const out = buildDownloadFilename({
    title: '  bad<>name  ',
    index: 1,
    total: 3,
    ext: 'png',
    directory: '../Shots',
    timestamp: new Date('2026-03-05T12:34:56.789Z'),
  });
  assert.equal(out, 'Shots/badname-2026-03-05T12-34-56-789Z-part-2.png');
});
