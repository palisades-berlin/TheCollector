import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function createEventBus() {
  const listeners = [];
  return {
    addListener(fn) {
      listeners.push(fn);
    },
    listeners,
  };
}

function createChromeMock() {
  const runtimeOnMessage = createEventBus();
  const syncStore = {};
  const sessionStore = {};
  return {
    chrome: {
      runtime: {
        onInstalled: createEventBus(),
        onStartup: createEventBus(),
        onMessage: runtimeOnMessage,
        sendMessage: async () => ({}),
        getURL: (p) => `chrome-extension://test/${p}`,
      },
      commands: { onCommand: createEventBus() },
      contextMenus: {
        onClicked: createEventBus(),
        removeAll: (cb) => cb?.(),
        create: () => {},
      },
      omnibox: {
        onInputChanged: createEventBus(),
        onInputEntered: createEventBus(),
      },
      tabs: {
        query: async () => [],
        create: async () => ({}),
      },
      storage: {
        sync: {
          get: async (defaults) => ({ ...(defaults || {}), ...syncStore }),
          set: async (next) => Object.assign(syncStore, next || {}),
        },
        session: {
          get: async (defaults) => ({ ...(defaults || {}), ...sessionStore }),
          set: async (next) => Object.assign(sessionStore, next || {}),
        },
      },
      permissions: {
        contains: async () => false,
        request: async () => false,
        remove: async () => false,
      },
      downloads: {
        download: async () => 1,
      },
      scripting: {
        executeScript: async () => [],
      },
    },
    runtimeOnMessage,
    syncStore,
    sessionStore,
  };
}

async function importFresh(modulePath) {
  const url = pathToFileURL(modulePath);
  url.searchParams.set('t', String(Date.now() + Math.random()));
  return import(url.href);
}

const swPath = path.resolve('src/background/service-worker.js');

async function testInvalidCaptureStartPayload() {
  const { chrome, runtimeOnMessage } = createChromeMock();
  globalThis.chrome = chrome;
  await importFresh(swPath);

  assert.equal(runtimeOnMessage.listeners.length > 0, true);
  const listener = runtimeOnMessage.listeners[0];

  let response = null;
  const keepAlive = listener({ type: 'CAPTURE_START', payload: { tabId: 0 } }, {}, (r) => {
    response = r;
  });

  assert.equal(keepAlive, false);
  assert.deepEqual(response, { ok: false, error: 'Invalid tab id' });
  process.stdout.write('PASS service worker rejects invalid CAPTURE_START payload\n');
}

async function testInvalidCaptureStartProfilePayload() {
  const { chrome, runtimeOnMessage } = createChromeMock();
  globalThis.chrome = chrome;
  await importFresh(swPath);

  const listener = runtimeOnMessage.listeners[0];
  let response = null;
  const keepAlive = listener(
    { type: 'CAPTURE_START', payload: { tabId: 1, profileId: 99 } },
    {},
    (r) => {
      response = r;
    }
  );

  assert.equal(keepAlive, false);
  assert.deepEqual(response, { ok: false, error: 'Invalid profile id' });
  process.stdout.write('PASS service worker rejects invalid CAPTURE_START profile payload\n');
}

async function testInvalidCaptureStartSuppressPreviewPayload() {
  const { chrome, runtimeOnMessage } = createChromeMock();
  globalThis.chrome = chrome;
  await importFresh(swPath);

  const listener = runtimeOnMessage.listeners[0];
  let response = null;
  const keepAlive = listener(
    { type: 'CAPTURE_START', payload: { tabId: 1, suppressPreviewOpen: 'true' } },
    {},
    (r) => {
      response = r;
    }
  );

  assert.equal(keepAlive, false);
  assert.deepEqual(response, { ok: false, error: 'Invalid suppressPreviewOpen flag' });
  process.stdout.write(
    'PASS service worker rejects invalid CAPTURE_START suppressPreviewOpen payload\n'
  );
}

async function testInvalidPtDownloadPayload() {
  const { chrome, runtimeOnMessage } = createChromeMock();
  globalThis.chrome = chrome;
  await importFresh(swPath);

  const listener = runtimeOnMessage.listeners[0];
  let response = null;
  const keepAlive = listener({ type: 'PT_DOWNLOAD', payload: { ext: 'png' } }, {}, (r) => {
    response = r;
  });

  assert.equal(keepAlive, true);
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(response?.ok, false);
  assert.match(response?.error || '', /missing blob/i);
  process.stdout.write('PASS service worker rejects invalid PT_DOWNLOAD payload\n');
}

async function testInvalidCaptureQueuePayload() {
  const { chrome, runtimeOnMessage } = createChromeMock();
  globalThis.chrome = chrome;
  await importFresh(swPath);

  const listener = runtimeOnMessage.listeners[0];
  let response = null;
  const keepAlive = listener({ type: 'CAPTURE_QUEUE_START', payload: { tabIds: [] } }, {}, (r) => {
    response = r;
  });

  assert.equal(keepAlive, false);
  assert.deepEqual(response, { ok: false, error: 'Invalid queue tab ids' });
  process.stdout.write('PASS service worker rejects invalid CAPTURE_QUEUE_START payload\n');
}

async function testUnknownMessageType() {
  const { chrome, runtimeOnMessage } = createChromeMock();
  globalThis.chrome = chrome;
  await importFresh(swPath);

  const listener = runtimeOnMessage.listeners[0];
  const keepAlive = listener({ type: 'UNKNOWN_TYPE' }, {}, () => {});
  assert.equal(keepAlive, undefined);
  process.stdout.write('PASS service worker ignores unknown message types\n');
}

async function testOmniboxRestrictedForNonUltra() {
  const { chrome } = createChromeMock();
  let openedUrl = '';
  chrome.tabs.query = async () => [{ id: 7, url: 'https://example.com', title: 'Example' }];
  chrome.tabs.create = async ({ url }) => {
    openedUrl = url;
    return { id: 9 };
  };

  globalThis.chrome = chrome;
  await importFresh(swPath);
  const onInputEntered = chrome.omnibox.onInputEntered.listeners[0];
  assert.equal(typeof onInputEntered, 'function');

  await onInputEntered('tc queue');
  assert.match(openedUrl, /src\/options\/options\.html$/);
  process.stdout.write('PASS omnibox actions are gated for non-Ultra tier\n');
}

async function testOmniboxResearchQueuesTabForUltra() {
  const { chrome, syncStore, sessionStore } = createChromeMock();
  syncStore.capabilityTier = 'ultra';
  chrome.tabs.query = async () => [{ id: 11, url: 'https://example.com', title: 'Example' }];

  globalThis.chrome = chrome;
  await importFresh(swPath);
  const onInputEntered = chrome.omnibox.onInputEntered.listeners[0];
  assert.equal(typeof onInputEntered, 'function');

  await onInputEntered('tc research');
  const queue = sessionStore.popupCaptureQueueV1;
  const session = sessionStore.captureQueueSessionV1;
  assert.equal(Array.isArray(queue), true);
  assert.equal(queue.length, 1);
  assert.equal(queue[0].tabId, 11);
  assert.equal(session?.profileId, 'research');
  process.stdout.write('PASS omnibox research queues current tab for Ultra tier\n');
}

async function run() {
  try {
    await testInvalidCaptureStartPayload();
    await testInvalidCaptureStartProfilePayload();
    await testInvalidCaptureStartSuppressPreviewPayload();
    await testInvalidCaptureQueuePayload();
    await testInvalidPtDownloadPayload();
    await testUnknownMessageType();
    await testOmniboxRestrictedForNonUltra();
    await testOmniboxResearchQueuesTabForUltra();
  } catch (err) {
    process.stderr.write(`FAIL integration service worker suite\n${err.stack}\n`);
    process.exitCode = 1;
  }
}

await run();
