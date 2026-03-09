import { canonicalizeCaptureProfileId } from '../shared/capture-profiles.js';

export function buildCaptureStartPayload(tabId, profileId = null, options = {}) {
  const payload = { tabId };
  if (profileId) payload.profileId = canonicalizeCaptureProfileId(profileId);
  if (options?.suppressPreviewOpen === true) payload.suppressPreviewOpen = true;
  return payload;
}

export function buildCaptureQueuePayload(tabIds, smartProfilesEnabled, defaultProfileId) {
  const payload = { tabIds: Array.isArray(tabIds) ? tabIds : [] };
  if (smartProfilesEnabled) {
    payload.profileId = canonicalizeCaptureProfileId(defaultProfileId);
  }
  return payload;
}
