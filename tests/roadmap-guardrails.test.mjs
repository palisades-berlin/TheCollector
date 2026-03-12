import assert from 'node:assert/strict';
import {
  assertLocalOnlyUrl,
  assertNoTrackingPayload,
  enforceRoadmapActionPolicy,
  isLocalOnlyUrl,
  roadmapFeatureFetch,
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

async function testAsync(name, fn) {
  try {
    await fn();
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
  assert.throws(
    () => assertLocalOnlyUrl('https://api.example.com', 'magic_mode'),
    /Blocked external/
  );
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
    () => enforceRoadmapActionPolicy('magic_mode', { capabilityTier: 'pro' }, { event: 'run' }),
    /not available/
  );

  assert.throws(
    () =>
      enforceRoadmapActionPolicy(
        'smart_save_profiles',
        { capabilityTier: 'pro' },
        { deviceId: 'x' }
      ),
    /Blocked tracking payload key/
  );

  assert.doesNotThrow(() =>
    enforceRoadmapActionPolicy('smart_save_profiles', { capabilityTier: 'pro' }, { event: 'run' })
  );
});

await testAsync('roadmapFeatureFetch blocks unavailable tier before issuing fetch', async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    return { ok: true };
  };

  try {
    await assert.rejects(
      roadmapFeatureFetch('magic_mode', { capabilityTier: 'pro' }, '/local/api', { body: {} }),
      /not available/
    );
    assert.equal(fetchCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

await testAsync('roadmapFeatureFetch blocks external URLs', async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    return { ok: true };
  };

  try {
    await assert.rejects(
      roadmapFeatureFetch('smart_save_profiles', { capabilityTier: 'pro' }, 'https://example.com', {
        body: {},
      }),
      /Blocked external/
    );
    assert.equal(fetchCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

await testAsync('roadmapFeatureFetch blocks tracking payload in init.body object', async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    return { ok: true };
  };

  try {
    await assert.rejects(
      roadmapFeatureFetch('smart_save_profiles', { capabilityTier: 'pro' }, '/local/api', {
        body: { deviceId: 'abc' },
      }),
      /Blocked tracking payload key/
    );
    assert.equal(fetchCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

await testAsync('roadmapFeatureFetch allows local calls with non-tracking payload', async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  const expectedResult = { ok: true, status: 200 };
  globalThis.fetch = async (input, init) => {
    fetchCalls += 1;
    assert.equal(input, '/local/api');
    assert.deepEqual(init, { method: 'POST', body: { event: 'run' } });
    return expectedResult;
  };

  try {
    const result = await roadmapFeatureFetch(
      'smart_save_profiles',
      { capabilityTier: 'pro' },
      '/local/api',
      { method: 'POST', body: { event: 'run' } }
    );
    assert.equal(fetchCalls, 1);
    assert.equal(result, expectedResult);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
