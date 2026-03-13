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
    proEnabled: 'on',
    ultraEnabled: null,
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
    theme: 'system',
    nudgesEnabled: false,
    notificationCadence: 'balanced',
    autoPurgeEnabled: true,
    capabilityTier: 'basic',
    defaultCaptureProfileId: 'research',
    proEnabled: false,
    ultraEnabled: false,
  });
});

await runTest('getSettings migrates legacy pro/ultra booleans into capabilityTier', async () => {
  const mockSyncUltra = createMockSyncStorage({ proEnabled: true, ultraEnabled: true });
  globalThis.chrome = { storage: { sync: mockSyncUltra } };
  const ultra = await getSettings();
  assert.equal(ultra.capabilityTier, 'ultra');
  assert.equal(ultra.proEnabled, true);
  assert.equal(ultra.ultraEnabled, true);

  const mockSyncPro = createMockSyncStorage({ proEnabled: true, ultraEnabled: false });
  globalThis.chrome = { storage: { sync: mockSyncPro } };
  const pro = await getSettings();
  assert.equal(pro.capabilityTier, 'pro');
  assert.equal(pro.proEnabled, true);
  assert.equal(pro.ultraEnabled, false);
});

await runTest('getSettings uses valid capabilityTier over legacy booleans', async () => {
  const mockSync = createMockSyncStorage({
    capabilityTier: 'basic',
    proEnabled: true,
    ultraEnabled: true,
  });
  globalThis.chrome = { storage: { sync: mockSync } };
  const settings = await getSettings();
  assert.equal(settings.capabilityTier, 'basic');
  assert.equal(settings.proEnabled, false);
  assert.equal(settings.ultraEnabled, false);
  assert.equal(settings.autoPurgeEnabled, true);
});

await runTest('getSettings preserves explicit autoPurgeEnabled false', async () => {
  const mockSync = createMockSyncStorage({ autoPurgeEnabled: false });
  globalThis.chrome = { storage: { sync: mockSync } };
  const settings = await getSettings();
  assert.equal(settings.autoPurgeEnabled, false);
});

await runTest('setSettings merges and persists normalized values', async () => {
  const mockSync = createMockSyncStorage({
    defaultExportFormat: 'png',
    defaultPdfPageSize: 'auto',
    autoDownloadMode: 'off',
    downloadDirectory: '',
    saveAs: false,
    fitClipboardToDocsLimit: true,
    theme: 'system',
    nudgesEnabled: false,
    notificationCadence: 'balanced',
    autoPurgeEnabled: true,
    capabilityTier: 'basic',
    defaultCaptureProfileId: 'research',
  });
  globalThis.chrome = { storage: { sync: mockSync } };

  const next = await setSettings({
    defaultExportFormat: 'jpg',
    autoDownloadMode: 'invalid-mode',
    autoDownload: true,
    downloadDirectory: '/Top Level/../Shots',
    fitClipboardToDocsLimit: false,
    theme: 'dark',
    nudgesEnabled: 1,
    notificationCadence: 'noisy',
    autoPurgeEnabled: false,
    capabilityTier: 'invalid-tier',
    defaultCaptureProfileId: 'not-a-real-profile',
    proEnabled: true,
  });

  assert.deepEqual(next, {
    defaultExportFormat: 'jpg',
    defaultPdfPageSize: 'auto',
    autoDownloadMode: 'after_preview',
    downloadDirectory: 'TopLevel/Shots',
    saveAs: false,
    fitClipboardToDocsLimit: false,
    theme: 'dark',
    nudgesEnabled: false,
    notificationCadence: 'balanced',
    autoPurgeEnabled: false,
    capabilityTier: 'pro',
    defaultCaptureProfileId: 'research',
    proEnabled: true,
    ultraEnabled: false,
  });

  const persisted = mockSync.getState();
  assert.equal(persisted.autoDownload, undefined);
  assert.equal(persisted.defaultExportFormat, 'jpg');
  assert.equal(persisted.autoDownloadMode, 'after_preview');
  assert.equal(persisted.downloadDirectory, 'TopLevel/Shots');
  assert.equal(persisted.theme, 'dark');
  assert.equal(persisted.nudgesEnabled, false);
  assert.equal(persisted.notificationCadence, 'balanced');
  assert.equal(persisted.autoPurgeEnabled, false);
  assert.equal(persisted.capabilityTier, 'pro');
  assert.equal(persisted.defaultCaptureProfileId, 'research');
  assert.equal(persisted.proEnabled, undefined);
  assert.equal(persisted.ultraEnabled, undefined);
});
