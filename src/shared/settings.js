import { DEFAULT_CAPTURE_PROFILE_ID, normalizeCaptureProfileId } from './capture-profiles.js';
import { normalizeNotificationCadence } from './nudges.js';

const SETTINGS_DEFAULTS = {
  defaultExportFormat: 'png', // png | jpg | pdf
  defaultPdfPageSize: 'auto', // auto | a4 | letter
  autoDownloadMode: 'off', // off | after_preview | skip_preview
  downloadDirectory: '',
  saveAs: false,
  fitClipboardToDocsLimit: true,
  theme: 'system', // system | light | dark
  nudgesEnabled: false,
  notificationCadence: 'balanced', // low | balanced | high
  // Empty default allows migration from legacy booleans when no tier is stored yet.
  capabilityTier: '', // basic | pro | ultra
  defaultCaptureProfileId: DEFAULT_CAPTURE_PROFILE_ID,
  // Legacy read-compat keys (deprecated; read-only migration input).
  proEnabled: false,
  ultraEnabled: false,
};

export async function getSettings() {
  const stored = await chrome.storage.sync.get(SETTINGS_DEFAULTS);
  const autoDownloadMode = normalizeAutoDownloadMode(stored.autoDownloadMode, stored.autoDownload);
  const capabilityTier = normalizeCapabilityTier(
    stored.capabilityTier,
    stored.proEnabled,
    stored.ultraEnabled
  );
  const proEnabled = capabilityTier === 'pro' || capabilityTier === 'ultra';
  const ultraEnabled = capabilityTier === 'ultra';
  return {
    defaultExportFormat: normalizeExportFormat(stored.defaultExportFormat),
    defaultPdfPageSize: normalizePdfPageSize(stored.defaultPdfPageSize),
    autoDownloadMode,
    downloadDirectory: normalizeDownloadDirectory(stored.downloadDirectory),
    saveAs: Boolean(stored.saveAs),
    fitClipboardToDocsLimit: normalizeFitClipboardToDocsLimit(stored.fitClipboardToDocsLimit),
    theme: normalizeTheme(stored.theme),
    nudgesEnabled: normalizeNudgesEnabled(stored.nudgesEnabled),
    notificationCadence: normalizeNotificationCadence(stored.notificationCadence),
    capabilityTier,
    defaultCaptureProfileId: normalizeCaptureProfileId(stored.defaultCaptureProfileId),
    // Deprecated compatibility projection for legacy callsites.
    proEnabled,
    ultraEnabled,
  };
}

export async function setSettings(partial) {
  const current = await getSettings();
  const next = {
    ...current,
    ...partial,
  };
  next.defaultExportFormat = normalizeExportFormat(next.defaultExportFormat);
  next.defaultPdfPageSize = normalizePdfPageSize(next.defaultPdfPageSize);
  next.autoDownloadMode = normalizeAutoDownloadMode(next.autoDownloadMode, next.autoDownload);
  next.downloadDirectory = normalizeDownloadDirectory(next.downloadDirectory);
  next.saveAs = Boolean(next.saveAs);
  next.fitClipboardToDocsLimit = normalizeFitClipboardToDocsLimit(next.fitClipboardToDocsLimit);
  next.theme = normalizeTheme(next.theme);
  next.nudgesEnabled = normalizeNudgesEnabled(next.nudgesEnabled);
  next.notificationCadence = normalizeNotificationCadence(next.notificationCadence);
  next.defaultCaptureProfileId = normalizeCaptureProfileId(next.defaultCaptureProfileId);
  next.capabilityTier = normalizeCapabilityTier(
    next.capabilityTier,
    next.proEnabled,
    next.ultraEnabled
  );
  next.proEnabled = next.capabilityTier === 'pro' || next.capabilityTier === 'ultra';
  next.ultraEnabled = next.capabilityTier === 'ultra';
  delete next.autoDownload;

  const persisted = { ...next };
  // Do not persist deprecated legacy booleans.
  delete persisted.proEnabled;
  delete persisted.ultraEnabled;

  await chrome.storage.sync.set(persisted);
  return next;
}

function normalizeExportFormat(v) {
  return v === 'jpg' || v === 'pdf' ? v : 'png';
}

function normalizePdfPageSize(v) {
  return v === 'a4' || v === 'letter' ? v : 'auto';
}

function normalizeAutoDownloadMode(mode, legacyAutoDownload) {
  if (mode === 'after_preview' || mode === 'skip_preview') return mode;
  return legacyAutoDownload ? 'after_preview' : 'off';
}

function normalizeDownloadDirectory(v) {
  if (!v) return '';
  const safe = String(v)
    .replace(/\\/g, '/')
    .replace(/[^a-zA-Z0-9/_-]/g, '')
    .replace(/\/{2,}/g, '/')
    .replace(/\.\./g, '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
  return safe.slice(0, 120);
}

function normalizeFitClipboardToDocsLimit(v) {
  if (v === false) return false;
  return true;
}

function normalizeTheme(v) {
  if (v === 'light' || v === 'dark') return v;
  return 'system';
}

function normalizeNudgesEnabled(v) {
  return v === true;
}

function normalizeCapabilityTier(tier, legacyProEnabled, legacyUltraEnabled) {
  if (tier === 'basic' || tier === 'pro' || tier === 'ultra') return tier;
  if (legacyUltraEnabled === true) return 'ultra';
  if (legacyProEnabled === true) return 'pro';
  return 'basic';
}
