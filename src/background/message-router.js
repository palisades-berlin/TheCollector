/**
 * Creates runtime message routing for service-worker background actions.
 *
 * @param {{
 *  chromeApi?: typeof chrome,
 *  MSG: Record<string, string>,
 *  validateCaptureStartPayload: (payload: unknown) => { ok: boolean, error?: string, value?: { tabId: number, profileId: string | null, suppressPreviewOpen: boolean } },
 *  validateCaptureQueueStartPayload: (payload: unknown) => { ok: boolean, error?: string, value?: { tabIds: number[], profileId: string | null } },
 *  validatePreviewDownloadPayload: (payload: unknown) => { ok: boolean, error?: string, value?: { blob: Blob, ext: string, title: string, partIndex: number, partTotal: number } },
 *  captureService: { captureTab: (tabId: number, options?: { profileId?: string | null, suppressPreviewOpen?: boolean }) => Promise<unknown> },
 *  getUserSettings: () => Promise<any>,
 *  hasDownloadsPermission: () => Promise<boolean>,
 *  downloadBlob: (args: { blob: Blob, filename: string, saveAs: boolean }) => Promise<unknown>,
 *  buildDownloadFilename: (args: { title: string, index: number, total: number, ext: string, directory?: string }) => string,
 *  readQueueState: () => Promise<{ queue: Array<{ tabId: number, title: string, url: string }>, session: unknown }>,
 *  writeQueueState: (queue: unknown, session: unknown) => Promise<void>,
 *  markQueueTabProcessed: (tabId: number) => Promise<void>,
 *  activateTabForCapture: (tabId: number) => Promise<void>,
 *  buildHistoryQueueSummaryUrl: (summary: { total: number, success: number, failed: number }) => string,
 *  logNonFatal: (context: string, err: unknown) => void,
 *  broadcast: (type: string, payload: unknown) => void
 * }} deps
 * @returns {{
 *  initMessageRouter: () => void,
 *  disposeMessageRouter: () => void
 * }}
 */
export function createMessageRouter(deps) {
  const chromeApi = deps.chromeApi || chrome;
  const {
    MSG,
    validateCaptureStartPayload,
    validateCaptureQueueStartPayload,
    validatePreviewDownloadPayload,
    captureService,
    getUserSettings,
    hasDownloadsPermission,
    downloadBlob,
    buildDownloadFilename,
    readQueueState,
    writeQueueState,
    markQueueTabProcessed,
    activateTabForCapture,
    buildHistoryQueueSummaryUrl,
    logNonFatal,
    broadcast,
  } = deps;

  let runningQueueCapture = false;

  /** @type {(msg: { type?: string, payload?: unknown }, sender: chrome.runtime.MessageSender, sendResponse: (response?: unknown) => void) => boolean | void} */
  const onRuntimeMessage = (msg, _sender, sendResponse) => {
    if (msg.type === MSG.CAPTURE_START) {
      const parsed = validateCaptureStartPayload(msg?.payload);
      if (!parsed.ok) {
        sendResponse({ ok: false, error: parsed.error });
        return false;
      }
      const tabId = parsed.value.tabId;
      const profileId = parsed.value.profileId ?? null;
      const suppressPreviewOpen = parsed.value.suppressPreviewOpen === true;
      captureService
        .captureTab(tabId, { profileId, suppressPreviewOpen })
        .then((id) => sendResponse({ ok: true, id }))
        .catch((err) => {
          const message = /** @type {any} */ (err)?.message || 'Capture failed';
          broadcast(MSG.SW_ERROR, { error: message });
          sendResponse({ ok: false, error: message });
        });
      return true;
    }

    if (msg.type === MSG.CAPTURE_QUEUE_START) {
      const parsed = validateCaptureQueueStartPayload(msg?.payload);
      if (!parsed.ok) {
        sendResponse({ ok: false, error: parsed.error });
        return false;
      }
      if (runningQueueCapture) {
        sendResponse({ ok: false, error: 'A queued capture is already running.' });
        return false;
      }

      runningQueueCapture = true;
      const { tabIds, profileId } = parsed.value;
      (async () => {
        const queueState = await readQueueState();
        const existingQueue = queueState.queue;
        const filteredQueue = existingQueue.filter((item) => tabIds.includes(Number(item.tabId)));
        const initialQueue =
          filteredQueue.length > 0
            ? filteredQueue
            : tabIds.map((tabId) => ({ tabId: Number(tabId), title: `Tab ${tabId}` }));
        await writeQueueState(initialQueue, {
          status: 'running',
          startedAt: Date.now(),
          updatedAt: Date.now(),
          profileId: profileId || null,
          total: tabIds.length,
          remainingTabIds: [...tabIds],
        });

        let success = 0;
        let failed = 0;
        for (const tabId of tabIds) {
          try {
            await activateTabForCapture(tabId);
            await captureService.captureTab(tabId, {
              profileId: profileId ?? undefined,
              suppressPreviewOpen: true,
            });
            success += 1;
          } catch {
            failed += 1;
          } finally {
            await markQueueTabProcessed(tabId);
          }
        }
        await writeQueueState([], {
          status: 'completed',
          finishedAt: Date.now(),
          total: tabIds.length,
          success,
          failed,
        });
        broadcast(MSG.SW_QUEUE_DONE, { total: tabIds.length, success, failed });
        await chromeApi.tabs.create({
          url: buildHistoryQueueSummaryUrl({ total: tabIds.length, success, failed }),
        });
        await writeQueueState([], null);
        sendResponse({ ok: true, total: tabIds.length, success, failed });
      })()
        .catch(async (err) => {
          await writeQueueState([], null).catch((writeErr) =>
            logNonFatal('clearQueueState', writeErr)
          );
          sendResponse({
            ok: false,
            error: /** @type {any} */ (err)?.message || 'Queue capture failed',
          });
        })
        .finally(() => {
          runningQueueCapture = false;
        });
      return true;
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
  };

  function initMessageRouter() {
    chromeApi.runtime.onMessage.addListener(onRuntimeMessage);
  }

  function disposeMessageRouter() {
    chromeApi.runtime.onMessage.removeListener?.(onRuntimeMessage);
  }

  return {
    initMessageRouter,
    disposeMessageRouter,
  };
}
