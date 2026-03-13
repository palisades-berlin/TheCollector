import { MSG } from '../shared/messages.js';
import {
  SCROLL_SETTLE_MS,
  CAPTURE_MIN_INTERVAL_MS,
  CAPTURE_RETRY_MAX_ATTEMPTS,
  CAPTURE_RETRY_BASE_DELAY_MS,
} from '../shared/constants.js';
import {
  getScreenshotById,
  saveScreenshotRecord,
  prependCaptureReport,
} from '../shared/repos/screenshot-repo.js';
import { savePendingTile, deletePendingTiles } from '../shared/repos/tile-repo.js';
import { getUserSettings } from '../shared/repos/settings-repo.js';
import { createEnsureOffscreen } from './offscreen-manager.js';
import { hasDownloadsPermission, downloadCaptureParts } from './downloads.js';
import { canUseFeature } from '../shared/capabilities.js';
import {
  DEFAULT_CAPTURE_PROFILE_ID,
  canonicalizeCaptureProfileId,
  resolveCaptureSettings,
} from '../shared/capture-profiles.js';

export function createCaptureService() {
  const ensureOffscreen = createEnsureOffscreen();
  const activeCaptures = new Set();

  function logNonFatal(context, err) {
    if (globalThis?.THE_COLLECTOR_DEBUG_NON_FATAL !== true) return;
    console.debug('[THE Collector][non-fatal]', context, err);
  }

  function broadcast(type, payload) {
    chrome.runtime.sendMessage({ type, payload }).catch(() => {
      logNonFatal('broadcast', { type });
    });
  }

  function sendToTab(tabId, type, payload = {}) {
    return chrome.tabs.sendMessage(tabId, { type, payload });
  }

  async function syncContentProtocol(tabId) {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (protocol) => {
        /** @type {any} */ (window).__THE_COLLECTOR_PROTOCOL = protocol;
      },
      args: [
        {
          CS_GET_METRICS: MSG.CS_GET_METRICS,
          CS_PREPARE: MSG.CS_PREPARE,
          CS_SCROLL_TO: MSG.CS_SCROLL_TO,
          CS_RESTORE: MSG.CS_RESTORE,
        },
      ],
    });
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
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
      await prependCaptureReport(report);
    } catch (err) {
      logNonFatal('persistCaptureReport', err);
    }
  }

  async function captureTab(tabId, options = {}) {
    if (activeCaptures.has(tabId)) {
      throw new Error('A capture is already running for this tab.');
    }
    activeCaptures.add(tabId);

    let captureId = null;
    let stitchSucceeded = false;
    const captureStartedAt = Date.now();
    let totalTiles = 0;
    let capturedTiles = 0;
    let captureModeUsed = 'page';
    let fallbackUsed = 'none';
    let effectiveProfileId = null;
    const captureState = { lastCaptureAt: 0, retryCount: 0, quotaBackoffCount: 0 };

    try {
      await syncContentProtocol(tabId);
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['src/content/capture-agent.js'],
      });
      await sleep(150);

      const metrics = await sendToTab(tabId, MSG.CS_GET_METRICS);
      const { scrollW, scrollH, viewW, viewH, dpr, captureMode, crop, targetId } = metrics;

      const cols = Math.ceil(scrollW / viewW);
      const rows = Math.ceil(scrollH / viewH);
      totalTiles = cols * rows;
      captureModeUsed = captureMode || 'page';

      broadcast(MSG.SW_PROGRESS, { percent: 5, tabId });

      const prepResult = await sendToTab(tabId, MSG.CS_PREPARE, { targetId });
      if (!prepResult?.ok) {
        throw new Error('Failed to prepare capture target');
      }
      if (targetId && prepResult.targetId !== targetId) {
        throw new Error('Capture target changed before capture started');
      }

      const tab = await chrome.tabs.get(tabId);
      const id = crypto.randomUUID();
      captureId = id;
      let done = 0;

      try {
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const scrollX = col * viewW;
            const scrollY = row * viewH;

            const scrollResult = await sendToTab(tabId, MSG.CS_SCROLL_TO, {
              x: scrollX,
              y: scrollY,
              targetId,
            });
            if (!scrollResult?.done) {
              throw new Error(scrollResult?.error || 'Failed to scroll capture target');
            }
            await sleep(Math.max(50, Math.floor(SCROLL_SETTLE_MS / 4)));

            const dataUrl = await captureVisibleTabWithRetry(tab.windowId, captureState);
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
            await savePendingTile(
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
        await sendToTab(tabId, MSG.CS_RESTORE).catch((err) => logNonFatal('CS_RESTORE', err));
      }
      broadcast(MSG.SW_PROGRESS, { percent: 88, tabId });

      await ensureOffscreen();

      const stitchResult = await chrome.runtime.sendMessage({
        type: MSG.OS_STITCH,
        payload: {
          id,
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
      const settings = await getUserSettings();
      const profilesEnabled = canUseFeature('smart_save_profiles', settings);
      const requestedProfileId = options?.profileId ?? settings.defaultCaptureProfileId;
      effectiveProfileId = profilesEnabled
        ? canonicalizeCaptureProfileId(requestedProfileId || DEFAULT_CAPTURE_PROFILE_ID)
        : null;
      const effectiveSettings = profilesEnabled
        ? resolveCaptureSettings(settings, effectiveProfileId)
        : settings;
      const finalRecord = await getScreenshotById(id);
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
          profileId: effectiveProfileId,
        };
        await saveScreenshotRecord({
          ...finalRecord,
          captureProfileId: effectiveProfileId || '',
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

      const formatForDirectDownload =
        effectiveSettings.defaultExportFormat === 'jpg' ? 'jpg' : 'png';
      const wantsSkipPreview = effectiveSettings.autoDownloadMode === 'skip_preview';

      let downloadedDirectly = false;
      let skippedPdfDirectDownload = false;
      if (wantsSkipPreview && effectiveSettings.defaultExportFormat === 'pdf') {
        skippedPdfDirectDownload = true;
      } else if (wantsSkipPreview) {
        if (await hasDownloadsPermission()) {
          await downloadCaptureParts({
            ids: resultIds,
            format: formatForDirectDownload,
            directory: effectiveSettings.downloadDirectory,
            saveAs: effectiveSettings.saveAs,
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
        profileId: effectiveProfileId,
      });

      if (!downloadedDirectly && options?.suppressPreviewOpen !== true) {
        const q = new URLSearchParams({ id });
        if (captureMode) q.set('mode', captureMode);
        const previewUrl = chrome.runtime.getURL(`src/preview/preview.html?${q.toString()}`);
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
        profileId: effectiveProfileId,
        error: err?.message || 'Unknown capture error',
      });
      throw err;
    } finally {
      activeCaptures.delete(tabId);
      if (captureId && !stitchSucceeded) {
        await deletePendingTiles(captureId).catch((err) => logNonFatal('deleteTiles', err));
      }
    }
  }

  return { captureTab };
}
