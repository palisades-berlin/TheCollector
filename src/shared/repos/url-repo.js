import {
  normalizeUrlArray,
  loadUrlHistory,
  saveUrlHistory,
  appendUrlHistorySnapshot,
} from '../url-history.js';

const URLS_KEY = 'urls';
const URL_UNDO_KEY = 'urlsUndoSnapshot';

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

export async function loadUrlList() {
  const result = await chromeCall((done) => chrome.storage.local.get({ [URLS_KEY]: [] }, done));
  return normalizeUrlArray(result[URLS_KEY]);
}

export async function saveUrlList(urls) {
  const normalized = normalizeUrlArray(urls);
  await chromeCall((done) => chrome.storage.local.set({ [URLS_KEY]: normalized }, done));
  return normalized;
}

export async function loadUrlUndoSnapshot() {
  const result = await chromeCall((done) =>
    chrome.storage.local.get({ [URL_UNDO_KEY]: null }, done)
  );
  const snapshot = result[URL_UNDO_KEY];
  if (!snapshot || !Array.isArray(snapshot.urls)) return null;
  const urls = normalizeUrlArray(snapshot.urls);
  if (urls.length === 0) return null;
  return { urls };
}

export async function saveUrlUndoSnapshot(urls) {
  const normalized = normalizeUrlArray(urls);
  if (normalized.length === 0) {
    await chromeCall((done) =>
      chrome.storage.local.set({ [URL_UNDO_KEY]: null }, done)
    );
    return null;
  }
  const snapshot = { urls: normalized, savedAt: Date.now() };
  await chromeCall((done) =>
    chrome.storage.local.set({ [URL_UNDO_KEY]: snapshot }, done)
  );
  return snapshot;
}

export async function clearUrlUndoSnapshot() {
  await chromeCall((done) => chrome.storage.local.set({ [URL_UNDO_KEY]: null }, done));
}

export async function writeUrlsAndUndo({ urls, undoSnapshotUrls = null }) {
  const payload = { [URLS_KEY]: normalizeUrlArray(urls) };
  if (undoSnapshotUrls && Array.isArray(undoSnapshotUrls) && undoSnapshotUrls.length > 0) {
    payload[URL_UNDO_KEY] = {
      urls: normalizeUrlArray(undoSnapshotUrls),
      savedAt: Date.now(),
    };
  } else {
    payload[URL_UNDO_KEY] = null;
  }
  await chromeCall((done) => chrome.storage.local.set(payload, done));
}

export async function loadUrlHistoryEntries() {
  return loadUrlHistory();
}

export async function saveUrlHistoryEntries(entries) {
  return saveUrlHistory(entries);
}

export async function appendUrlHistoryEntry(payload) {
  return appendUrlHistorySnapshot(payload);
}
