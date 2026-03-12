import assert from 'node:assert/strict';
import {
  loadUrlList,
  saveUrlList,
  loadUrlUndoSnapshot,
  writeUrlsAndUndo,
  loadUrlRecords,
  setUrlRecordStar,
  setUrlRecordTags,
  setUrlRecordNote,
} from '../src/shared/repos/url-repo.js';

async function runTest(name, fn) {
  try {
    await fn();
    process.stdout.write(`PASS ${name}\n`);
  } catch (err) {
    process.stderr.write(`FAIL ${name}\n${err.stack}\n`);
    process.exitCode = 1;
  }
}

function createStorageMock(initial = {}) {
  const state = { ...initial };
  return {
    get(defaults, cb) {
      cb({ ...defaults, ...state });
    },
    set(payload, cb) {
      Object.assign(state, payload);
      cb?.();
    },
    state,
  };
}

await runTest('url repo loads and saves normalized URL list', async () => {
  const storageLocal = createStorageMock({ urls: ['https://a.com', 7, null, 'https://b.com'] });
  globalThis.chrome = {
    runtime: { lastError: null },
    storage: { local: storageLocal },
  };

  const loaded = await loadUrlList();
  assert.deepEqual(loaded, ['https://a.com', 'https://b.com']);

  await saveUrlList(['https://x.com', 123, 'https://y.com']);
  assert.deepEqual(storageLocal.state.urls, ['https://x.com', 'https://y.com']);
});

await runTest('url repo handles undo snapshot reads/writes', async () => {
  const storageLocal = createStorageMock({});
  globalThis.chrome = {
    runtime: { lastError: null },
    storage: { local: storageLocal },
  };

  const empty = await loadUrlUndoSnapshot();
  assert.equal(empty, null);

  await writeUrlsAndUndo({
    urls: ['https://now.com'],
    undoSnapshotUrls: ['https://prev.com', 8],
  });

  const snapshot = await loadUrlUndoSnapshot();
  assert.deepEqual(snapshot.urls, ['https://prev.com']);
  assert.deepEqual(storageLocal.state.urls, ['https://now.com']);
});

await runTest('url repo migrates string list to URL metadata records', async () => {
  const storageLocal = createStorageMock({
    urls: ['https://a.example.com', 'https://b.example.com'],
  });
  globalThis.indexedDB = undefined;
  globalThis.chrome = {
    runtime: { lastError: null },
    storage: { local: storageLocal },
  };

  const records = await loadUrlRecords();
  assert.equal(records.length, 2);
  assert.equal(records[0].url, 'https://a.example.com');
  assert.equal(records[0].starred, false);
  assert.ok(Number.isFinite(records[0].createdAt));
  assert.equal(typeof storageLocal.state.urlMetaFallbackV1, 'object');
});

await runTest('url repo persists starred state for URL records', async () => {
  const storageLocal = createStorageMock({ urls: ['https://star.example.com'] });
  globalThis.indexedDB = undefined;
  globalThis.chrome = {
    runtime: { lastError: null },
    storage: { local: storageLocal },
  };

  await loadUrlRecords();
  await setUrlRecordStar('https://star.example.com', true);
  const records = await loadUrlRecords();
  assert.equal(records[0].starred, true);
});

await runTest('url repo persists tags and enforces tag normalization', async () => {
  const storageLocal = createStorageMock({ urls: ['https://tags.example.com'] });
  globalThis.indexedDB = undefined;
  globalThis.chrome = {
    runtime: { lastError: null },
    storage: { local: storageLocal },
  };

  await loadUrlRecords();
  await setUrlRecordTags('https://tags.example.com', [
    '  Research  ',
    'Research',
    'follow-up',
    '',
    123,
  ]);

  const records = await loadUrlRecords();
  assert.deepEqual(records[0].tags, ['Research', 'follow-up']);
});

await runTest('url repo enforces max 10 tags per URL record', async () => {
  const storageLocal = createStorageMock({ urls: ['https://tag-limit.example.com'] });
  globalThis.indexedDB = undefined;
  globalThis.chrome = {
    runtime: { lastError: null },
    storage: { local: storageLocal },
  };

  const tags = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];
  await loadUrlRecords();
  await setUrlRecordTags('https://tag-limit.example.com', tags);
  const records = await loadUrlRecords();
  assert.equal(records[0].tags.length, 10);
  assert.deepEqual(records[0].tags, tags.slice(0, 10));
});

await runTest('url repo persists notes and enforces note normalization', async () => {
  const storageLocal = createStorageMock({ urls: ['https://note.example.com'] });
  globalThis.indexedDB = undefined;
  globalThis.chrome = {
    runtime: { lastError: null },
    storage: { local: storageLocal },
  };

  await loadUrlRecords();
  await setUrlRecordNote('https://note.example.com', '  keep this note  ');
  const records = await loadUrlRecords();
  assert.equal(records[0].note, 'keep this note');
});

await runTest('url repo enforces max 140 chars per URL note', async () => {
  const storageLocal = createStorageMock({ urls: ['https://note-limit.example.com'] });
  globalThis.indexedDB = undefined;
  globalThis.chrome = {
    runtime: { lastError: null },
    storage: { local: storageLocal },
  };

  const longNote = 'x'.repeat(180);
  await loadUrlRecords();
  await setUrlRecordNote('https://note-limit.example.com', longNote);
  const records = await loadUrlRecords();
  assert.equal(records[0].note.length, 140);
  assert.equal(records[0].note, longNote.slice(0, 140));
});
