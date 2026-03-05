import assert from 'node:assert/strict';
import { getSettings, setSettings } from '../src/shared/settings.js';

async function runTest(name, fn) {
  try {
    await fn();
    process.stdout.write(`PASS ${name}\n`);
  } catch (err) {
    process.stderr.write(`FAIL ${name}\n${err.stack}\n`);
    process.exitCode = 1;
  }
}

function createMockSyncStorage(initial = {}) {
  let state = { ...initial };
  return {
    async get(defaults) {
      return { ...defaults, ...state };
    },
    async set(payload) {
      state = { ...state, ...payload };
    },
    getState() {
      return { ...state };
    },
  };
}

await runTest('getSettings normalizes invalid values and legacy autoDownload flag', async () => {
  const mockSync = createMockSyncStorage({
    defaultExportFormat: 'gif',
    defaultPdfPageSize: 'tabloid',
    autoDownload: true,
    downloadDirectory: '../Unsafe Folder//nested',
    saveAs: 1,
    fitClipboardToDocsLimit: 'yes',
  });
  globalThis.chrome = { storage: { sync: mockSync } };

  const settings = await getSettings();
  assert.deepEqual(settings, {
    defaultExportFormat: 'png',
    defaultPdfPageSize: 'auto',
    autoDownloadMode: 'after_preview',
    downloadDirectory: 'UnsafeFolder/nested',
    saveAs: true,
    fitClipboardToDocsLimit: true,
  });
});

await runTest('setSettings merges and persists normalized values', async () => {
  const mockSync = createMockSyncStorage({
    defaultExportFormat: 'png',
    defaultPdfPageSize: 'auto',
    autoDownloadMode: 'off',
    downloadDirectory: '',
    saveAs: false,
    fitClipboardToDocsLimit: true,
  });
  globalThis.chrome = { storage: { sync: mockSync } };

  const next = await setSettings({
    defaultExportFormat: 'jpg',
    autoDownloadMode: 'invalid-mode',
    autoDownload: true,
    downloadDirectory: '/Top Level/../Shots',
    fitClipboardToDocsLimit: false,
  });

  assert.deepEqual(next, {
    defaultExportFormat: 'jpg',
    defaultPdfPageSize: 'auto',
    autoDownloadMode: 'after_preview',
    downloadDirectory: 'TopLevel/Shots',
    saveAs: false,
    fitClipboardToDocsLimit: false,
  });

  const persisted = mockSync.getState();
  assert.equal(persisted.autoDownload, undefined);
  assert.equal(persisted.defaultExportFormat, 'jpg');
  assert.equal(persisted.autoDownloadMode, 'after_preview');
  assert.equal(persisted.downloadDirectory, 'TopLevel/Shots');
});
