import {
  normalizeUrlArray,
  loadUrlHistory,
  saveUrlHistory,
  appendUrlHistorySnapshot,
} from '../url-history.js';
import { normalizeUrlForCompare } from '../url-utils.js';

const URLS_KEY = 'urls';
const URL_UNDO_KEY = 'urlsUndoSnapshot';
const URL_META_DB_NAME = 'the-collector-url-meta';
const URL_META_DB_VERSION = 1;
const URL_META_STORE = 'url_meta';
const URL_META_FALLBACK_KEY = 'urlMetaFallbackV1';
const URL_NOTE_MAX = 140;
const URL_TAG_LIMIT = 10;

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

function canUseIndexedDb() {
  return typeof indexedDB !== 'undefined' && typeof indexedDB.open === 'function';
}

let _urlMetaDb = null;

function openUrlMetaDb() {
  if (_urlMetaDb) return Promise.resolve(_urlMetaDb);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(URL_META_DB_NAME, URL_META_DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(URL_META_STORE)) {
        const store = db.createObjectStore(URL_META_STORE, { keyPath: 'normalizedUrl' });
        store.createIndex('starred', 'starred');
        store.createIndex('createdAt', 'createdAt');
      }
    };
    req.onsuccess = () => {
      _urlMetaDb = req.result;
      resolve(_urlMetaDb);
    };
    req.onerror = () => reject(req.error);
  });
}

function normalizeUrlTags(input) {
  if (!Array.isArray(input)) return [];
  const out = [];
  for (const value of input) {
    if (typeof value !== 'string') continue;
    const normalized = value.trim().slice(0, 24);
    if (!normalized) continue;
    if (out.includes(normalized)) continue;
    out.push(normalized);
    if (out.length >= URL_TAG_LIMIT) break;
  }
  return out;
}

function normalizeUrlNote(input) {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, URL_NOTE_MAX);
}

function normalizeMetaTimestamp(value, fallback) {
  const ts = Number(value);
  return Number.isFinite(ts) && ts > 0 ? ts : fallback;
}

function normalizeUrlMetaRecord(raw, fallbackUrl = '', now = Date.now()) {
  const normalizedUrl = normalizeUrlForCompare(raw?.normalizedUrl || fallbackUrl || '');
  const createdAt = normalizeMetaTimestamp(raw?.createdAt, now);
  return {
    normalizedUrl,
    url: typeof raw?.url === 'string' && raw.url ? raw.url : fallbackUrl,
    createdAt,
    updatedAt: normalizeMetaTimestamp(raw?.updatedAt, createdAt),
    starred: Boolean(raw?.starred),
    tags: normalizeUrlTags(raw?.tags),
    note: normalizeUrlNote(raw?.note),
  };
}

function buildDefaultUrlMeta(url, now = Date.now()) {
  return normalizeUrlMetaRecord(
    {
      normalizedUrl: normalizeUrlForCompare(url),
      url,
      createdAt: now,
      updatedAt: now,
      starred: false,
      tags: [],
      note: '',
    },
    url,
    now
  );
}

async function loadUrlMetaFallbackMap() {
  const result = await chromeCall((done) =>
    chrome.storage.local.get({ [URL_META_FALLBACK_KEY]: {} }, done)
  );
  const raw = result[URL_META_FALLBACK_KEY];
  return raw && typeof raw === 'object' ? raw : {};
}

async function saveUrlMetaFallbackMap(map) {
  await chromeCall((done) => chrome.storage.local.set({ [URL_META_FALLBACK_KEY]: map }, done));
}

async function readAllUrlMetaRecords() {
  if (!canUseIndexedDb()) {
    const map = await loadUrlMetaFallbackMap();
    return Object.values(map).map((item) => normalizeUrlMetaRecord(item));
  }

  const db = await openUrlMetaDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(URL_META_STORE).objectStore(URL_META_STORE).getAll();
    req.onsuccess = () => {
      const rows = Array.isArray(req.result) ? req.result : [];
      resolve(rows.map((item) => normalizeUrlMetaRecord(item)));
    };
    req.onerror = () => reject(req.error);
  });
}

async function writeUrlMetaRecord(record) {
  const normalized = normalizeUrlMetaRecord(record, record?.url || '');
  if (!normalized.normalizedUrl) return null;

  if (!canUseIndexedDb()) {
    const map = await loadUrlMetaFallbackMap();
    map[normalized.normalizedUrl] = normalized;
    await saveUrlMetaFallbackMap(map);
    return normalized;
  }

  const db = await openUrlMetaDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(URL_META_STORE, 'readwrite');
    tx.objectStore(URL_META_STORE).put(normalized);
    tx.oncomplete = () => resolve(normalized);
    tx.onerror = () => reject(tx.error);
  });
}

async function deleteUrlMetaRecord(normalizedUrl) {
  if (!normalizedUrl) return;
  if (!canUseIndexedDb()) {
    const map = await loadUrlMetaFallbackMap();
    delete map[normalizedUrl];
    await saveUrlMetaFallbackMap(map);
    return;
  }

  const db = await openUrlMetaDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(URL_META_STORE, 'readwrite');
    tx.objectStore(URL_META_STORE).delete(normalizedUrl);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function ensureUrlMetadata(urls) {
  const normalizedUrls = normalizeUrlArray(urls);
  const allMeta = await readAllUrlMetaRecords();
  const byNormalized = new Map(
    allMeta.filter((item) => item.normalizedUrl).map((item) => [item.normalizedUrl, item])
  );
  const now = Date.now();

  const writes = [];
  for (const url of normalizedUrls) {
    const normalizedUrl = normalizeUrlForCompare(url);
    if (!normalizedUrl) continue;
    const existing = byNormalized.get(normalizedUrl);
    if (!existing) {
      const created = buildDefaultUrlMeta(url, now);
      byNormalized.set(normalizedUrl, created);
      writes.push(created);
      continue;
    }
    if (existing.url !== url) {
      const updated = normalizeUrlMetaRecord({ ...existing, url, updatedAt: now }, url, now);
      byNormalized.set(normalizedUrl, updated);
      writes.push(updated);
    }
  }

  for (const record of writes) {
    await writeUrlMetaRecord(record);
  }

  return byNormalized;
}

export async function loadUrlList() {
  const result = await chromeCall((done) => chrome.storage.local.get({ [URLS_KEY]: [] }, done));
  return normalizeUrlArray(result[URLS_KEY]);
}

export async function saveUrlList(urls) {
  const normalized = normalizeUrlArray(urls);
  await chromeCall((done) => chrome.storage.local.set({ [URLS_KEY]: normalized }, done));
  await ensureUrlMetadata(normalized);
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
    await chromeCall((done) => chrome.storage.local.set({ [URL_UNDO_KEY]: null }, done));
    return null;
  }
  const snapshot = { urls: normalized, savedAt: Date.now() };
  await chromeCall((done) => chrome.storage.local.set({ [URL_UNDO_KEY]: snapshot }, done));
  return snapshot;
}

export async function clearUrlUndoSnapshot() {
  await chromeCall((done) => chrome.storage.local.set({ [URL_UNDO_KEY]: null }, done));
}

export async function writeUrlsAndUndo({ urls, undoSnapshotUrls = null }) {
  const normalizedUrls = normalizeUrlArray(urls);
  const payload = { [URLS_KEY]: normalizedUrls };
  if (undoSnapshotUrls && Array.isArray(undoSnapshotUrls) && undoSnapshotUrls.length > 0) {
    payload[URL_UNDO_KEY] = {
      urls: normalizeUrlArray(undoSnapshotUrls),
      savedAt: Date.now(),
    };
  } else {
    payload[URL_UNDO_KEY] = null;
  }
  await chromeCall((done) => chrome.storage.local.set(payload, done));
  await ensureUrlMetadata(normalizedUrls);
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

export async function loadUrlRecords() {
  const urls = await loadUrlList();
  const metadata = await ensureUrlMetadata(urls);
  return urls.map((url) => {
    const normalizedUrl = normalizeUrlForCompare(url);
    const meta = metadata.get(normalizedUrl) || buildDefaultUrlMeta(url);
    return {
      url,
      normalizedUrl,
      createdAt: meta.createdAt,
      updatedAt: meta.updatedAt,
      starred: Boolean(meta.starred),
      tags: normalizeUrlTags(meta.tags),
      note: normalizeUrlNote(meta.note),
    };
  });
}

export async function setUrlRecordStar(url, starred) {
  if (typeof url !== 'string' || !url) return null;
  const normalizedUrl = normalizeUrlForCompare(url);
  if (!normalizedUrl) return null;
  const records = await ensureUrlMetadata([url]);
  const existing = records.get(normalizedUrl) || buildDefaultUrlMeta(url);
  const next = normalizeUrlMetaRecord(
    {
      ...existing,
      url,
      starred: Boolean(starred),
      updatedAt: Date.now(),
    },
    url
  );
  await writeUrlMetaRecord(next);
  return next;
}

export async function setUrlRecordTags(url, tags) {
  if (typeof url !== 'string' || !url) return null;
  const normalizedUrl = normalizeUrlForCompare(url);
  if (!normalizedUrl) return null;
  const records = await ensureUrlMetadata([url]);
  const existing = records.get(normalizedUrl) || buildDefaultUrlMeta(url);
  const next = normalizeUrlMetaRecord(
    {
      ...existing,
      url,
      tags: normalizeUrlTags(tags),
      updatedAt: Date.now(),
    },
    url
  );
  await writeUrlMetaRecord(next);
  return next;
}

export async function setUrlRecordNote(url, note) {
  if (typeof url !== 'string' || !url) return null;
  const normalizedUrl = normalizeUrlForCompare(url);
  if (!normalizedUrl) return null;
  const records = await ensureUrlMetadata([url]);
  const existing = records.get(normalizedUrl) || buildDefaultUrlMeta(url);
  const next = normalizeUrlMetaRecord(
    {
      ...existing,
      url,
      note: normalizeUrlNote(note),
      updatedAt: Date.now(),
    },
    url
  );
  await writeUrlMetaRecord(next);
  return next;
}

export async function removeUrlRecordMetadata(url) {
  if (typeof url !== 'string' || !url) return;
  const normalizedUrl = normalizeUrlForCompare(url);
  if (!normalizedUrl) return;
  await deleteUrlMetaRecord(normalizedUrl);
}
