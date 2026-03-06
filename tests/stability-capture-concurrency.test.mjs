import assert from 'node:assert/strict';
import { createCaptureService } from '../src/background/capture-service.js';

function test(name, fn) {
  Promise.resolve()
    .then(fn)
    .then(() => process.stdout.write(`PASS ${name}\n`))
    .catch((err) => {
      process.stderr.write(`FAIL ${name}\n${err.stack}\n`);
      process.exitCode = 1;
    });
}

test('capture service blocks overlapping capture for same tab', async () => {
  let releaseExec;
  const execPromise = new Promise((resolve) => {
    releaseExec = resolve;
  });

  globalThis.chrome = {
    runtime: { sendMessage: async () => ({}) },
    tabs: {
      sendMessage: async () => {
        throw new Error('stop-after-lock');
      },
      get: async () => ({ id: 1, windowId: 1, url: 'https://example.com', title: 'x', index: 0 }),
      captureVisibleTab: async () =>
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7+XWQAAAAASUVORK5CYII=',
      create: async () => ({}),
    },
    scripting: {
      executeScript: async () => execPromise,
    },
  };

  const service = createCaptureService();
  const first = service.captureTab(123).catch(() => null);

  const secondErr = await service.captureTab(123).catch((err) => err);
  assert.equal(secondErr instanceof Error, true);
  assert.match(secondErr.message, /already running/i);

  releaseExec();
  await first;
});
