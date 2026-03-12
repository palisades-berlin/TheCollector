import assert from 'node:assert/strict';
import {
  CAPABILITY_TIER,
  canUseFeature,
  getCurrentTier,
  getCapabilitySnapshot,
  getRequiredTier,
  isTierAtLeast,
  listGatedFeatures,
} from '../src/shared/capabilities.js';

function test(name, fn) {
  try {
    fn();
    process.stdout.write(`PASS ${name}\n`);
  } catch (err) {
    process.stderr.write(`FAIL ${name}\n${err.stack}\n`);
    process.exitCode = 1;
  }
}

test('maps roadmap features to expected tiers', () => {
  assert.equal(getRequiredTier('smart_save_profiles'), CAPABILITY_TIER.PRO);
  assert.equal(getRequiredTier('saved_url_views'), CAPABILITY_TIER.PRO);
  assert.equal(getRequiredTier('bulk_actions_v1'), CAPABILITY_TIER.PRO);
  assert.equal(getRequiredTier('command_palette'), CAPABILITY_TIER.ULTRA);
  assert.equal(getRequiredTier('omnibox_actions'), CAPABILITY_TIER.ULTRA);
  assert.equal(getRequiredTier('magic_mode'), CAPABILITY_TIER.ULTRA);
  assert.equal(getRequiredTier('admin_config_profile'), CAPABILITY_TIER.ULTRA);
  assert.equal(getRequiredTier('enterprise_controls_v1'), CAPABILITY_TIER.BASIC);
  assert.equal(getRequiredTier('cross_browser_core'), CAPABILITY_TIER.BASIC);
  assert.equal(getRequiredTier('unknown_core_feature'), CAPABILITY_TIER.BASIC);
});

test('enforces hierarchical gating by capabilityTier', () => {
  const basic = { capabilityTier: 'basic' };
  const pro = { capabilityTier: 'pro' };
  const ultra = { capabilityTier: 'ultra' };

  assert.equal(canUseFeature('smart_save_profiles', basic), false);
  assert.equal(canUseFeature('saved_url_views', basic), false);
  assert.equal(canUseFeature('smart_save_profiles', pro), true);
  assert.equal(canUseFeature('saved_url_views', pro), true);
  assert.equal(canUseFeature('smart_save_profiles', ultra), true);
  assert.equal(canUseFeature('saved_url_views', ultra), true);

  assert.equal(canUseFeature('magic_mode', basic), false);
  assert.equal(canUseFeature('magic_mode', pro), false);
  assert.equal(canUseFeature('magic_mode', ultra), true);
});

test('core features stay available regardless of gates', () => {
  assert.equal(canUseFeature('always_available_core_action', { capabilityTier: 'basic' }), true);
  assert.equal(canUseFeature('always_available_core_action', { capabilityTier: 'pro' }), true);
  assert.equal(canUseFeature('always_available_core_action', { capabilityTier: 'ultra' }), true);
});

test('returns deterministic capability snapshot and feature lists', () => {
  assert.deepEqual(getCapabilitySnapshot({ capabilityTier: 'pro' }), {
    capabilityTier: 'pro',
    proEnabled: true,
    ultraEnabled: false,
    tiers: {
      basic: true,
      pro: true,
      ultra: false,
    },
  });

  const features = listGatedFeatures();
  assert.ok(features.pro.includes('smart_save_profiles'));
  assert.ok(features.pro.includes('saved_url_views'));
  assert.ok(features.ultra.includes('magic_mode'));
  assert.ok(features.ultra.includes('admin_config_profile'));
  assert.ok(features.ultra.includes('omnibox_actions'));
  assert.equal(features.ultra.includes('cross_browser_core'), false);
  assert.equal(features.pro.includes('magic_mode'), false);
});

test('resolves current tier from legacy shape and supports rank checks', () => {
  assert.equal(getCurrentTier({}), CAPABILITY_TIER.BASIC);
  assert.equal(getCurrentTier({ proEnabled: true }), CAPABILITY_TIER.PRO);
  assert.equal(getCurrentTier({ ultraEnabled: true }), CAPABILITY_TIER.ULTRA);
  assert.equal(getCurrentTier({ capabilityTier: 'pro' }), CAPABILITY_TIER.PRO);

  assert.equal(isTierAtLeast({ capabilityTier: 'pro' }, CAPABILITY_TIER.BASIC), true);
  assert.equal(isTierAtLeast({ capabilityTier: 'pro' }, CAPABILITY_TIER.PRO), true);
  assert.equal(isTierAtLeast({ capabilityTier: 'pro' }, CAPABILITY_TIER.ULTRA), false);
});
