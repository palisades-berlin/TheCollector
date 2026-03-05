import { MSG } from '../shared/messages.js';
import {
  SCROLL_SETTLE_MS,
  CAPTURE_MIN_INTERVAL_MS,
  CAPTURE_RETRY_MAX_ATTEMPTS,
  CAPTURE_RETRY_BASE_DELAY_MS,
} from '../shared/constants.js';
import { saveTile, deleteTiles, getScreenshot, saveScreenshot } from '../shared/db.js';
import { buildDownloadFilename } from '../shared/filename.js';
import { getSettings } from '../shared/settings.js';
import { toPositiveInt } from '../shared/validation.js';
import { createEnsureOffscreen } from './offscreen-manager.js';
import {
  hasDownloadsPermission,
  downloadBlob,
  downloadCaptureParts,
} from './downloads.js';

// ─── Offscreen document management ───────────────────────────────────────────

const ensureOffscreen = createEnsureOffscreen();
const activeCaptures = new Set(); // tabId set
const CAPTURE_REPORTS_KEY = 'captureReports';
const CAPTURE_REPORTS_LIMIT = 30;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sendToTab(tabId, type, payload = {}) {
  return chrome.tabs.sendMessage(tabId, { type, payload });
}

async function syncContentProtocol(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: (protocol) => {
      window.__THE_COLLECTOR_PROTOCOL = protocol;
    },
    args: [{
      CS_GET_METRICS: MSG.CS_GET_METRICS,
      CS_PREPARE: MSG.CS_PREPARE,
      CS_SCROLL_TO: MSG.CS_SCROLL_TO,
      CS_RESTORE: MSG.CS_RESTORE,
    }],
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function logNonFatal(context, err) {
  if (globalThis?.THE_COLLECTOR_DEBUG_NON_FATAL !== true) return;
  console.debug('[THE Collector][non-fatal]', context, err);
}

function broadcast(type, payload) {
  chrome.runtime.sendMessage({ type, payload }).catch(() => {
    // Popup may be closed — that's fine
    logNonFatal('broadcast', { type });
  });
}

function isCaptureQuotaError(err) {
  const msg = (err?.message || String(err || '')).toUpperCase();
  return msg.includes('MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND');
}

async function captureVisibleTabWithRetry(windowId, captureState) {
  const elapsed = Date.now() - captureState.lastCaptureAt;
  if (elapsed < CAPTURE_MIN_INTERVAL_MS) {
    await sleep(CAPTURE_MIN_INTERVAL_MS - elapsed);
  }

  for (let attempt = 1; attempt <= CAPTURE_RETRY_MAX_ATTEMPTS; attempt++) {
    try {
      const dataUrl = await chrome.tabs.captureVisibleTab(windowId, {
        format: 'png',
      });
      captureState.lastCaptureAt = Date.now();
      return dataUrl;
    } catch (err) {
      if (!isCaptureQuotaError(err) || attempt === CAPTURE_RETRY_MAX_ATTEMPTS) {
        throw err;
      }
      captureState.retryCount = Number(captureState.retryCount || 0) + 1;
      captureState.quotaBackoffCount = Number(captureState.quotaBackoffCount || 0) + 1;
      await sleep(CAPTURE_RETRY_BASE_DELAY_MS * attempt);
    }
  }

  throw new Error('captureVisibleTab retry loop ended unexpectedly');
}

async function persistCaptureReport(report) {
  try {
    const stored = await chrome.storage.local.get({ [CAPTURE_REPORTS_KEY]: [] });
    const current = Array.isArray(stored[CAPTURE_REPORTS_KEY])
      ? stored[CAPTURE_REPORTS_KEY]
      : [];
    const next = [report, ...current].slice(0, CAPTURE_REPORTS_LIMIT);
    await chrome.storage.local.set({ [CAPTURE_REPORTS_KEY]: next });
  } catch (err) {
    // Do not fail capture flows due to telemetry persistence issues.
    logNonFatal('persistCaptureReport', err);
  }
}

// ─── Core capture logic ───────────────────────────────────────────────────────

async function captureTab(tabId) {
  if (activeCaptures.has(tabId)) {
    throw new Error('A capture is already running for this tab.');
  }
  activeCaptures.add(tabId);

  let captureId = null;
  let stitchSucceeded = false;
  let firstThumbBlob = null;
  const captureStartedAt = Date.now();
  let totalTiles = 0;
  let capturedTiles = 0;
  let captureModeUsed = 'page';
  let fallbackUsed = 'none';
  const captureState = { lastCaptureAt: 0, retryCount: 0, quotaBackoffCount: 0 };

  try {
  await syncContentProtocol(tabId);
  // Inject content script (guard in agent prevents double-injection issues)
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['src/content/capture-agent.js'],
  });
  await sleep(150);

  // Get full-page dimensions and viewport size
  const metrics = await sendToTab(tabId, MSG.CS_GET_METRICS);
  const { scrollW, scrollH, viewW, viewH, dpr, captureMode, crop, targetId } = metrics;

  const cols = Math.ceil(scrollW / viewW);
  const rows = Math.ceil(scrollH / viewH);
  totalTiles = cols * rows;
  captureModeUsed = captureMode || 'page';

  broadcast(MSG.SW_PROGRESS, { percent: 5, tabId });

  // Suppress fixed/sticky elements to avoid repeated headers in capture
  const prepResult = await sendToTab(tabId, MSG.CS_PREPARE, { targetId });
  if (!prepResult?.ok) {
    throw new Error('Failed to prepare capture target');
  }
  if (targetId && prepResult.targetId !== targetId) {
    throw new Error('Capture target changed before capture started');
  }

  const tab = await chrome.tabs.get(tabId);
  // Use a single UUID as both the screenshot ID and the tile job ID
  const id = crypto.randomUUID();
  captureId = id;
  let done = 0;

  try {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const scrollX = col * viewW;
        const scrollY = row * viewH;

        // Scroll and wait for page to settle (content script does the timing)
        const scrollResult = await sendToTab(tabId, MSG.CS_SCROLL_TO, {
          x: scrollX,
          y: scrollY,
          targetId,
        });
        if (!scrollResult?.done) {
          throw new Error(scrollResult?.error || 'Failed to scroll capture target');
        }
        // Small extra buffer for compositor to flush
        await sleep(Math.max(50, Math.floor(SCROLL_SETTLE_MS / 4)));

        const dataUrl = await captureVisibleTabWithRetry(tab.windowId, captureState);

        // Convert dataURL → Blob and persist to IDB.
        // This avoids sending large binary data through chrome.runtime.sendMessage
        // (which has a hard 64 MiB limit). The offscreen document reads tiles
        // directly from IDB, so only tiny metadata crosses the message boundary.
        const blob = await fetch(dataUrl).then((r) => r.blob());
        const tileIndex = row * cols + col;
        const tileCrop =
          (captureMode === 'iframe' || captureMode === 'element') && crop
            ? {
                sx: crop.x,
                sy: crop.y,
                sw: crop.w,
                sh: crop.h,
              }
            : null;
        const tileSize = tileCrop
          ? { w: tileCrop.sw, h: tileCrop.sh }
          : {
              w: Math.max(1, Math.round(viewW * dpr)),
              h: Math.max(1, Math.round(viewH * dpr)),
            };
        if (tileIndex === 0 && !firstThumbBlob) {
          firstThumbBlob = blob;
        }
        await saveTile(
          id,
          tileIndex,
          Math.round(scrollX * dpr),
          Math.round(scrollY * dpr),
          blob,
          tileCrop,
          tileSize
        );

        done++;
        capturedTiles = done;
        const percent = 5 + Math.round((done / totalTiles) * 80);
        broadcast(MSG.SW_PROGRESS, { percent, tabId });
      }
    }
  } finally {
    // Restore page state (fixed elements, scroll position) even on failures
    await sendToTab(tabId, MSG.CS_RESTORE).catch((err) =>
      logNonFatal('CS_RESTORE', err)
    );
  }
  broadcast(MSG.SW_PROGRESS, { percent: 88, tabId });

  // Tell the offscreen document to stitch — only metadata in the message
  await ensureOffscreen();

  const stitchResult = await chrome.runtime.sendMessage({
    type: MSG.OS_STITCH,
    payload: {
      id,          // also used as jobId for tile lookup
      totalW: Math.round(scrollW * dpr),
      totalH: Math.round(scrollH * dpr),
      sourceUrl: tab.url,
      title: tab.title,
    },
  });

  if (!stitchResult?.ok) {
    throw new Error(stitchResult?.error || 'Stitching failed');
  }
  stitchSucceeded = true;

  const resultIds = Array.isArray(stitchResult?.ids) ? stitchResult.ids : [id];
  const finalRecord = await getScreenshot(id);
  if (finalRecord?.blob) {
    fallbackUsed = finalRecord.autoScaledFromOversized ? 'oversized_autoscale' : 'none';
    const captureReport = {
      durationMs: Date.now() - captureStartedAt,
      totalTiles,
      capturedTiles,
      retries: Number(captureState.retryCount || 0),
      quotaBackoffs: Number(captureState.quotaBackoffCount || 0),
      fallbackUsed,
      captureMode: captureModeUsed,
    };
    await saveScreenshot({
      ...finalRecord,
      ...(firstThumbBlob instanceof Blob ? { thumbBlob: firstThumbBlob } : {}),
      captureReport,
    });
    await persistCaptureReport({
      ok: true,
      id,
      timestamp: Date.now(),
      url: finalRecord.url || '',
      title: finalRecord.title || '',
      ...captureReport,
    });
  }
  const settings = await getSettings();
  const formatForDirectDownload =
    settings.defaultExportFormat === 'jpg' ? 'jpg' : 'png';
  const wantsSkipPreview = settings.autoDownloadMode === 'skip_preview';

  let downloadedDirectly = false;
  let skippedPdfDirectDownload = false;
  if (wantsSkipPreview && settings.defaultExportFormat === 'pdf') {
    skippedPdfDirectDownload = true;
  } else if (wantsSkipPreview) {
    if (await hasDownloadsPermission()) {
      await downloadCaptureParts({
        ids: resultIds,
        format: formatForDirectDownload,
        directory: settings.downloadDirectory,
        saveAs: settings.saveAs,
        titleHint: tab.title || tab.url || 'screenshot',
      });
      downloadedDirectly = true;
    }
  }

  broadcast(MSG.SW_PROGRESS, { percent: 100, tabId });
  broadcast(MSG.SW_DONE, {
    id,
    tabId,
    split: false,
    partCount: 1,
    captureMode: captureModeUsed,
    downloadedDirectly,
    skippedPdfDirectDownload,
  });

  // Open preview in a tab next to the source tab unless direct-download mode succeeded.
  if (!downloadedDirectly) {
    const q = new URLSearchParams({ id });
    if (captureMode) q.set('mode', captureMode);
    const previewUrl = chrome.runtime.getURL(
      `src/preview/preview.html?${q.toString()}`
    );
    await chrome.tabs.create({ url: previewUrl, index: tab.index + 1 });
  }

  return id;
  } catch (err) {
    await persistCaptureReport({
      ok: false,
      timestamp: Date.now(),
      tabId,
      durationMs: Date.now() - captureStartedAt,
      totalTiles,
      capturedTiles,
      retries: Number(captureState.retryCount || 0),
      quotaBackoffs: Number(captureState.quotaBackoffCount || 0),
      fallbackUsed,
      captureMode: captureModeUsed,
      error: err?.message || 'Unknown capture error',
    });
    throw err;
  } finally {
    activeCaptures.delete(tabId);
    // Offscreen stitch deletes tiles on success; cleanup leftovers on failure.
    if (captureId && !stitchSucceeded) {
      await deleteTiles(captureId).catch((err) =>
        logNonFatal('deleteTiles', err)
      );
    }
  }
}

// ─── Message listener ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === MSG.CAPTURE_START) {
    const tabId = toPositiveInt(msg?.payload?.tabId);
    if (!tabId) {
      sendResponse({ ok: false, error: 'Invalid tab id' });
      return false;
    }
    captureTab(tabId)
      .then((id) => sendResponse({ ok: true, id }))
      .catch((err) => {
        broadcast(MSG.SW_ERROR, { error: err.message });
        sendResponse({ ok: false, error: err.message });
      });
    return true; // keep channel open for async sendResponse
  }

  if (msg.type === MSG.PT_DOWNLOAD) {
    (async () => {
      const settings = await getSettings();
      if (!(await hasDownloadsPermission())) {
        throw new Error('Downloads permission not granted');
      }
      const blob = msg.payload?.blob;
      const ext = msg.payload?.ext === 'jpg' ? 'jpg' : msg.payload?.ext === 'pdf' ? 'pdf' : 'png';
      if (!(blob instanceof Blob)) {
        throw new Error('Download payload is missing blob data');
      }
      const filename = buildDownloadFilename({
        title: msg.payload?.title || 'screenshot',
        index: Number(msg.payload?.partIndex || 0),
        total: Math.max(1, Number(msg.payload?.partTotal || 1)),
        ext,
        directory: settings.downloadDirectory,
      });
      await downloadBlob({
        blob,
        filename,
        saveAs: Math.max(1, Number(msg.payload?.partTotal || 1)) > 1 ? false : Boolean(settings.saveAs),
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
  captureTab(tab.id).catch((err) =>
    console.error('[THE Collector] Capture error:', err)
  );
});
