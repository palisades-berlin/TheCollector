import { MSG } from '../shared/messages.js';
import {
  SCROLL_SETTLE_MS,
  CAPTURE_MIN_INTERVAL_MS,
  CAPTURE_RETRY_MAX_ATTEMPTS,
  CAPTURE_RETRY_BASE_DELAY_MS,
} from '../shared/constants.js';
import { saveTile, deleteTiles, getScreenshot, saveScreenshot } from '../shared/db.js';
import { getSettings } from '../shared/settings.js';

// ─── Offscreen document management ───────────────────────────────────────────

let offscreenReady = false;
let offscreenInitPromise = null;
const activeCaptures = new Set(); // tabId set

async function hasOffscreenDocument() {
  try {
    const contexts = await chrome.offscreen.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
    });
    return contexts.length > 0;
  } catch (_) {
    return false;
  }
}

async function ensureOffscreen() {
  if (offscreenReady) return;
  if (offscreenInitPromise) {
    await offscreenInitPromise;
    return;
  }

  offscreenInitPromise = (async () => {
    if (await hasOffscreenDocument()) {
      offscreenReady = true;
      return;
    }

    try {
      await chrome.offscreen.createDocument({
        url: chrome.runtime.getURL('src/offscreen/offscreen.html'),
        reasons: ['BLOBS'],
        justification: 'Stitch captured screenshot tiles into a full-page image',
      });
      offscreenReady = true;
    } catch (err) {
      // Race-safe fallback: if an offscreen doc exists now, treat create as success.
      if (await hasOffscreenDocument()) {
        offscreenReady = true;
        return;
      }
      // Some environments may fail `getContexts()` checks while still enforcing
      // singleton offscreen creation. If singleton violation is reported,
      // assume an offscreen doc already exists and proceed.
      const msg = err?.message || String(err || '');
      if (msg.includes('Only a single offscreen document may be created')) {
        offscreenReady = true;
        return;
      }
      throw err;
    }
  })();

  try {
    await offscreenInitPromise;
  } finally {
    offscreenInitPromise = null;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sendToTab(tabId, type, payload = {}) {
  return chrome.tabs.sendMessage(tabId, { type, payload });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function broadcast(type, payload) {
  chrome.runtime.sendMessage({ type, payload }).catch(() => {
    // Popup may be closed — that's fine
  });
}

function isCaptureQuotaError(err) {
  const msg = (err?.message || String(err || '')).toUpperCase();
  return msg.includes('MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND');
}

function sanitizeFilenameSegment(raw) {
  return String(raw || '')
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 90);
}

function sanitizeDirPath(raw) {
  if (!raw) return '';
  return String(raw)
    .replace(/\\/g, '/')
    .replace(/[^a-zA-Z0-9/_-]/g, '')
    .replace(/\.\./g, '')
    .replace(/\/{2,}/g, '/')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .slice(0, 120);
}

function buildFilename({ title, index, total, ext, directory }) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const safeTitle = sanitizeFilenameSegment(title) || 'screenshot';
  const partSuffix = total > 1 ? `-part-${index + 1}` : '';
  const name = `${safeTitle}-${ts}${partSuffix}.${ext}`;
  const dir = sanitizeDirPath(directory);
  return dir ? `${dir}/${name}` : name;
}

async function hasDownloadsPermission() {
  return chrome.permissions.contains({ permissions: ['downloads'] });
}

async function convertPngBlobToJpeg(blob) {
  const bitmap = await createImageBitmap(blob);
  try {
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to create OffscreenCanvas context');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0);
    return await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.92 });
  } finally {
    if (typeof bitmap.close === 'function') bitmap.close();
  }
}

async function downloadBlob({ blob, filename, saveAs }) {
  const url = URL.createObjectURL(blob);
  try {
    await chrome.downloads.download({ url, filename, saveAs });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
}

async function downloadCaptureParts({
  ids,
  format,
  directory,
  saveAs,
  titleHint,
}) {
  const total = ids.length;
  const ext = format === 'jpg' ? 'jpg' : 'png';
  const effectiveSaveAs = total > 1 ? false : Boolean(saveAs);

  for (let i = 0; i < ids.length; i++) {
    const record = await getScreenshot(ids[i]);
    if (!record?.blob) throw new Error(`Missing screenshot part: ${ids[i]}`);
    const blob =
      format === 'jpg' ? await convertPngBlobToJpeg(record.blob) : record.blob;
    const filename = buildFilename({
      title: titleHint || record.title || record.url || 'screenshot',
      index: i,
      total,
      ext,
      directory,
    });
    await downloadBlob({ blob, filename, saveAs: effectiveSaveAs });
  }
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
      await sleep(CAPTURE_RETRY_BASE_DELAY_MS * attempt);
    }
  }

  throw new Error('captureVisibleTab retry loop ended unexpectedly');
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

  try {
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
  const totalTiles = cols * rows;

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

  const captureState = { lastCaptureAt: 0 };

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
        const percent = 5 + Math.round((done / totalTiles) * 80);
        broadcast(MSG.SW_PROGRESS, { percent, tabId });
      }
    }
  } finally {
    // Restore page state (fixed elements, scroll position) even on failures
    await sendToTab(tabId, MSG.CS_RESTORE).catch(() => {});
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
  if (firstThumbBlob instanceof Blob) {
    const finalRecord = await getScreenshot(id);
    if (finalRecord?.blob) {
      await saveScreenshot({
        ...finalRecord,
        thumbBlob: firstThumbBlob,
      });
    }
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
    captureMode: captureMode || 'page',
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
  } finally {
    activeCaptures.delete(tabId);
    // Offscreen stitch deletes tiles on success; cleanup leftovers on failure.
    if (captureId && !stitchSucceeded) {
      await deleteTiles(captureId).catch(() => {});
    }
  }
}

// ─── Message listener ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === MSG.CAPTURE_START) {
    captureTab(msg.payload.tabId)
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
      const filename = buildFilename({
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
    console.error('[collector] Capture error:', err)
  );
});
