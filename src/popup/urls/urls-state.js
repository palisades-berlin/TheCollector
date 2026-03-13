import { anchorDownloadBlob } from '../../shared/download.js';
import { normalizeUrlForCompare, isCollectibleUrl, escapeCsvCell } from '../../shared/url-utils.js';
import { URL_HISTORY_ACTION, normalizeUrlArray } from '../../shared/url-history.js';
import {
  loadUrlList,
  saveUrlList,
  loadUrlUndoSnapshot,
  writeUrlsAndUndo,
  clearUrlUndoSnapshot,
  loadUrlHistoryEntries,
  appendUrlHistoryEntry,
  loadUrlRecords as loadUrlRecordsRepo,
  setUrlRecordStar,
  setUrlRecordTags,
  setUrlRecordNote,
  removeUrlRecordMetadata,
} from '../../shared/repos/url-repo.js';

/** @typedef {import('../../shared/types.js').UrlMutationContext} UrlMutationContext */
/** @typedef {import('../../shared/types.js').UrlHistoryActionType} UrlHistoryActionType */

export const URL_LIMIT = 500;
function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function chromeCall(invoke) {
  return new Promise((resolve, reject) => {
    invoke((result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(result);
    });
  });
}

export function formatUrlCount(count) {
  return `${count} URL${count === 1 ? '' : 's'}`;
}

export function buildNormalizedSet(urls) {
  return new Set(urls.map(normalizeUrlForCompare));
}

export async function loadUrls() {
  return loadUrlList();
}

export async function loadUndoSnapshot() {
  return loadUrlUndoSnapshot();
}

export async function saveUrls(urls) {
  await saveUrlList(urls);
}

export async function loadUrlRecords() {
  return loadUrlRecordsRepo();
}

export async function setUrlStar(url, starred) {
  return setUrlRecordStar(url, starred);
}

export async function setUrlTags(url, tags) {
  return setUrlRecordTags(url, tags);
}

export async function setUrlNote(url, note) {
  return setUrlRecordNote(url, note);
}

export async function removeUrlMetadata(url) {
  return removeUrlRecordMetadata(url);
}

export async function getCurrentTabUrl() {
  const tabs = await chromeCall((done) =>
    chrome.tabs.query({ active: true, currentWindow: true }, done)
  );
  return tabs[0]?.url || '';
}

export async function getAllTabUrls() {
  const tabs = await chromeCall((done) => chrome.tabs.query({ currentWindow: true }, done));
  return tabs.map((t) => t.url || '').filter(Boolean);
}

export function openUrl(url, reportError, showToast) {
  if (!isCollectibleUrl(url)) {
    showToast('Cannot open this URL');
    return;
  }
  chrome.tabs.create({ url }, () => {
    if (chrome.runtime.lastError) {
      reportError(new Error(chrome.runtime.lastError.message), 'Could not open URL');
    }
  });
}

export async function exportUrlsAsTxt(urls, filename = 'urls.txt') {
  const blob = new Blob([urls.join('\n')], { type: 'text/plain' });
  await anchorDownloadBlob({ blob, filename });
}

export async function exportUrlsAsCsv(urls, filename = 'urls.csv') {
  const csv = `url\n${urls.map(escapeCsvCell).join('\n')}`;
  const blob = new Blob([csv], { type: 'text/csv' });
  await anchorDownloadBlob({ blob, filename });
}

export async function copyUrlsToClipboard(urls) {
  await navigator.clipboard.writeText(urls.join('\n'));
}

export async function refreshHistoryEntries() {
  return loadUrlHistoryEntries();
}

/**
 * @param {UrlMutationContext} param0
 */
export function createUrlMutations({ onHistoryChange, isHistoryViewOpen }) {
  /** @type {Promise<any>} */
  let urlMutationQueue = Promise.resolve();

  async function refreshHistoryViewIfOpen() {
    if (!isHistoryViewOpen()) return;
    const entries = await refreshHistoryEntries();
    onHistoryChange(entries);
  }

  /**
   * @param {(current: string[]) => Promise<string[] | void> | string[] | void} mutator
   * @param {UrlHistoryActionType} [actionType]
   * @param {Record<string, unknown>} [meta]
   */
  function mutateUrls(
    mutator,
    actionType = /** @type {UrlHistoryActionType} */ (URL_HISTORY_ACTION.UNKNOWN),
    meta = {}
  ) {
    const run = urlMutationQueue.then(async () => {
      const urls = await loadUrls();
      const nextUrls = normalizeUrlArray(await mutator([...urls]));
      if (!arraysEqual(urls, nextUrls)) {
        await saveUrls(nextUrls);
        await appendUrlHistoryEntry({ actionType, urls: nextUrls, meta });
        await refreshHistoryViewIfOpen();
        return nextUrls;
      }
      return urls;
    });
    urlMutationQueue = run.catch(() => {});
    return run;
  }

  function clearUrlsWithUndoSnapshot() {
    const run = urlMutationQueue.then(async () => {
      const current = await loadUrls();

      if (current.length > 0) {
        await appendUrlHistoryEntry({
          actionType: URL_HISTORY_ACTION.CLEAR_BEFORE,
          urls: current,
          meta: { source: 'popup', operation: 'clear_all' },
        });
      }

      await writeUrlsAndUndo({ urls: [], undoSnapshotUrls: current });
      return { urls: [], snapshotCount: current.length };
    });
    urlMutationQueue = run.catch(() => {});
    return run;
  }

  function restoreUrlsFromSnapshot() {
    const run = urlMutationQueue.then(async () => {
      const snapshot = await loadUrlUndoSnapshot();
      const restoredUrls = snapshot?.urls || [];

      if (restoredUrls.length === 0) {
        return { restored: false, urls: await loadUrls() };
      }

      await saveUrlList(restoredUrls);
      await clearUrlUndoSnapshot();
      await appendUrlHistoryEntry({
        actionType: URL_HISTORY_ACTION.RESTORE_LAST_CLEAR,
        urls: restoredUrls,
        meta: { source: 'popup', operation: 'undo_clear' },
      });
      await refreshHistoryViewIfOpen();
      return { restored: true, urls: restoredUrls, restoredCount: restoredUrls.length };
    });
    urlMutationQueue = run.catch(() => {});
    return run;
  }

  function restoreUrlsFromHistory(historyId) {
    const run = urlMutationQueue.then(async () => {
      const entries = await refreshHistoryEntries();
      const target = entries.find((entry) => entry.id === historyId);
      if (!target) return { restored: false, urls: await loadUrls() };
      const urls = normalizeUrlArray(target.urls);
      if (urls.length === 0) return { restored: false, urls: await loadUrls() };

      await saveUrls(urls);
      await appendUrlHistoryEntry({
        actionType: URL_HISTORY_ACTION.RESTORE_HISTORY,
        urls,
        meta: { source: 'popup', fromHistoryId: historyId },
      });
      await refreshHistoryViewIfOpen();
      return { restored: true, urls, restoredCount: urls.length };
    });
    urlMutationQueue = run.catch(() => {});
    return run;
  }

  return {
    mutateUrls,
    clearUrlsWithUndoSnapshot,
    restoreUrlsFromSnapshot,
    restoreUrlsFromHistory,
  };
}
