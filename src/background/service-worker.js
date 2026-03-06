import { MSG } from '../shared/messages.js';
import { buildDownloadFilename } from '../shared/filename.js';
import {
  validateCaptureStartPayload,
  validatePreviewDownloadPayload,
} from '../shared/protocol-validate.js';
import { getUserSettings } from '../shared/repos/settings-repo.js';
import { loadUrlList, saveUrlList, appendUrlHistoryEntry } from '../shared/repos/url-repo.js';
import { hasDownloadsPermission, downloadBlob } from './downloads.js';
import { createCaptureService } from './capture-service.js';
import { cleanUrl, isCollectibleUrl, normalizeUrlForCompare } from '../shared/url-utils.js';
import { URL_HISTORY_ACTION } from '../shared/url-history.js';

const captureService = createCaptureService();
const MENU_CAPTURE_PAGE = 'tc_capture_page';
const MENU_COLLECT_PAGE = 'tc_collect_page_url';
const MENU_COLLECT_LINK = 'tc_collect_link_url';

function logNonFatal(context, err) {
  if (globalThis?.THE_COLLECTOR_DEBUG_NON_FATAL !== true) return;
  console.debug('[THE Collector][non-fatal]', context, err);
}

function broadcast(type, payload) {
  chrome.runtime.sendMessage({ type, payload }).catch((err) => logNonFatal('broadcast', err));
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
  if (details.reason === 'install') {
    const url = chrome.runtime.getURL('src/options/options.html?onboarding=1');
    chrome.tabs.create({ url });
  }
});

chrome.runtime.onStartup?.addListener(() => {
  createOrRefreshContextMenus();
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
    { content: 'capture', description: 'Capture current page screenshot' },
    { content: 'collect', description: 'Collect current page URL' },
  ]);
});

chrome.omnibox?.onInputEntered?.addListener(async (text) => {
  const query = String(text || '')
    .trim()
    .toLowerCase();
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  try {
    if (query.startsWith('capture')) {
      await captureService.captureTab(tab.id);
      return;
    }
    if (query.startsWith('collect')) {
      await collectUrl(tab.url, { via: 'omnibox' });
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
    captureService
      .captureTab(tabId)
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
  captureService
    .captureTab(tab.id)
    .catch((err) => console.error('[THE Collector] Capture error:', err));
});
