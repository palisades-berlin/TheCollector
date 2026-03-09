import assert from 'node:assert/strict';
import {
  buildCaptureProfileUsageSummary,
  CAPTURE_PROFILE,
  DEFAULT_CAPTURE_PROFILE_ID,
  getCaptureProfile,
  isCaptureProfileId,
  listCaptureProfiles,
  normalizeCaptureProfileId,
  resolveCaptureSettings,
  sanitizeCaptureProfileId,
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

test('sanitizes and validates profile ids for legacy/invalid values', () => {
  assert.equal(isCaptureProfileId('research'), true);
  assert.equal(isCaptureProfileId('not-real'), false);
  assert.equal(sanitizeCaptureProfileId('Interest'), CAPTURE_PROFILE.INTEREST);
  assert.equal(sanitizeCaptureProfileId('not-real'), '');
  assert.equal(sanitizeCaptureProfileId(''), '');
});

test('builds profile usage summary from screenshot metadata', () => {
  const summary = buildCaptureProfileUsageSummary([
    { captureProfileId: 'research' },
    { captureProfileId: 'Interest' },
    { captureReport: { profileId: 'private' } },
    { captureProfileId: 'legacy-profile' },
    { captureReport: { profileId: 'unknown' } },
    {},
  ]);

  assert.equal(summary.total, 5);
  assert.equal(summary.recognized, 3);
  assert.equal(summary.unknown, 2);
  assert.equal(summary.byProfile.research, 1);
  assert.equal(summary.byProfile.interest, 1);
  assert.equal(summary.byProfile.private, 1);
});
