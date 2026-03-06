import { canUseFeature } from './capabilities.js';

const LOCAL_SCHEMES = new Set(['data:', 'blob:', 'chrome-extension:', 'moz-extension:']);

const TRACKING_KEY_DENYLIST = [
  'userId',
  'anonymousId',
  'sessionId',
  'deviceId',
  'fingerprint',
  'analytics',
  'telemetry',
  'tracking',
  'email',
  'ip',
];

function normalizeUrl(input) {
  if (input instanceof URL) return input;
  const raw = String(input ?? '').trim();
  if (!raw) return null;
  try {
    return new URL(raw, 'chrome-extension://local/');
  } catch {
    return null;
  }
}

export function isLocalOnlyUrl(input) {
  const url = normalizeUrl(input);
  if (!url) return false;
  if (LOCAL_SCHEMES.has(url.protocol)) return true;
  // Relative paths resolve to this local placeholder origin.
  return url.origin === 'chrome-extension://local';
}

export function assertLocalOnlyUrl(input, context = 'roadmap-feature') {
  if (!isLocalOnlyUrl(input)) {
    throw new Error(`Blocked external request in ${context}: local-only policy enforced.`);
  }
}

export function assertNoTrackingPayload(payload, context = 'roadmap-feature') {
  const stack = [payload];
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node || typeof node !== 'object') continue;
    if (Array.isArray(node)) {
      for (const item of node) stack.push(item);
      continue;
    }
    for (const [key, value] of Object.entries(node)) {
      const lower = key.toLowerCase();
      if (TRACKING_KEY_DENYLIST.some((denied) => lower.includes(denied.toLowerCase()))) {
        throw new Error(`Blocked tracking payload key "${key}" in ${context}.`);
      }
      if (value && typeof value === 'object') stack.push(value);
    }
  }
}

export async function roadmapFeatureFetch(featureKey, settings, input, init) {
  if (!canUseFeature(featureKey, settings)) {
    throw new Error(`Feature "${featureKey}" is not available for the current capability tier.`);
  }
  assertLocalOnlyUrl(input, featureKey);
  if (init?.body && typeof init.body === 'object') {
    assertNoTrackingPayload(init.body, featureKey);
  }
  return fetch(input, init);
}

export function enforceRoadmapActionPolicy(featureKey, settings, payload) {
  if (!canUseFeature(featureKey, settings)) {
    throw new Error(`Feature "${featureKey}" is not available for the current capability tier.`);
  }
  if (payload !== undefined) {
    assertNoTrackingPayload(payload, featureKey);
  }
}
