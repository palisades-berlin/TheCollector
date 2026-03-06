import assert from 'node:assert/strict';
import {
  buildDefaultNudgeState,
  evaluateRevisitNudge,
  normalizeNotificationCadence,
  normalizeNudgeState,
} from '../src/shared/nudges.js';

function test(name, fn) {
  try {
    fn();
    process.stdout.write(`PASS ${name}\n`);
  } catch (err) {
    process.stderr.write(`FAIL ${name}\n${err.stack}\n`);
    process.exitCode = 1;
  }
}

test('normalizeNotificationCadence keeps supported values', () => {
  assert.equal(normalizeNotificationCadence('low'), 'low');
  assert.equal(normalizeNotificationCadence('high'), 'high');
  assert.equal(normalizeNotificationCadence('balanced'), 'balanced');
  assert.equal(normalizeNotificationCadence('invalid'), 'balanced');
});

test('normalizeNudgeState sanitizes raw state', () => {
  const normalized = normalizeNudgeState({
    dismissedById: { a: Date.now(), b: 'x' },
    snoozedUntil: 'not-a-number',
  });
  assert.equal(typeof normalized.dismissedById.a, 'number');
  assert.equal(normalized.dismissedById.b, undefined);
  assert.equal(normalized.snoozedUntil, 0);
});

test('evaluateRevisitNudge returns candidate by cadence threshold', () => {
  const now = Date.now();
  const records = [
    { id: 'new', timestamp: now - 36 * 60 * 60 * 1000, title: 'Recent' },
    { id: 'old', timestamp: now - 8 * 24 * 60 * 60 * 1000, title: 'Old item' },
  ];

  const low = evaluateRevisitNudge(records, { cadence: 'low', now });
  assert.equal(low?.id, 'old');

  const high = evaluateRevisitNudge(records, { cadence: 'high', now });
  assert.equal(high?.id, 'new');
});

test('evaluateRevisitNudge respects dismiss and snooze state', () => {
  const now = Date.now();
  const records = [{ id: 'a', timestamp: now - 10 * 24 * 60 * 60 * 1000, title: 'A' }];

  const dismissed = evaluateRevisitNudge(records, {
    cadence: 'low',
    now,
    state: { dismissedById: { a: now - 1000 }, snoozedUntil: 0 },
  });
  assert.equal(dismissed, null);

  const snoozed = evaluateRevisitNudge(records, {
    cadence: 'low',
    now,
    state: { dismissedById: {}, snoozedUntil: now + 1000 },
  });
  assert.equal(snoozed, null);

  const fallbackState = buildDefaultNudgeState();
  const active = evaluateRevisitNudge(records, {
    cadence: 'low',
    now,
    state: fallbackState,
  });
  assert.equal(active?.id, 'a');
});
