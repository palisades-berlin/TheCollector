import assert from 'node:assert/strict';
import { buildThumbSourceBlobs } from '../src/history/history-thumbs.js';

async function runTest(name, fn) {
  try {
    await fn();
    process.stdout.write(`PASS ${name}\n`);
  } catch (err) {
    process.stderr.write(`FAIL ${name}\n${err.stack}\n`);
    process.exitCode = 1;
  }
}

await runTest(
  'buildThumbSourceBlobs prioritizes dedicated thumb, then record thumb, then full blob',
  async () => {
    const fromStore = new Blob(['store'], { type: 'image/png' });
    const recordThumb = new Blob(['thumb'], { type: 'image/png' });
    const fullBlob = new Blob(['full'], { type: 'image/png' });

    const out = buildThumbSourceBlobs({
      thumbEntry: { id: 'a', thumbBlob: fromStore },
      record: { id: 'a', thumbBlob: recordThumb, blob: fullBlob },
    });

    assert.equal(out.length, 3);
    assert.equal(out[0], fromStore);
    assert.equal(out[1], recordThumb);
    assert.equal(out[2], fullBlob);
  }
);

await runTest('buildThumbSourceBlobs omits missing or empty blobs', async () => {
  const fullBlob = new Blob(['full'], { type: 'image/png' });
  const empty = new Blob([]);

  const out = buildThumbSourceBlobs({
    thumbEntry: { id: 'b', thumbBlob: empty },
    record: { id: 'b', thumbBlob: null, blob: fullBlob },
  });

  assert.deepEqual(out, [fullBlob]);
});
