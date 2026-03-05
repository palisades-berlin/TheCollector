const SETTINGS_DEFAULTS = {
  defaultExportFormat: 'png', // png | jpg | pdf
  defaultPdfPageSize: 'auto', // auto | a4 | letter
  autoDownloadMode: 'off', // off | after_preview | skip_preview
  downloadDirectory: '',
  saveAs: false,
  fitClipboardToDocsLimit: true,
  theme: 'system', // system | light | dark
};

export async function getSettings() {
  const stored = await chrome.storage.sync.get(SETTINGS_DEFAULTS);
  const autoDownloadMode = normalizeAutoDownloadMode(stored.autoDownloadMode, stored.autoDownload);
  return {
    defaultExportFormat: normalizeExportFormat(stored.defaultExportFormat),
    defaultPdfPageSize: normalizePdfPageSize(stored.defaultPdfPageSize),
    autoDownloadMode,
    downloadDirectory: normalizeDownloadDirectory(stored.downloadDirectory),
    saveAs: Boolean(stored.saveAs),
    fitClipboardToDocsLimit: normalizeFitClipboardToDocsLimit(stored.fitClipboardToDocsLimit),
    theme: normalizeTheme(stored.theme),
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
  delete next.autoDownload;

  await chrome.storage.sync.set(next);
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
