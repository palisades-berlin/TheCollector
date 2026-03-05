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

async function testUnknownMessageType() {
  const { chrome, runtimeOnMessage } = createChromeMock();
  globalThis.chrome = chrome;
  await importFresh(swPath);

  const listener = runtimeOnMessage.listeners[0];
  const keepAlive = listener({ type: 'UNKNOWN_TYPE' }, {}, () => {});
  assert.equal(keepAlive, undefined);
  process.stdout.write('PASS service worker ignores unknown message types\n');
}

async function run() {
  try {
    await testInvalidCaptureStartPayload();
    await testInvalidPtDownloadPayload();
    await testUnknownMessageType();
  } catch (err) {
    process.stderr.write(`FAIL integration service worker suite\n${err.stack}\n`);
    process.exitCode = 1;
  }
}

await run();
