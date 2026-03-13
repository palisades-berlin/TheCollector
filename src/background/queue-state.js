/**
 * Builds queue/session state helpers for Capture Queue workflows.
 *
 * @param {{
 *  chromeApi?: typeof chrome,
 *  constants: { CAPTURE_QUEUE_STORAGE_KEY: string, CAPTURE_QUEUE_SESSION_KEY: string },
 *  logNonFatal: (context: string, err: unknown) => void,
 *  isCollectibleUrl: (rawUrl: string) => boolean,
 *  sleep: (ms: number) => Promise<void>
 * }} deps
 * @returns {{
 *  readQueueState: () => Promise<{ queue: Array<{ tabId: number, title: string, url: string }>, session: unknown }>,
 *  writeQueueState: (queue: unknown, session: unknown) => Promise<void>,
 *  markQueueTabProcessed: (tabId: number) => Promise<void>,
 *  buildHistoryQueueSummaryUrl: (summary: { total: number, success: number, failed: number }) => string,
 *  activateTabForCapture: (tabId: number) => Promise<void>,
 *  enqueueTabForCapture: (tab: chrome.tabs.Tab | undefined, profileId?: string | null) => Promise<{ ok: boolean, reason?: string, queued?: boolean }>
 * }}
 */
export function createQueueStateManager(deps) {
  const chromeApi = deps.chromeApi || chrome;
  const { CAPTURE_QUEUE_STORAGE_KEY, CAPTURE_QUEUE_SESSION_KEY } = deps.constants;
  const { logNonFatal, isCollectibleUrl, sleep } = deps;

  function getQueueStore() {
    return chromeApi.storage?.session || chromeApi.storage?.local || null;
  }

  function normalizeQueueEntries(entries) {
    if (!Array.isArray(entries)) return [];
    const seen = new Set();
    const normalized = [];
    for (const entry of entries) {
      const tabId = Number(entry?.tabId);
      if (!Number.isInteger(tabId) || tabId <= 0 || seen.has(tabId)) continue;
      seen.add(tabId);
      normalized.push({
        tabId,
        title: String(entry?.title || `Tab ${tabId}`),
        url: String(entry?.url || ''),
      });
    }
    return normalized;
  }

  async function readQueueState() {
    const store = getQueueStore();
    if (!store?.get) return { queue: [], session: null };
    const state = await store.get({
      [CAPTURE_QUEUE_STORAGE_KEY]: [],
      [CAPTURE_QUEUE_SESSION_KEY]: null,
    });
    return {
      queue: normalizeQueueEntries(state?.[CAPTURE_QUEUE_STORAGE_KEY]),
      session: state?.[CAPTURE_QUEUE_SESSION_KEY] || null,
    };
  }

  async function writeQueueState(queue, session) {
    const store = getQueueStore();
    if (!store?.set) return;
    await store.set({
      [CAPTURE_QUEUE_STORAGE_KEY]: normalizeQueueEntries(queue),
      [CAPTURE_QUEUE_SESSION_KEY]: session || null,
    });
  }

  async function markQueueTabProcessed(tabId) {
    try {
      const state = await readQueueState();
      const nextQueue = state.queue.filter((item) => Number(item.tabId) !== Number(tabId));
      const currentSession =
        state.session && typeof state.session === 'object'
          ? /** @type {any} */ (state.session)
          : null;
      const nextSession = currentSession
        ? {
            ...currentSession,
            remainingTabIds: Array.isArray(currentSession.remainingTabIds)
              ? currentSession.remainingTabIds.filter((id) => Number(id) !== Number(tabId))
              : [],
            updatedAt: Date.now(),
          }
        : null;
      await writeQueueState(nextQueue, nextSession);
    } catch (err) {
      logNonFatal('markQueueTabProcessed', err);
    }
  }

  function buildHistoryQueueSummaryUrl({ total, success, failed }) {
    const q = new URLSearchParams({
      queueCompleted: '1',
      total: String(Math.max(0, Number(total || 0))),
      success: String(Math.max(0, Number(success || 0))),
      failed: String(Math.max(0, Number(failed || 0))),
    });
    return chromeApi.runtime.getURL(`src/history/history.html?${q.toString()}`);
  }

  async function activateTabForCapture(tabId) {
    const tab = await chromeApi.tabs.update(tabId, { active: true });
    if (tab?.windowId && chromeApi.windows?.update) {
      await chromeApi.windows.update(tab.windowId, { focused: true }).catch((err) => {
        logNonFatal('focusWindowForCapture', err);
      });
    }
    await sleep(140);
  }

  async function enqueueTabForCapture(tab, profileId = null) {
    if (!tab?.id || !isCollectibleUrl(tab.url || '')) {
      return { ok: false, reason: 'non_collectible' };
    }
    const queueState = await readQueueState();
    const existingQueue = Array.isArray(queueState.queue) ? queueState.queue : [];
    const tabId = Number(tab.id);
    const title = String(tab.title || `Tab ${tabId}`);
    const url = String(tab.url || '');
    const alreadyQueued = existingQueue.some((item) => Number(item.tabId) === tabId);
    const nextQueue = alreadyQueued ? existingQueue : [...existingQueue, { tabId, title, url }];
    await writeQueueState(nextQueue, {
      status: 'idle',
      updatedAt: Date.now(),
      profileId: profileId || null,
      total: nextQueue.length,
      remainingTabIds: nextQueue.map((item) => Number(item.tabId)),
    });
    return { ok: true, queued: !alreadyQueued };
  }

  return {
    readQueueState,
    writeQueueState,
    markQueueTabProcessed,
    buildHistoryQueueSummaryUrl,
    activateTabForCapture,
    enqueueTabForCapture,
  };
}
