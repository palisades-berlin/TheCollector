import { toPositiveInt } from './validation.js';
import { canonicalizeCaptureProfileId } from './capture-profiles.js';

function asObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value;
}

function toFiniteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toNonEmptyString(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function validateCaptureStartPayload(payload) {
  const obj = asObject(payload);
  const tabId = toPositiveInt(obj?.tabId);
  if (!tabId) return { ok: false, error: 'Invalid tab id' };
  let profileId = null;
  if (obj && Object.hasOwn(obj, 'profileId')) {
    if (typeof obj.profileId !== 'string') {
      return { ok: false, error: 'Invalid profile id' };
    }
    profileId = canonicalizeCaptureProfileId(obj.profileId);
  }
  let suppressPreviewOpen = false;
  if (obj && Object.hasOwn(obj, 'suppressPreviewOpen')) {
    if (typeof obj.suppressPreviewOpen !== 'boolean') {
      return { ok: false, error: 'Invalid suppressPreviewOpen flag' };
    }
    suppressPreviewOpen = obj.suppressPreviewOpen;
  }
  return { ok: true, value: { tabId, profileId, suppressPreviewOpen } };
}

export function validateCaptureQueueStartPayload(payload) {
  const obj = asObject(payload);
  if (!obj) return { ok: false, error: 'Invalid queue payload' };

  const ids = Array.isArray(obj.tabIds) ? obj.tabIds : null;
  if (!ids || ids.length === 0) return { ok: false, error: 'Invalid queue tab ids' };

  const seen = new Set();
  const tabIds = [];
  for (const rawId of ids) {
    const tabId = toPositiveInt(rawId);
    if (!tabId) return { ok: false, error: 'Invalid queue tab id' };
    if (seen.has(tabId)) continue;
    seen.add(tabId);
    tabIds.push(tabId);
  }
  if (tabIds.length === 0) return { ok: false, error: 'Invalid queue tab ids' };

  let profileId = null;
  if (Object.hasOwn(obj, 'profileId')) {
    if (typeof obj.profileId !== 'string') {
      return { ok: false, error: 'Invalid profile id' };
    }
    profileId = canonicalizeCaptureProfileId(obj.profileId);
  }

  return { ok: true, value: { tabIds, profileId } };
}

export function validatePreviewDownloadPayload(payload) {
  const obj = asObject(payload);
  if (!obj) return { ok: false, error: 'Invalid download payload' };
  if (!(obj.blob instanceof Blob)) {
    return { ok: false, error: 'Download payload is missing blob data' };
  }

  const ext = obj.ext === 'jpg' || obj.ext === 'pdf' ? obj.ext : 'png';
  const partIndex = Math.max(0, Number(obj.partIndex || 0));
  const partTotal = Math.max(1, Number(obj.partTotal || 1));
  const title = toNonEmptyString(obj.title) || 'screenshot';

  return {
    ok: true,
    value: {
      blob: obj.blob,
      ext,
      partIndex,
      partTotal,
      title,
    },
  };
}

export function validateOffscreenStitchPayload(payload) {
  const obj = asObject(payload);
  if (!obj) return { ok: false, error: 'Invalid stitch payload' };

  const id = toNonEmptyString(obj.id);
  const totalW = toPositiveInt(obj.totalW);
  const totalH = toPositiveInt(obj.totalH);

  if (!id) return { ok: false, error: 'Invalid stitch id' };
  if (!totalW || !totalH) {
    return { ok: false, error: 'Invalid stitch dimensions' };
  }

  return {
    ok: true,
    value: {
      id,
      totalW,
      totalH,
      sourceUrl: typeof obj.sourceUrl === 'string' ? obj.sourceUrl : '',
      title: typeof obj.title === 'string' ? obj.title : '',
    },
  };
}

export function validateCsScrollPayload(payload) {
  const obj = asObject(payload);
  if (!obj) return { ok: false, error: 'Invalid scroll payload' };

  const x = toFiniteNumber(obj.x);
  const y = toFiniteNumber(obj.y);
  if (x === null || y === null) return { ok: false, error: 'Invalid scroll coordinates' };

  const targetId =
    obj.targetId == null ? null : typeof obj.targetId === 'string' ? obj.targetId : null;
  if (obj.targetId != null && targetId === null) {
    return { ok: false, error: 'Invalid target id' };
  }

  return { ok: true, value: { x, y, targetId } };
}
