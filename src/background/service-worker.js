import { MSG } from '../shared/messages.js';
import { buildDownloadFilename } from '../shared/filename.js';
import {
  validateCaptureStartPayload,
  validateCaptureQueueStartPayload,
  validatePreviewDownloadPayload,
} from '../shared/protocol-validate.js';
import { getUserSettings } from '../shared/repos/settings-repo.js';
import { loadUrlList, saveUrlList, appendUrlHistoryEntry } from '../shared/repos/url-repo.js';
import { hasDownloadsPermission, downloadBlob } from './downloads.js';
import { createCaptureService } from './capture-service.js';
import { cleanUrl, isCollectibleUrl, normalizeUrlForCompare } from '../shared/url-utils.js';
import { URL_HISTORY_ACTION } from '../shared/url-history.js';
import { evaluateRevisitNudge } from '../shared/nudges.js';
import { loadRevisitNudgeState } from '../shared/repos/nudge-repo.js';
import { listScreenshotMetaRecords } from '../shared/repos/screenshot-repo.js';
import { canUseFeature } from '../shared/capabilities.js';
import { CAPTURE_QUEUE_SESSION_KEY, CAPTURE_QUEUE_STORAGE_KEY } from '../shared/constants.js';
import { CAPTURE_PROFILE } from '../shared/capture-profiles.js';

/** @typedef {import('../shared/types.js').UserSettings} UserSettings */

const captureService = createCaptureService();
const MENU_CAPTURE_PAGE = 'tc_capture_page';
const MENU_COLLECT_PAGE = 'tc_collect_page_url';
const MENU_COLLECT_LINK = 'tc_collect_link_url';
let runningQueueCapture = false;

function logNonFatal(context, err) {
  if (globalThis?.THE_COLLECTOR_DEBUG_NON_FATAL !== true) return;
  console.debug('[THE Collector][non-fatal]', context, err);
}

function broadcast(type, payload) {
  chrome.runtime.sendMessage({ type, payload }).catch((err) => logNonFatal('broadcast', err));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function activateTabForCapture(tabId) {
  const tab = await chrome.tabs.update(tabId, { active: true });
  if (tab?.windowId && chrome.windows?.update) {
    await chrome.windows.update(tab.windowId, { focused: true }).catch((err) => {
      logNonFatal('focusWindowForCapture', err);
    });
  }
  await sleep(140);
}

function getQueueStore() {
  return chrome.storage?.session || chrome.storage?.local || null;
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
      state.session && typeof state.session === 'object' ? state.session : null;
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
  return chrome.runtime.getURL(`src/history/history.html?${q.toString()}`);
}

async function collectUrl(rawUrl, meta = {}) {
  if (!isCollectibleUrl(rawUrl)) return { ok: false, reason: 'non_collectible' };
  const cleaned = cleanUrl(rawUrl);
  const normalized = normalizeUrlForCompare(cleaned);
  const urls = await loadUrlList();
  const alreadyExists = urls.some((existing) => normalizeUrlForCompare(existing) === normalized);
  if (alreadyExists) return { ok: true, duplicate: true, url: cleaned };
  const next = [cleaned, ...urls];
  await saveUrlList(next);
  await appendUrlHistoryEntry({
    actionType: URL_HISTORY_ACTION.ADD_CURRENT,
    urls: next,
    meta: { source: 'context_menu', ...meta },
  });
  return { ok: true, duplicate: false, url: cleaned };
}

// ─── Revisit Nudge badge ──────────────────────────────────────────────────────

const NUDGE_ALARM_NAME = 'tc_nudge_check';
const NUDGE_ALARM_PERIOD_MINUTES = 240; // every 4 hours
const NUDGE_BADGE_TEXT = '!';
const NUDGE_BADGE_COLOR = '#E53935';

async function checkAndUpdateNudgeBadge() {
  try {
    /** @type {UserSettings} */
    const settings = await getUserSettings();
    const nudgesEnabled =
      settings?.nudgesEnabled === true && canUseFeature('smart_revisit_nudges', settings);
    if (!nudgesEnabled) {
      await chrome.action.setBadgeText({ text: '' });
      return;
    }
    const [records, state] = await Promise.all([
      listScreenshotMetaRecords(),
      loadRevisitNudgeState(),
    ]);
    const nudge = evaluateRevisitNudge(records, {
      cadence: settings?.notificationCadence,
      state,
      now: Date.now(),
    });
    if (nudge) {
      await chrome.action.setBadgeBackgroundColor({ color: NUDGE_BADGE_COLOR });
      await chrome.action.setBadgeText({ text: NUDGE_BADGE_TEXT });
    } else {
      await chrome.action.setBadgeText({ text: '' });
    }
  } catch (err) {
    logNonFatal('checkAndUpdateNudgeBadge', err);
  }
}

function scheduleNudgeAlarm() {
  chrome.alarms.get(NUDGE_ALARM_NAME, (existing) => {
    if (!existing) {
      chrome.alarms.create(NUDGE_ALARM_NAME, { periodInMinutes: NUDGE_ALARM_PERIOD_MINUTES });
    }
  });
}

function createOrRefreshContextMenus() {
  if (!chrome.contextMenus?.removeAll) return;
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_CAPTURE_PAGE,
      title: 'Capture this page',
      contexts: ['page', 'selection'],
    });
    chrome.contextMenus.create({
      id: MENU_COLLECT_PAGE,
      title: 'Collect this page URL',
      contexts: ['page', 'selection'],
    });
    chrome.contextMenus.create({
      id: MENU_COLLECT_LINK,
      title: 'Collect this link URL',
      contexts: ['link'],
    });
  });
}

chrome.runtime.onInstalled.addListener((details) => {
  createOrRefreshContextMenus();
  scheduleNudgeAlarm();
  if (details.reason === 'install') {
    const url = chrome.runtime.getURL('src/options/options.html?onboarding=1');
    chrome.tabs.create({ url });
  }
});

chrome.runtime.onStartup?.addListener(() => {
  createOrRefreshContextMenus();
  scheduleNudgeAlarm();
  checkAndUpdateNudgeBadge();
});

chrome.alarms?.onAlarm?.addListener((alarm) => {
  if (alarm.name === NUDGE_ALARM_NAME) {
    checkAndUpdateNudgeBadge();
  }
});

chrome.contextMenus?.onClicked?.addListener(async (info, tab) => {
  try {
    if (info.menuItemId === MENU_CAPTURE_PAGE) {
      if (!tab?.id) return;
      await captureService.captureTab(tab.id);
      return;
    }

    if (info.menuItemId === MENU_COLLECT_PAGE) {
      const raw = tab?.url || info.pageUrl;
      const result = await collectUrl(raw, { via: 'page' });
      if (!result.ok) {
        broadcast(MSG.SW_ERROR, { error: 'This URL cannot be collected.' });
      }
      return;
    }

    if (info.menuItemId === MENU_COLLECT_LINK) {
      const result = await collectUrl(info.linkUrl, { via: 'link' });
      if (!result.ok) {
        broadcast(MSG.SW_ERROR, { error: 'This link URL cannot be collected.' });
      }
    }
  } catch (err) {
    broadcast(MSG.SW_ERROR, { error: err.message || 'Action failed' });
  }
});

chrome.omnibox?.onInputChanged?.addListener((_text, suggest) => {
  suggest([
    { content: 'tc research', description: 'Queue current tab with Research profile (Ultra)' },
    { content: 'tc star', description: 'Save current page URL to URL list (Ultra)' },
    { content: 'tc queue', description: 'Queue current tab for batch capture (Ultra)' },
  ]);
});

function resolveOmniboxAction(input) {
  const query = String(input || '')
    .trim()
    .toLowerCase();
  if (query === 'tc research' || query === 'research') return 'research';
  if (query === 'tc star' || query === 'star') return 'star';
  if (query === 'tc queue' || query === 'queue') return 'queue';
  return '';
}

async function enqueueTabForCapture(tab, profileId = null) {
  if (!tab?.id || !isCollectibleUrl(tab.url)) return { ok: false, reason: 'non_collectible' };
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

chrome.omnibox?.onInputEntered?.addListener(async (text) => {
  const action = resolveOmniboxAction(text);
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  try {
    /** @type {UserSettings} */
    const settings = await getUserSettings();
    if (!canUseFeature('omnibox_actions', settings)) {
      await chrome.tabs.create({ url: chrome.runtime.getURL('src/options/options.html') });
      return;
    }
    if (action === 'research') {
      await enqueueTabForCapture(tab, CAPTURE_PROFILE.RESEARCH);
      return;
    }
    if (action === 'star') {
      await collectUrl(tab.url, { via: 'omnibox_star', intent: 'star' });
      return;
    }
    if (action === 'queue') {
      await enqueueTabForCapture(tab, null);
      return;
    }
    // Fallback: open history for unknown keyword input.
    await chrome.tabs.create({ url: chrome.runtime.getURL('src/history/history.html') });
  } catch (err) {
    broadcast(MSG.SW_ERROR, { error: err.message || 'Omnibox action failed' });
  }
});

// ─── Message listener ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
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
        broadcast(MSG.SW_ERROR, { error: err.message });
        sendResponse({ ok: false, error: err.message });
      });
    return true; // keep channel open for async sendResponse
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
      await chrome.tabs.create({
        url: buildHistoryQueueSummaryUrl({ total: tabIds.length, success, failed }),
      });
      await writeQueueState([], null);
      sendResponse({ ok: true, total: tabIds.length, success, failed });
    })()
      .catch(async (err) => {
        await writeQueueState([], null).catch((writeErr) =>
          logNonFatal('clearQueueState', writeErr)
        );
        sendResponse({ ok: false, error: err.message || 'Queue capture failed' });
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
});

// ─── Keyboard shortcut ────────────────────────────────────────────────────────

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'capture-fullpage') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  captureService
    .captureTab(tab.id)
    .catch((err) => console.error('[THE Collector] Capture error:', err));
});
