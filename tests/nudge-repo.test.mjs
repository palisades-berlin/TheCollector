import assert from 'node:assert/strict';
import {
  dismissRevisitNudge,
  loadRevisitNudgeState,
  snoozeRevisitNudges,
} from '../src/shared/repos/nudge-repo.js';

async function runTest(name, fn) {
  try {
    await fn();
    process.stdout.write(`PASS ${name}\n`);
  } catch (err) {
    process.stderr.write(`FAIL ${name}\n${err.stack}\n`);
    process.exitCode = 1;
  }
}

function createMockStorage(initial = {}) {
  let state = { ...initial };
  return {
    local: {
      async get(defaults) {
        return { ...defaults, ...state };
      },
      async set(payload) {
        state = { ...state, ...payload };
      },
    },
  };
}

await runTest('dismissRevisitNudge persists dismissal by id', async () => {
  globalThis.chrome = { storage: createMockStorage() };
  await dismissRevisitNudge('shot-1', 1000);
  const state = await loadRevisitNudgeState();
  assert.equal(state.dismissedById['shot-1'], 1000);
});

await runTest('snoozeRevisitNudges persists snooze window', async () => {
  globalThis.chrome = { storage: createMockStorage() };
  await snoozeRevisitNudges(5000, 2000);
  const state = await loadRevisitNudgeState();
  assert.equal(state.snoozedUntil, 7000);
});
