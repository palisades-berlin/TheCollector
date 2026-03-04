import { getSettings, setSettings } from '../shared/settings.js';
import { showToast } from '../shared/toast.js';
import { initLiquidUI } from '../shared/liquid.js';

const defaultExportFormatEl = document.getElementById('defaultExportFormat');
const defaultPdfPageSizeEl = document.getElementById('defaultPdfPageSize');
const autoDownloadModeEl = document.getElementById('autoDownloadMode');
const downloadDirectoryEl = document.getElementById('downloadDirectory');
const pickDirectoryBtn = document.getElementById('pickDirectoryBtn');
const pickDirectoryInput = document.getElementById('pickDirectoryInput');
const saveAsEl = document.getElementById('saveAs');
const fitClipboardToDocsLimitEl = document.getElementById('fitClipboardToDocsLimit');
const saveBtn = document.getElementById('saveBtn');
const statusEl = document.getElementById('status');
const downloadsStatusEl = document.getElementById('downloadsStatus');
const grantDownloadsBtn = document.getElementById('grantDownloads');
const revokeDownloadsBtn = document.getElementById('revokeDownloads');

init().catch((err) => showStatus(`Failed to load settings: ${err.message}`));

async function init() {
  initLiquidUI({
    enableTilt: true,
    tiltSelector: '.card, .btn, .header',
  });
  const settings = await getSettings();
  defaultExportFormatEl.value = settings.defaultExportFormat;
  defaultPdfPageSizeEl.value = settings.defaultPdfPageSize;
  autoDownloadModeEl.value = settings.autoDownloadMode;
  downloadDirectoryEl.value = settings.downloadDirectory;
  saveAsEl.checked = settings.saveAs;
  fitClipboardToDocsLimitEl.checked = settings.fitClipboardToDocsLimit;
  await refreshPermissionStatus();
}

saveBtn.addEventListener('click', async () => {
  saveBtn.disabled = true;
  try {
    await setSettings({
      defaultExportFormat: defaultExportFormatEl.value,
      defaultPdfPageSize: defaultPdfPageSizeEl.value,
      autoDownloadMode: autoDownloadModeEl.value,
      downloadDirectory: downloadDirectoryEl.value,
      saveAs: saveAsEl.checked,
      fitClipboardToDocsLimit: fitClipboardToDocsLimitEl.checked,
    });
    const normalized = await getSettings();
    downloadDirectoryEl.value = normalized.downloadDirectory;
    showStatus('Settings saved.');
    showToast('Settings saved.', 'success');
  } catch (err) {
    showStatus(`Save failed: ${err.message}`);
    showToast(`Save failed: ${err.message}`, 'error', 3200);
  } finally {
    saveBtn.disabled = false;
  }
});

grantDownloadsBtn.addEventListener('click', async () => {
  try {
    const granted = await chrome.permissions.request({ permissions: ['downloads'] });
    showStatus(granted ? 'Downloads permission granted.' : 'Downloads permission was not granted.');
    showToast(
      granted ? 'Downloads permission granted.' : 'Downloads permission not granted.',
      granted ? 'success' : 'info'
    );
    await refreshPermissionStatus();
  } catch (err) {
    showStatus(`Permission request failed: ${err.message}`);
    showToast(`Permission request failed: ${err.message}`, 'error', 3200);
  }
});

revokeDownloadsBtn.addEventListener('click', async () => {
  try {
    const removed = await chrome.permissions.remove({ permissions: ['downloads'] });
    showStatus(removed ? 'Downloads permission revoked.' : 'Downloads permission could not be revoked.');
    showToast(
      removed ? 'Downloads permission revoked.' : 'Downloads permission could not be revoked.',
      removed ? 'success' : 'info'
    );
    await refreshPermissionStatus();
  } catch (err) {
    showStatus(`Permission removal failed: ${err.message}`);
    showToast(`Permission removal failed: ${err.message}`, 'error', 3200);
  }
});

pickDirectoryBtn.addEventListener('click', () => {
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

  const current = downloadDirectoryEl.value.trim();
  // If user already entered nested path manually, keep suffix and replace root.
  if (current.includes('/')) {
    const suffix = current.split('/').slice(1).join('/');
    downloadDirectoryEl.value = suffix ? `${folder}/${suffix}` : folder;
  } else {
    downloadDirectoryEl.value = folder;
  }
});

window.addEventListener('keydown', (e) => {
  const isSave = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's';
  if (!isSave) return;
  e.preventDefault();
  if (!saveBtn.disabled) saveBtn.click();
});

async function refreshPermissionStatus() {
  const hasDownloads = await chrome.permissions.contains({ permissions: ['downloads'] });
  downloadsStatusEl.textContent = `Downloads permission: ${hasDownloads ? 'granted' : 'not granted'}`;
  grantDownloadsBtn.disabled = hasDownloads;
  revokeDownloadsBtn.disabled = !hasDownloads;
}

function showStatus(msg) {
  statusEl.textContent = msg;
}
