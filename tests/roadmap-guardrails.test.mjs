import assert from 'node:assert/strict';
import {
  assertLocalOnlyUrl,
  assertNoTrackingPayload,
  enforceRoadmapActionPolicy,
  isLocalOnlyUrl,
} from '../src/shared/roadmap-guardrails.js';

function test(name, fn) {
  try {
    fn();
    process.stdout.write(`PASS ${name}\n`);
  } catch (err) {
    process.stderr.write(`FAIL ${name}\n${err.stack}\n`);
    process.exitCode = 1;
  }
}

test('isLocalOnlyUrl allows extension-local and data/blob schemes', () => {
  assert.equal(isLocalOnlyUrl('/local/path'), true);
  assert.equal(isLocalOnlyUrl('chrome-extension://abc/page.html'), true);
  assert.equal(isLocalOnlyUrl('moz-extension://abc/page.html'), true);
  assert.equal(isLocalOnlyUrl('data:text/plain,hello'), true);
  assert.equal(isLocalOnlyUrl('blob:chrome-extension://abc/id'), true);
});

test('isLocalOnlyUrl blocks external network schemes', () => {
  assert.equal(isLocalOnlyUrl('https://example.com'), false);
  assert.equal(isLocalOnlyUrl('http://localhost:3000'), false);
  assert.equal(isLocalOnlyUrl('wss://example.com/ws'), false);
});

test('assertLocalOnlyUrl throws for external requests', () => {
  assert.throws(() => assertLocalOnlyUrl('https://api.example.com', 'magic_mode'), /Blocked external/);
});

test('assertNoTrackingPayload blocks tracking-like keys recursively', () => {
  assert.throws(
    () => assertNoTrackingPayload({ event: 'x', userId: '123' }, 'weekly_value_report'),
    /Blocked tracking payload key/
  );
  assert.throws(
    () => assertNoTrackingPayload({ nested: { analyticsMeta: 'x' } }, 'weekly_value_report'),
    /Blocked tracking payload key/
  );
});

test('enforceRoadmapActionPolicy checks both tier gate and payload policy', () => {
  assert.throws(
    () =>
      enforceRoadmapActionPolicy('magic_mode', { capabilityTier: 'pro' }, { event: 'run' }),
    /not available/
  );

  assert.throws(
    () =>
      enforceRoadmapActionPolicy('smart_save_profiles', { capabilityTier: 'pro' }, { deviceId: 'x' }),
    /Blocked tracking payload key/
  );

  assert.doesNotThrow(() =>
    enforceRoadmapActionPolicy('smart_save_profiles', { capabilityTier: 'pro' }, { event: 'run' })
  );
});
