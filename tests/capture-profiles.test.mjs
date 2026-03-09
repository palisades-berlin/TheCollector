import assert from 'node:assert/strict';
import {
  CAPTURE_PROFILE,
  DEFAULT_CAPTURE_PROFILE_ID,
  getCaptureProfile,
  listCaptureProfiles,
  normalizeCaptureProfileId,
  resolveCaptureSettings,
} from '../src/shared/capture-profiles.js';

function test(name, fn) {
  try {
    fn();
    process.stdout.write(`PASS ${name}\n`);
  } catch (err) {
    process.stderr.write(`FAIL ${name}\n${err.stack}\n`);
    process.exitCode = 1;
  }
}

test('normalizes profile ids and falls back to default', () => {
  assert.equal(normalizeCaptureProfileId(CAPTURE_PROFILE.RESEARCH), CAPTURE_PROFILE.RESEARCH);
  assert.equal(normalizeCaptureProfileId('invalid'), DEFAULT_CAPTURE_PROFILE_ID);
});

test('lists fixed profiles in deterministic order', () => {
  const profiles = listCaptureProfiles();
  assert.deepEqual(
    profiles.map((p) => p.id),
    [CAPTURE_PROFILE.RESEARCH, CAPTURE_PROFILE.INTEREST, CAPTURE_PROFILE.PRIVATE]
  );
});

test('resolves capture settings as capture-only override', () => {
  const base = {
    defaultExportFormat: 'jpg',
    autoDownloadMode: 'skip_preview',
    saveAs: true,
    capabilityTier: 'pro',
  };
  const merged = resolveCaptureSettings(base, CAPTURE_PROFILE.RESEARCH);
  assert.equal(merged.defaultExportFormat, 'png');
  assert.equal(merged.autoDownloadMode, 'off');
  assert.equal(merged.saveAs, false);
  assert.equal(merged.capabilityTier, 'pro');
  assert.equal(base.defaultExportFormat, 'jpg');
});

test('returns profile metadata for known ids', () => {
  const profile = getCaptureProfile(CAPTURE_PROFILE.PRIVATE);
  assert.equal(profile.label, 'Private');
  assert.equal(profile.overrides.defaultExportFormat, 'pdf');
});
