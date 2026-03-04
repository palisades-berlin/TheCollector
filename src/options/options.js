import { getSettings, setSettings } from '../shared/settings.js';
import { showToast } from '../shared/toast.js';

const defaultExportFormatEl = document.getElementById('defaultExportFormat');
const defaultPdfPageSizeEl = document.getElementById('defaultPdfPageSize');
const autoDownloadModeEl = document.getElementById('autoDownloadMode');
const downloadDirectoryEl = document.getElementById('downloadDirectory');
const saveAsEl = document.getElementById('saveAs');
const fitClipboardToDocsLimitEl = document.getElementById('fitClipboardToDocsLimit');
const saveBtn = document.getElementById('saveBtn');
const statusEl = document.getElementById('status');
const downloadsStatusEl = document.getElementById('downloadsStatus');
const grantDownloadsBtn = document.getElementById('grantDownloads');
const revokeDownloadsBtn = document.getElementById('revokeDownloads');

init().catch((err) => showStatus(`Failed to load settings: ${err.message}`));

async function init() {
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
