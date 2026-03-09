import assert from 'node:assert/strict';
import { CAPTURE_PROFILE, DEFAULT_CAPTURE_PROFILE_ID } from '../src/shared/capture-profiles.js';
import {
  buildCaptureQueuePayload,
  buildCaptureStartPayload,
} from '../src/popup/popup-profile-payload.js';

function test(name, fn) {
  try {
    fn();
    process.stdout.write(`PASS ${name}\n`);
  } catch (err) {
    process.stderr.write(`FAIL ${name}\n${err.stack}\n`);
    process.exitCode = 1;
  }
}

test('builds capture payload without profile by default', () => {
  assert.deepEqual(buildCaptureStartPayload(9), { tabId: 9 });
});

test('builds capture payload with explicit canonical profile', () => {
  assert.deepEqual(buildCaptureStartPayload(9, 'Private'), {
    tabId: 9,
    profileId: CAPTURE_PROFILE.PRIVATE,
  });
  assert.deepEqual(buildCaptureStartPayload(9, 'legacy-id'), {
    tabId: 9,
    profileId: DEFAULT_CAPTURE_PROFILE_ID,
  });
});

test('adds suppressPreviewOpen only when explicitly true', () => {
  assert.deepEqual(buildCaptureStartPayload(7, 'research', { suppressPreviewOpen: true }), {
    tabId: 7,
    profileId: CAPTURE_PROFILE.RESEARCH,
    suppressPreviewOpen: true,
  });
  assert.deepEqual(buildCaptureStartPayload(7, 'research', { suppressPreviewOpen: false }), {
    tabId: 7,
    profileId: CAPTURE_PROFILE.RESEARCH,
  });
});

test('builds queue payload with default profile only when profiles are enabled', () => {
  assert.deepEqual(buildCaptureQueuePayload([1, 2], false, CAPTURE_PROFILE.INTEREST), {
    tabIds: [1, 2],
  });
  assert.deepEqual(buildCaptureQueuePayload([1, 2], true, 'Private'), {
    tabIds: [1, 2],
    profileId: CAPTURE_PROFILE.PRIVATE,
  });
});
