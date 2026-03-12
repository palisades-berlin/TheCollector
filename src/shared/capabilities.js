export const CAPABILITY_TIER = {
  BASIC: 'basic',
  PRO: 'pro',
  ULTRA: 'ultra',
};

// 30-day roadmap features (Options toggle: Pro)
const PRO_FEATURES = [
  'smart_save_profiles',
  'bulk_actions_v1',
  'weekly_value_report',
  'smart_revisit_nudges',
  'featured_ready_ux_pack',
  'capture_queue_batch_mode',
];

// 90-day roadmap features (Options toggle: Ultra)
const ULTRA_FEATURES = [
  'command_palette',
  'magic_mode',
  'workflow_automations',
  'cross_browser_core',
  'team_spaces_lite',
];

const FEATURE_TIER_MAP = new Map();

for (const key of PRO_FEATURES) FEATURE_TIER_MAP.set(key, CAPABILITY_TIER.PRO);
for (const key of ULTRA_FEATURES) FEATURE_TIER_MAP.set(key, CAPABILITY_TIER.ULTRA);

export function getRequiredTier(featureKey) {
  return FEATURE_TIER_MAP.get(featureKey) || CAPABILITY_TIER.BASIC;
}

const TIER_RANK = {
  [CAPABILITY_TIER.BASIC]: 0,
  [CAPABILITY_TIER.PRO]: 1,
  [CAPABILITY_TIER.ULTRA]: 2,
};

export function getCurrentTier(settings = {}) {
  if (settings.capabilityTier === CAPABILITY_TIER.BASIC) return CAPABILITY_TIER.BASIC;
  if (settings.capabilityTier === CAPABILITY_TIER.PRO) return CAPABILITY_TIER.PRO;
  if (settings.capabilityTier === CAPABILITY_TIER.ULTRA) return CAPABILITY_TIER.ULTRA;
  // Backward compatibility for legacy settings shape.
  if (settings.ultraEnabled === true) return CAPABILITY_TIER.ULTRA;
  if (settings.proEnabled === true) return CAPABILITY_TIER.PRO;
  return CAPABILITY_TIER.BASIC;
}

export function isTierAtLeast(settings = {}, requiredTier = CAPABILITY_TIER.BASIC) {
  const currentTier = getCurrentTier(settings);
  const currentRank = TIER_RANK[currentTier] ?? 0;
  const requiredRank = TIER_RANK[requiredTier] ?? 0;
  return currentRank >= requiredRank;
}

export function canUseFeature(featureKey, settings = {}) {
  const requiredTier = getRequiredTier(featureKey);
  return isTierAtLeast(settings, requiredTier);
}

// Backward-compatible alias.
export function isFeatureEnabled(featureKey, settings = {}) {
  return canUseFeature(featureKey, settings);
}

export function getCapabilitySnapshot(settings = {}) {
  const capabilityTier = getCurrentTier(settings);
  const proEnabled =
    capabilityTier === CAPABILITY_TIER.PRO || capabilityTier === CAPABILITY_TIER.ULTRA;
  const ultraEnabled = capabilityTier === CAPABILITY_TIER.ULTRA;
  return {
    capabilityTier,
    proEnabled,
    ultraEnabled,
    tiers: {
      [CAPABILITY_TIER.BASIC]: true,
      [CAPABILITY_TIER.PRO]: proEnabled,
      [CAPABILITY_TIER.ULTRA]: ultraEnabled,
    },
  };
}

export function listGatedFeatures() {
  return {
    pro: [...PRO_FEATURES],
    ultra: [...ULTRA_FEATURES],
  };
}
