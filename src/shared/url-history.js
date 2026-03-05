export const URL_HISTORY_KEY = 'urlHistorySnapshots';
export const URL_HISTORY_LIMIT = 100;

export const URL_HISTORY_ACTION = {
  ADD_CURRENT: 'add_current',
  ADD_ALL_TABS: 'add_all_tabs',
  REMOVE_ONE: 'remove_one',
  CLEAR_BEFORE: 'clear_before',
  RESTORE_LAST_CLEAR: 'restore_last_clear',
  RESTORE_HISTORY: 'restore_history',
  UNKNOWN: 'unknown',
};

export function normalizeUrlArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((u) => typeof u === 'string');
}

function buildId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeMeta(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out = {};
  for (const [key, raw] of Object.entries(value)) {
    if (typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean') {
      out[key] = raw;
    }
  }
  return out;
}

export function buildUrlHistoryEntry({
  actionType,
  urls,
  meta = {},
  createdAt = Date.now(),
  id = buildId(),
}) {
  const safeUrls = normalizeUrlArray(urls);
  return {
    id: typeof id === 'string' ? id : buildId(),
    createdAt: Number(createdAt) || Date.now(),
    actionType: typeof actionType === 'string' ? actionType : URL_HISTORY_ACTION.UNKNOWN,
    urls: safeUrls,
    count: safeUrls.length,
    meta: normalizeMeta(meta),
  };
}

export function normalizeUrlHistoryEntries(value, limit = URL_HISTORY_LIMIT) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) =>
      buildUrlHistoryEntry({
        id: entry?.id,
        createdAt: entry?.createdAt,
        actionType: entry?.actionType,
        urls: entry?.urls,
        meta: entry?.meta,
      })
    )
    .filter((entry) => entry.urls.length > 0)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, Number(limit) > 0 ? Number(limit) : URL_HISTORY_LIMIT);
}

export function urlsEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function storageGet(storageArea, defaults) {
  return new Promise((resolve, reject) => {
    storageArea.get(defaults, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(result);
    });
  });
}

function storageSet(storageArea, payload) {
  return new Promise((resolve, reject) => {
    storageArea.set(payload, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve();
    });
  });
}

export async function loadUrlHistory(storageArea = chrome.storage.local) {
  const state = await storageGet(storageArea, { [URL_HISTORY_KEY]: [] });
  return normalizeUrlHistoryEntries(state[URL_HISTORY_KEY]);
}

export async function saveUrlHistory(entries, storageArea = chrome.storage.local) {
  const normalized = normalizeUrlHistoryEntries(entries);
  await storageSet(storageArea, { [URL_HISTORY_KEY]: normalized });
  return normalized;
}

export async function appendUrlHistorySnapshot(
  { actionType, urls, meta = {}, skipIfSameAsLatest = true },
  storageArea = chrome.storage.local
) {
  const safeUrls = normalizeUrlArray(urls);
  if (safeUrls.length === 0) return null;

  const current = await loadUrlHistory(storageArea);
  const latest = current[0];
  if (skipIfSameAsLatest && latest && urlsEqual(latest.urls, safeUrls)) {
    return null;
  }

  const entry = buildUrlHistoryEntry({ actionType, urls: safeUrls, meta });
  await saveUrlHistory([entry, ...current], storageArea);
  return entry;
}
