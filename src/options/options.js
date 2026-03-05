import { getUserSettings, setUserSettings } from '../shared/repos/settings-repo.js';
import { showToast } from '../shared/toast.js';
import { applySavedTheme, applyThemeToDocument } from '../shared/theme.js';

const defaultExportFormatEl = document.getElementById('defaultExportFormat');
const defaultPdfPageSizeEl = document.getElementById('defaultPdfPageSize');
const autoDownloadModeEl = document.getElementById('autoDownloadMode');
const downloadDirectoryEl = document.getElementById('downloadDirectory');
const pickDirectoryBtn = document.getElementById('pickDirectoryBtn');
const pickDirectoryInput = document.getElementById('pickDirectoryInput');
const saveAsEl = document.getElementById('saveAs');
const fitClipboardToDocsLimitEl = document.getElementById('fitClipboardToDocsLimit');
const themeEl = document.getElementById('theme');
const saveBtn = document.getElementById('saveBtn');
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

function logNonFatal(context, err) {
  if (window.localStorage.getItem('sc_debug_non_fatal') !== '1') return;
  console.debug('[THE Collector][non-fatal]', context, err);
}

init().catch((err) => showStatus(`Failed to load settings: ${err.message}`, 'error'));

async function init() {
  await applySavedTheme();
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
  await refreshPermissionStatus();
  setupPermissionStatusRefresh();
}

saveBtn.addEventListener('click', async () => {
  saveBtn.disabled = true;
  try {
    await setUserSettings({
      defaultExportFormat: defaultExportFormatEl.value,
      defaultPdfPageSize: defaultPdfPageSizeEl.value,
      autoDownloadMode: autoDownloadModeEl.value,
      downloadDirectory: downloadDirectoryEl.value,
      saveAs: saveAsEl.checked,
      fitClipboardToDocsLimit: fitClipboardToDocsLimitEl.checked,
      theme: themeEl ? themeEl.value : 'system',
    });
    const normalized = await getUserSettings();
    downloadDirectoryEl.value = normalized.downloadDirectory;
    showStatus('Settings saved.', 'success');
    showToast('Settings saved.', 'success');
  } catch (err) {
    showStatus(`Save failed: ${err.message}`, 'error');
    showToast(`Save failed: ${err.message}`, 'error', 3200);
  } finally {
    saveBtn.disabled = false;
  }
});

themeEl?.addEventListener('change', () => {
  applyThemeToDocument(themeEl.value);
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
    return;
  }
  downloadDirectoryEl.value = folder;
}

function renderOnboardingState() {
  if (!onboardingBannerEl) return;
  const params = new URLSearchParams(window.location.search);
  const shouldShow = params.get('onboarding') === '1';
  onboardingBannerEl.classList.toggle('hidden', !shouldShow);
}
