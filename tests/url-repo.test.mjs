import assert from 'node:assert/strict';
import {
  loadUrlList,
  saveUrlList,
  loadUrlUndoSnapshot,
  writeUrlsAndUndo,
  loadUrlRecords,
  setUrlRecordStar,
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
