import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function test(name, fn) {
  Promise.resolve()
    .then(fn)
    .then(() => process.stdout.write(`PASS ${name}\n`))
    .catch((err) => {
      process.stderr.write(`FAIL ${name}\n${err.stack}\n`);
      process.exitCode = 1;
    });
}

function createEventBus() {
  const listeners = [];
  return {
    addListener(fn) {
      listeners.push(fn);
    },
    listeners,
  };
}

async function importFresh(modulePath) {
  const url = pathToFileURL(modulePath);
  url.searchParams.set('t', String(Date.now() + Math.random()));
  return import(url.href);
}

const offscreenPath = path.resolve('src/offscreen/offscreen.js');

test('offscreen rejects invalid stitch payload before DB access', async () => {
  const onMessage = createEventBus();
  globalThis.chrome = { runtime: { onMessage } };

  await importFresh(offscreenPath);
  assert.equal(onMessage.listeners.length > 0, true);
  const listener = onMessage.listeners[0];

  let response = null;
  const keepAlive = listener(
    { type: 'OS_STITCH', payload: { id: '', totalW: 0, totalH: 0 } },
    {},
    (r) => {
      response = r;
    }
  );

  assert.equal(keepAlive, false);
  assert.equal(response.ok, false);
  assert.match(response.error, /Invalid stitch id|Invalid stitch dimensions/);
});
