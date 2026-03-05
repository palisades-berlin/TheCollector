import { MSG } from '../shared/messages.js';
import { buildDownloadFilename } from '../shared/filename.js';
import {
  validateCaptureStartPayload,
  validatePreviewDownloadPayload,
} from '../shared/protocol-validate.js';
import { getUserSettings } from '../shared/repos/settings-repo.js';
import {
  hasDownloadsPermission,
  downloadBlob,
} from './downloads.js';
import { createCaptureService } from './capture-service.js';

const captureService = createCaptureService();

function broadcast(type, payload) {
  chrome.runtime.sendMessage({ type, payload }).catch(() => {});
}

// ─── Message listener ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === MSG.CAPTURE_START) {
    const parsed = validateCaptureStartPayload(msg?.payload);
    if (!parsed.ok) {
      sendResponse({ ok: false, error: parsed.error });
      return false;
    }
    const tabId = parsed.value.tabId;
    captureService.captureTab(tabId)
      .then((id) => sendResponse({ ok: true, id }))
      .catch((err) => {
        broadcast(MSG.SW_ERROR, { error: err.message });
        sendResponse({ ok: false, error: err.message });
      });
    return true; // keep channel open for async sendResponse
  }

  if (msg.type === MSG.PT_DOWNLOAD) {
    (async () => {
      const parsed = validatePreviewDownloadPayload(msg?.payload);
      if (!parsed.ok) {
        throw new Error(parsed.error);
      }

      const settings = await getUserSettings();
      if (!(await hasDownloadsPermission())) {
        throw new Error('Downloads permission not granted');
      }
      const { blob, ext, title, partIndex, partTotal } = parsed.value;
      const filename = buildDownloadFilename({
        title,
        index: partIndex,
        total: partTotal,
        ext,
        directory: settings.downloadDirectory,
      });
      await downloadBlob({
        blob,
        filename,
        saveAs: partTotal > 1 ? false : Boolean(settings.saveAs),
      });
      sendResponse({ ok: true });
    })().catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }
});

// ─── Keyboard shortcut ────────────────────────────────────────────────────────

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'capture-fullpage') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  captureService.captureTab(tab.id).catch((err) =>
    console.error('[THE Collector] Capture error:', err)
  );
});
