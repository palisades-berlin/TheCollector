import { getUserSettings, setUserSettings } from '../shared/repos/settings-repo.js';
import { showToast } from '../shared/toast.js';
import { applySavedTheme, applyThemeToDocument } from '../shared/theme.js';
import { canUseFeature } from '../shared/capabilities.js';
import {
  DEFAULT_CAPTURE_PROFILE_ID,
  buildCaptureProfileUsageSummary,
  normalizeCaptureProfileId,
} from '../shared/capture-profiles.js';
import { normalizeNotificationCadence } from '../shared/nudges.js';
import { buildWeeklyValueReport } from '../shared/value-report.js';
import {
  listScreenshotMetaRecords,
  getScreenshotStorageUsage,
} from '../shared/repos/screenshot-repo.js';
import { loadUrlList } from '../shared/repos/url-repo.js';
import { SCREENSHOT_ITEM_LIMIT } from '../shared/constants.js';

const defaultExportFormatEl = document.getElementById('defaultExportFormat');
const defaultPdfPageSizeEl = document.getElementById('defaultPdfPageSize');
const autoDownloadModeEl = document.getElementById('autoDownloadMode');
const downloadDirectoryEl = document.getElementById('downloadDirectory');
const pickDirectoryBtn = document.getElementById('pickDirectoryBtn');
const pickDirectoryInput = document.getElementById('pickDirectoryInput');
const saveAsEl = document.getElementById('saveAs');
const fitClipboardToDocsLimitEl = document.getElementById('fitClipboardToDocsLimit');
const themeEl = document.getElementById('theme');
const capabilityTierEl = document.getElementById('capabilityTier');
const defaultCaptureProfileRowEl = document.getElementById('defaultCaptureProfileRow');
const defaultCaptureProfileIdEl = document.getElementById('defaultCaptureProfileId');
const nudgesEnabledRowEl = document.getElementById('nudgesEnabledRow');
const nudgesEnabledEl = document.getElementById('nudgesEnabled');
const notificationCadenceRowEl = document.getElementById('notificationCadenceRow');
const notificationCadenceEl = document.getElementById('notificationCadence');
const autoPurgeEnabledEl = document.getElementById('autoPurgeEnabled');
const storageUsageCounterEl = document.getElementById('storageUsageCounter');
const profileUsageCardEl = document.getElementById('profileUsageCard');
const profileUsageSettingsResearchEl = document.getElementById('profileUsageSettingsResearch');
const profileUsageSettingsInterestEl = document.getElementById('profileUsageSettingsInterest');
const profileUsageSettingsPrivateEl = document.getElementById('profileUsageSettingsPrivate');
const profileUsageSettingsUnknownWrapEl = document.getElementById(
  'profileUsageSettingsUnknownWrap'
);
const profileUsageSettingsUnknownEl = document.getElementById('profileUsageSettingsUnknown');
const weeklyValueReportCardEl = document.getElementById('weeklyValueReportCard');
const weeklyCapturesSavedEl = document.getElementById('weeklyCapturesSaved');
const weeklyUniqueDomainsEl = document.getElementById('weeklyUniqueDomains');
const weeklyUrlsCollectedEl = document.getElementById('weeklyUrlsCollected');
const weeklyMinutesSavedEl = document.getElementById('weeklyMinutesSaved');
const saveBtn = document.getElementById('saveBtn');
const saveBarEl = document.getElementById('globalSaveBar');
const saveBarTextEl = document.getElementById('saveBarText');
const saveBarBtn = document.getElementById('saveBarBtn');
const statusEl = document.getElementById('status');
const onboardingBannerEl = document.getElementById('onboardingBanner');
const downloadsStatusEl = document.getElementById('downloadsStatus');
const grantDownloadsBtn = document.getElementById('grantDownloads');
const revokeDownloadsBtn = document.getElementById('revokeDownloads');
const permBadgeEls = {
  activeTab: document.getElementById('perm-activeTab'),
  tabs: document.getElementById('perm-tabs'),
  scripting: document.getElementById('perm-scripting'),
  storage: document.getElementById('perm-storage'),
  offscreen: document.getElementById('perm-offscreen'),
  unlimitedStorage: document.getElementById('perm-unlimitedStorage'),
  downloads: document.getElementById('perm-downloads'),
};
let permissionPollTimer = null;
let settingsDirty = false;
let isHydrating = false;
const SECTION_IDS = new Set([
  'daily-essentials',
  'capture-export',
  'downloads',
  'feature-access',
  'privacy-permissions',
  'advanced',
  'help-faq',
]);
const settingsSectionEls = Array.from(document.querySelectorAll('[data-settings-section]'));
const settingsNavBtnEls = Array.from(document.querySelectorAll('[data-settings-nav]'));

function logNonFatal(context, err) {
  if (window.localStorage.getItem('sc_debug_non_fatal') !== '1') return;
  console.debug('[THE Collector][non-fatal]', context, err);
}

init().catch((err) => showStatus(`Failed to load settings: ${err.message}`, 'error'));

async function init() {
  isHydrating = true;
  await applySavedTheme();
  wireSettingsNavigation();
  setActiveSection(getInitialSectionId(), { syncUrl: false });
  renderOnboardingState();
  const settings = await getUserSettings();
  defaultExportFormatEl.value = settings.defaultExportFormat;
  defaultPdfPageSizeEl.value = settings.defaultPdfPageSize;
  autoDownloadModeEl.value = settings.autoDownloadMode;
  downloadDirectoryEl.value = settings.downloadDirectory;
  saveAsEl.checked = settings.saveAs;
  fitClipboardToDocsLimitEl.checked = settings.fitClipboardToDocsLimit;
  if (themeEl) {
    themeEl.value = settings.theme || 'system';
    applyThemeToDocument(themeEl.value);
  }
  if (capabilityTierEl) capabilityTierEl.value = settings.capabilityTier || 'basic';
  if (defaultCaptureProfileIdEl) {
    defaultCaptureProfileIdEl.value = normalizeCaptureProfileId(
      settings.defaultCaptureProfileId || DEFAULT_CAPTURE_PROFILE_ID
    );
  }
  if (nudgesEnabledEl) nudgesEnabledEl.checked = settings.nudgesEnabled === true;
  if (notificationCadenceEl) {
    notificationCadenceEl.value = normalizeNotificationCadence(settings.notificationCadence);
    notificationCadenceEl.disabled = !(nudgesEnabledEl && nudgesEnabledEl.checked);
  }
  if (autoPurgeEnabledEl) autoPurgeEnabledEl.checked = settings.autoPurgeEnabled !== false;
  setDirtyState(false);
  syncProfileRowVisibility(settings);
  syncNudgesVisibility(settings);
  await syncProfileUsageSummary(settings);
  await syncStorageUsageCounter();
  await syncWeeklyValueReportVisibility(settings);
  await refreshPermissionStatus();
  setupPermissionStatusRefresh();
  wireDirtyTracking();
  isHydrating = false;
}

saveBtn.addEventListener('click', () => {
  void handleSave();
});

saveBarBtn?.addEventListener('click', () => {
  void handleSave();
});

async function handleSave() {
  saveBtn.disabled = true;
  if (saveBarBtn) saveBarBtn.disabled = true;
  try {
    await setUserSettings(collectSettingsPayload());
    const normalized = await getUserSettings();
    downloadDirectoryEl.value = normalized.downloadDirectory;
    setDirtyState(false);
    await syncStorageUsageCounter();
    showStatus('Settings saved.', 'success');
    showToast('Settings saved.', 'success');
  } catch (err) {
    setDirtyState(true);
    showStatus(`Save failed: ${err.message}`, 'error');
    showToast(`Save failed: ${err.message}`, 'error', 3200);
  } finally {
    saveBtn.disabled = false;
    if (saveBarBtn) saveBarBtn.disabled = false;
  }
}

function collectSettingsPayload() {
  return {
    defaultExportFormat: defaultExportFormatEl.value,
    defaultPdfPageSize: defaultPdfPageSizeEl.value,
    autoDownloadMode: autoDownloadModeEl.value,
    downloadDirectory: downloadDirectoryEl.value,
    saveAs: saveAsEl.checked,
    fitClipboardToDocsLimit: fitClipboardToDocsLimitEl.checked,
    theme: themeEl ? themeEl.value : 'system',
    capabilityTier: capabilityTierEl ? capabilityTierEl.value : 'basic',
    defaultCaptureProfileId: defaultCaptureProfileIdEl
      ? normalizeCaptureProfileId(defaultCaptureProfileIdEl.value)
      : DEFAULT_CAPTURE_PROFILE_ID,
    nudgesEnabled: nudgesEnabledEl ? nudgesEnabledEl.checked : false,
    notificationCadence: notificationCadenceEl
      ? normalizeNotificationCadence(notificationCadenceEl.value)
      : 'balanced',
    autoPurgeEnabled: autoPurgeEnabledEl ? autoPurgeEnabledEl.checked : true,
  };
}

themeEl?.addEventListener('change', () => {
  applyThemeToDocument(themeEl.value);
});

capabilityTierEl?.addEventListener('change', () => {
  const settings = { capabilityTier: capabilityTierEl.value };
  syncProfileRowVisibility(settings);
  syncNudgesVisibility(settings);
  syncProfileUsageSummary(settings).catch((err) => logNonFatal('syncProfileUsageSummary', err));
  syncWeeklyValueReportVisibility(settings).catch((err) =>
    logNonFatal('syncWeeklyValueReport', err)
  );
  markSettingsDirty();
});

nudgesEnabledEl?.addEventListener('change', () => {
  if (!notificationCadenceEl) return;
  notificationCadenceEl.disabled = !nudgesEnabledEl.checked;
  markSettingsDirty();
});

notificationCadenceEl?.addEventListener('change', () => {
  markSettingsDirty();
});

grantDownloadsBtn.addEventListener('click', async () => {
  try {
    const granted = await chrome.permissions.request({ permissions: ['downloads'] });
    showStatus(
      granted ? 'Downloads permission granted.' : 'Downloads permission was not granted.',
      granted ? 'success' : 'info'
    );
    showToast(
      granted ? 'Downloads permission granted.' : 'Downloads permission not granted.',
      granted ? 'success' : 'info'
    );
    await refreshPermissionStatus();
  } catch (err) {
    showStatus(`Permission request failed: ${err.message}`, 'error');
    showToast(`Permission request failed: ${err.message}`, 'error', 3200);
  }
});

revokeDownloadsBtn.addEventListener('click', async () => {
  try {
    const removed = await chrome.permissions.remove({ permissions: ['downloads'] });
    showStatus(
      removed ? 'Downloads permission revoked.' : 'Downloads permission could not be revoked.',
      removed ? 'success' : 'info'
    );
    showToast(
      removed ? 'Downloads permission revoked.' : 'Downloads permission could not be revoked.',
      removed ? 'success' : 'info'
    );
    await refreshPermissionStatus();
  } catch (err) {
    showStatus(`Permission removal failed: ${err.message}`, 'error');
    showToast(`Permission removal failed: ${err.message}`, 'error', 3200);
  }
});

pickDirectoryBtn.addEventListener('click', async () => {
  if (typeof window.showDirectoryPicker === 'function') {
    try {
      const handle = await window.showDirectoryPicker();
      const folder = String(handle?.name || '').trim();
      if (!folder) return;
      applySelectedFolder(folder);
      return;
    } catch (err) {
      // Ignore user-cancel in picker UX and only debug-log other non-fatal errors.
      if (err?.name !== 'AbortError') {
        logNonFatal('pickDirectoryBtn.showDirectoryPicker', err);
      }
    }
  }
  pickDirectoryInput.value = '';
  pickDirectoryInput.click();
});

pickDirectoryInput.addEventListener('change', () => {
  const files = pickDirectoryInput.files;
  if (!files || files.length === 0) return;

  const first = files[0];
  const rel = String(first.webkitRelativePath || '');
  const folder = rel.includes('/') ? rel.split('/')[0] : '';
  if (!folder) return;
  applySelectedFolder(folder);
});

window.addEventListener('keydown', (e) => {
  const isSave = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's';
  if (!isSave) return;
  e.preventDefault();
  if (!saveBtn.disabled) saveBtn.click();
});

async function refreshPermissionStatus() {
  const hasDownloads = await hasPermission('downloads');
  downloadsStatusEl.textContent = `Downloads permission: ${hasDownloads ? 'granted' : 'not granted'}`;
  grantDownloadsBtn.disabled = hasDownloads;
  revokeDownloadsBtn.disabled = !hasDownloads;
  setBadge(
    'downloads',
    hasDownloads ? 'Optional: On' : 'Optional: Off',
    hasDownloads ? 'ok' : 'off'
  );
  await refreshCorePermissionBadges();
}

function showStatus(msg, tone = 'info') {
  statusEl.textContent = msg;
  statusEl.classList.remove(
    'hidden',
    'sc-banner-info',
    'sc-banner-success',
    'sc-banner-error',
    'sc-banner-warn'
  );
  if (tone === 'success') {
    statusEl.classList.add('sc-banner-success');
    return;
  }
  if (tone === 'error') {
    statusEl.classList.add('sc-banner-error');
    return;
  }
  if (tone === 'warn') {
    statusEl.classList.add('sc-banner-warn');
    return;
  }
  statusEl.classList.add('sc-banner-info');
}

function setDirtyState(nextDirty) {
  settingsDirty = nextDirty === true;
  saveBarEl?.classList.toggle('hidden', !settingsDirty);
  if (settingsDirty && saveBarTextEl) {
    saveBarTextEl.textContent = 'Unsaved changes. Click Save Settings.';
  }
}

function markSettingsDirty() {
  if (isHydrating || settingsDirty) return;
  setDirtyState(true);
  showStatus('Unsaved changes. Click Save Settings.', 'warn');
}

async function hasPermission(permission) {
  try {
    return await chrome.permissions.contains({ permissions: [permission] });
  } catch {
    return false;
  }
}

async function refreshCorePermissionBadges() {
  const requiredPermissions = [
    'activeTab',
    'tabs',
    'scripting',
    'storage',
    'offscreen',
    'unlimitedStorage',
  ];
  const checks = await Promise.all(requiredPermissions.map((perm) => hasPermission(perm)));
  for (let i = 0; i < requiredPermissions.length; i++) {
    const perm = requiredPermissions[i];
    const granted = checks[i];
    setBadge(perm, granted ? 'Available' : 'Check browser', granted ? 'ok' : 'warn');
  }
}

function setBadge(permission, text, variant) {
  const el = permBadgeEls[permission];
  if (!el) return;
  el.textContent = text;
  el.classList.remove('sc-pill-ok', 'sc-pill-off', 'sc-pill-warn');
  el.classList.remove('ok', 'off', 'warn');
  if (variant) {
    el.classList.add(variant);
    if (variant === 'ok') el.classList.add('sc-pill-ok');
    if (variant === 'off') el.classList.add('sc-pill-off');
    if (variant === 'warn') el.classList.add('sc-pill-warn');
  }
}

function setupPermissionStatusRefresh() {
  if (permissionPollTimer) clearInterval(permissionPollTimer);
  permissionPollTimer = setInterval(() => {
    refreshPermissionStatus().catch((err) => logNonFatal('refreshPermissionStatus.interval', err));
  }, 8000);

  window.addEventListener('focus', () => {
    refreshPermissionStatus().catch((err) => logNonFatal('refreshPermissionStatus.focus', err));
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      refreshPermissionStatus().catch((err) =>
        logNonFatal('refreshPermissionStatus.visibility', err)
      );
    }
  });
  window.addEventListener('beforeunload', () => {
    if (permissionPollTimer) {
      clearInterval(permissionPollTimer);
      permissionPollTimer = null;
    }
  });
}

function applySelectedFolder(folder) {
  const current = downloadDirectoryEl.value.trim();
  // If user already entered nested path manually, keep suffix and replace root.
  if (current.includes('/')) {
    const suffix = current.split('/').slice(1).join('/');
    downloadDirectoryEl.value = suffix ? `${folder}/${suffix}` : folder;
    markSettingsDirty();
    return;
  }
  downloadDirectoryEl.value = folder;
  markSettingsDirty();
}

function syncProfileRowVisibility(settings) {
  if (!defaultCaptureProfileRowEl) return;
  const showProfiles = canUseFeature('smart_save_profiles', settings || {});
  defaultCaptureProfileRowEl.classList.toggle('hidden', !showProfiles);
}

function syncNudgesVisibility(settings) {
  const showNudges = canUseFeature('smart_revisit_nudges', settings || {});
  if (nudgesEnabledRowEl) nudgesEnabledRowEl.classList.toggle('hidden', !showNudges);
  if (notificationCadenceRowEl) notificationCadenceRowEl.classList.toggle('hidden', !showNudges);
}

async function syncWeeklyValueReportVisibility(settings) {
  const showReport = canUseFeature('weekly_value_report', settings || {});
  if (!weeklyValueReportCardEl) return;
  weeklyValueReportCardEl.classList.toggle('hidden', !showReport);
  if (!showReport) return;
  try {
    const [screenshots, urls] = await Promise.all([listScreenshotMetaRecords(), loadUrlList()]);
    const report = buildWeeklyValueReport({
      screenshotRecords: screenshots,
      urlList: urls,
    });
    if (weeklyCapturesSavedEl) weeklyCapturesSavedEl.textContent = String(report.capturesSaved);
    if (weeklyUniqueDomainsEl) weeklyUniqueDomainsEl.textContent = String(report.uniqueDomains);
    if (weeklyUrlsCollectedEl) weeklyUrlsCollectedEl.textContent = String(report.urlsCollected);
    if (weeklyMinutesSavedEl)
      weeklyMinutesSavedEl.textContent = `${report.estimatedMinutesSaved} min`;
  } catch (err) {
    logNonFatal('loadWeeklyValueReport', err);
    if (weeklyCapturesSavedEl) weeklyCapturesSavedEl.textContent = '0';
    if (weeklyUniqueDomainsEl) weeklyUniqueDomainsEl.textContent = '0';
    if (weeklyUrlsCollectedEl) weeklyUrlsCollectedEl.textContent = '0';
    if (weeklyMinutesSavedEl) weeklyMinutesSavedEl.textContent = '0 min';
  }
}

async function syncStorageUsageCounter() {
  if (!storageUsageCounterEl) return;
  try {
    const usage = await getScreenshotStorageUsage();
    const count = Math.max(0, Number(usage?.count || 0));
    storageUsageCounterEl.textContent = `Storage usage: ${String(count).padStart(3, '0')}/${SCREENSHOT_ITEM_LIMIT} screenshots`;
  } catch (err) {
    logNonFatal('syncStorageUsageCounter', err);
    storageUsageCounterEl.textContent = `Storage usage: ---/${SCREENSHOT_ITEM_LIMIT} screenshots`;
  }
}

async function syncProfileUsageSummary(settings) {
  const showProfiles = canUseFeature('smart_save_profiles', settings || {});
  if (!profileUsageCardEl) return;
  profileUsageCardEl.classList.toggle('hidden', !showProfiles);
  if (!showProfiles) return;

  try {
    const screenshotRecords = await listScreenshotMetaRecords();
    const summary = buildCaptureProfileUsageSummary(screenshotRecords);
    if (profileUsageSettingsResearchEl) {
      profileUsageSettingsResearchEl.textContent = String(summary.byProfile.research || 0);
    }
    if (profileUsageSettingsInterestEl) {
      profileUsageSettingsInterestEl.textContent = String(summary.byProfile.interest || 0);
    }
    if (profileUsageSettingsPrivateEl) {
      profileUsageSettingsPrivateEl.textContent = String(summary.byProfile.private || 0);
    }
    if (profileUsageSettingsUnknownEl) {
      profileUsageSettingsUnknownEl.textContent = String(summary.unknown || 0);
    }
    if (profileUsageSettingsUnknownWrapEl) {
      profileUsageSettingsUnknownWrapEl.classList.toggle(
        'hidden',
        Number(summary.unknown || 0) <= 0
      );
    }
  } catch (err) {
    logNonFatal('loadProfileUsageSummary', err);
    if (profileUsageSettingsResearchEl) profileUsageSettingsResearchEl.textContent = '0';
    if (profileUsageSettingsInterestEl) profileUsageSettingsInterestEl.textContent = '0';
    if (profileUsageSettingsPrivateEl) profileUsageSettingsPrivateEl.textContent = '0';
    if (profileUsageSettingsUnknownEl) profileUsageSettingsUnknownEl.textContent = '0';
    if (profileUsageSettingsUnknownWrapEl)
      profileUsageSettingsUnknownWrapEl.classList.add('hidden');
  }
}

function renderOnboardingState() {
  if (!onboardingBannerEl) return;
  const params = new URLSearchParams(window.location.search);
  const shouldShow = params.get('onboarding') === '1';
  onboardingBannerEl.classList.toggle('hidden', !shouldShow);
}

function normalizeSectionId(raw) {
  const next = String(raw || '')
    .trim()
    .toLowerCase();
  return SECTION_IDS.has(next) ? next : 'daily-essentials';
}

function getInitialSectionId() {
  const params = new URLSearchParams(window.location.search);
  return normalizeSectionId(params.get('section'));
}

function wireSettingsNavigation() {
  for (const btn of settingsNavBtnEls) {
    btn.addEventListener('click', () => {
      setActiveSection(normalizeSectionId(btn.dataset.settingsNav), { syncUrl: true });
    });
  }
}

function wireDirtyTracking() {
  const changeTrackedControls = [
    defaultExportFormatEl,
    defaultPdfPageSizeEl,
    autoDownloadModeEl,
    saveAsEl,
    fitClipboardToDocsLimitEl,
    themeEl,
    capabilityTierEl,
    defaultCaptureProfileIdEl,
    nudgesEnabledEl,
    notificationCadenceEl,
    autoPurgeEnabledEl,
  ];
  for (const control of changeTrackedControls) {
    control?.addEventListener('change', () => markSettingsDirty());
  }
  downloadDirectoryEl?.addEventListener('input', () => markSettingsDirty());
}

function setActiveSection(sectionId, { syncUrl = true } = {}) {
  const activeId = normalizeSectionId(sectionId);
  for (const sectionEl of settingsSectionEls) {
    const isActive = sectionEl.dataset.settingsSection === activeId;
    sectionEl.classList.toggle('hidden', !isActive);
  }
  for (const btn of settingsNavBtnEls) {
    const isActive = normalizeSectionId(btn.dataset.settingsNav) === activeId;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-current', isActive ? 'page' : 'false');
  }
  if (!syncUrl) return;
  const url = new URL(window.location.href);
  url.searchParams.set('section', activeId);
  window.history.replaceState(null, '', url.toString());
}
