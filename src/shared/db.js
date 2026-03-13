import {
  DB_NAME,
  DB_VERSION,
  STORE_NAME,
  META_STORE,
  THUMBS_STORE,
  TILES_STORE,
  SCREENSHOT_ITEM_LIMIT,
} from './constants.js';
import { getSettings } from './settings.js';

let _db = null;
const STORAGE_EVENT_KEY = 'screenshotStorageEvent';

function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const target = /** @type {IDBOpenDBRequest} */ (e.target);
      const db = target.result;
      const oldVersion = e.oldVersion || 0;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp');
      }

      if (!db.objectStoreNames.contains(META_STORE)) {
        const meta = db.createObjectStore(META_STORE, { keyPath: 'id' });
        meta.createIndex('timestamp', 'timestamp');
      }

      // Backfill lightweight metadata entries for existing screenshots.
      // Run again for v6 to harden metadata migration in older installs.
      if (oldVersion < 6) {
        const tx = target.transaction;
        const screenshotStore = tx.objectStore(STORE_NAME);
        const metaStore = tx.objectStore(META_STORE);
        screenshotStore.openCursor().onsuccess = (ev) => {
          const cursor = /** @type {IDBRequest} */ (ev.target).result;
          if (!cursor) return;
          metaStore.put(toMetaRecord(cursor.value));
          cursor.continue();
        };
      }

      if (!db.objectStoreNames.contains(THUMBS_STORE)) {
        db.createObjectStore(THUMBS_STORE, { keyPath: 'id' });
      }

      // Temporary tile buffer: tiles are written here during capture,
      // read by the offscreen document for stitching, then deleted.
      if (!db.objectStoreNames.contains(TILES_STORE)) {
        const tiles = db.createObjectStore(TILES_STORE, { keyPath: 'id' });
        tiles.createIndex('jobId', 'jobId'); // for bulk read/delete by job
      }
    };

    req.onsuccess = () => {
      _db = req.result;
      resolve(_db);
    };
    req.onerror = () => reject(req.error);
  });
}

// ─── Screenshots ──────────────────────────────────────────────────────────────

export async function saveScreenshot(record) {
  const settings = await loadStoragePolicySettings();
  let purgedCount = 0;

  const currentUsage = await getScreenshotUsage();
  if (currentUsage.count >= SCREENSHOT_ITEM_LIMIT) {
    if (settings.autoPurgeEnabled !== true) {
      throw new Error(
        `Storage limit reached (${SCREENSHOT_ITEM_LIMIT}). Delete screenshots or enable Auto-purge in Settings.`
      );
    }
    purgedCount += await purgeOldestScreenshots(currentUsage.count - SCREENSHOT_ITEM_LIMIT + 1);
  }

  try {
    await putScreenshotRecord(record);
  } catch (err) {
    if (!isQuotaExceededError(err)) throw err;
    if (settings.autoPurgeEnabled !== true) {
      throw new Error(
        `Storage limit reached (${SCREENSHOT_ITEM_LIMIT}). Delete screenshots or enable Auto-purge in Settings.`,
        { cause: err }
      );
    }
    purgedCount += await purgeOldestScreenshots(1);
    await putScreenshotRecord(record);
  }

  if (purgedCount > 0) {
    await persistStorageEvent({
      type: 'auto_purge',
      purgedCount,
      limit: SCREENSHOT_ITEM_LIMIT,
      timestamp: Date.now(),
    });
  }
  return record.id;
}

export async function getScreenshot(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME).objectStore(STORE_NAME).get(id);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function listScreenshots() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME).objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result.sort((a, b) => b.timestamp - a.timestamp));
    req.onerror = () => reject(req.error);
  });
}

export async function listScreenshotMeta() {
  const db = await openDB();
  if (!db.objectStoreNames.contains(META_STORE)) {
    return listMetaViaScreenshotCursor(db);
  }
  try {
    return await new Promise((resolve, reject) => {
      const req = db.transaction(META_STORE).objectStore(META_STORE).getAll();
      req.onsuccess = () => resolve(req.result.sort((a, b) => b.timestamp - a.timestamp));
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    if (!isMissingMetaStoreError(err)) throw err;
    return listMetaViaScreenshotCursor(db);
  }
}

export async function deleteScreenshots(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME, META_STORE, THUMBS_STORE], 'readwrite');
    const screenshotStore = tx.objectStore(STORE_NAME);
    const metaStore = tx.objectStore(META_STORE);
    const thumbsStore = tx.objectStore(THUMBS_STORE);
    for (const id of ids) {
      screenshotStore.delete(id);
      metaStore.delete(id);
      thumbsStore.delete(id);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getScreenshotUsage() {
  const rows = await listScreenshotMeta();
  let bytes = 0;
  for (const row of rows) {
    bytes += Number(row?.byteSize || 0);
  }
  return { count: rows.length, bytes };
}

export async function getScreenshotThumb(id) {
  const db = await openDB();
  if (!db.objectStoreNames.contains(THUMBS_STORE)) return null;
  return new Promise((resolve, reject) => {
    const req = db.transaction(THUMBS_STORE).objectStore(THUMBS_STORE).get(id);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function saveScreenshotThumb(id, thumbBlob, timestamp = Date.now()) {
  if (!(thumbBlob instanceof Blob) || thumbBlob.size <= 0) return;
  const db = await openDB();
  if (!db.objectStoreNames.contains(THUMBS_STORE)) return;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(THUMBS_STORE, 'readwrite');
    tx.objectStore(THUMBS_STORE).put({
      id,
      thumbBlob,
      timestamp: Number(timestamp || Date.now()),
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ─── Pending tiles (capture buffer) ──────────────────────────────────────────

export async function saveTile(jobId, index, x, y, blob, crop = null, tileSize = null) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TILES_STORE, 'readwrite');
    const record = {
      id: `${jobId}:${index}`,
      jobId,
      index,
      x,
      y,
      blob,
      w: Number(tileSize?.w || 0) > 0 ? Number(tileSize.w) : 0,
      h: Number(tileSize?.h || 0) > 0 ? Number(tileSize.h) : 0,
    };
    if (crop) {
      record.sx = crop.sx;
      record.sy = crop.sy;
      record.sw = crop.sw;
      record.sh = crop.sh;
    }
    tx.objectStore(TILES_STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function toMetaRecord(record) {
  const captureReport = record.captureReport || {};
  return {
    id: record.id,
    url: record.url || '',
    title: record.title || '',
    timestamp: Number(record.timestamp || Date.now()),
    width: Number(record.width || 0),
    height: Number(record.height || 0),
    byteSize: Number(record.byteSize || 0) || Number(record.blob?.size || 0),
    splitBaseId: record.splitBaseId || '',
    splitPart: Number(record.splitPart || 0),
    splitCount: Number(record.splitCount || 0),
    splitX: Number(record.splitX || 0),
    splitY: Number(record.splitY || 0),
    splitTotalW: Number(record.splitTotalW || 0),
    splitTotalH: Number(record.splitTotalH || 0),
    stitchedFrom: record.stitchedFrom || '',
    hasThumbBlob: Boolean(record.thumbBlob),
    blobType: record.blobType || record.blob?.type || 'image/png',
    captureDurationMs: Number(captureReport.durationMs || record.captureDurationMs || 0),
    captureTotalTiles: Number(captureReport.totalTiles || record.captureTotalTiles || 0),
    captureCapturedTiles: Number(captureReport.capturedTiles || record.captureCapturedTiles || 0),
    captureRetries: Number(captureReport.retries || record.captureRetries || 0),
    captureQuotaBackoffs: Number(captureReport.quotaBackoffs || record.captureQuotaBackoffs || 0),
    captureFallbackUsed: captureReport.fallbackUsed || record.captureFallbackUsed || 'none',
    captureMode: captureReport.captureMode || record.captureMode || 'page',
    captureProfileId: captureReport.profileId || record.captureProfileId || '',
    captureError: captureReport.error || record.captureError || '',
  };
}

export async function getTiles(jobId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db
      .transaction(TILES_STORE)
      .objectStore(TILES_STORE)
      .index('jobId')
      .getAll(IDBKeyRange.only(jobId));
    req.onsuccess = () => resolve(req.result.sort((a, b) => a.index - b.index));
    req.onerror = () => reject(req.error);
  });
}

export async function deleteTiles(jobId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TILES_STORE, 'readwrite');
    const store = tx.objectStore(TILES_STORE);
    const req = store.index('jobId').openCursor(IDBKeyRange.only(jobId));
    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadStoragePolicySettings() {
  try {
    return await getSettings();
  } catch {
    return { autoPurgeEnabled: true };
  }
}

async function putScreenshotRecord(record) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME, META_STORE, THUMBS_STORE], 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.objectStore(META_STORE).put(toMetaRecord(record));
    if (record?.thumbBlob instanceof Blob && record.thumbBlob.size > 0) {
      tx.objectStore(THUMBS_STORE).put({
        id: record.id,
        thumbBlob: record.thumbBlob,
        timestamp: Number(record.timestamp || Date.now()),
      });
    }
    tx.oncomplete = () => resolve(record.id);
    tx.onerror = () => reject(tx.error);
  });
}

async function purgeOldestScreenshots(neededCount) {
  const toDelete = Math.max(0, Number(neededCount || 0));
  if (toDelete === 0) return 0;
  const rows = await listScreenshotMeta();
  if (rows.length === 0) return 0;
  const ids = rows
    .slice()
    .sort((a, b) => Number(a?.timestamp || 0) - Number(b?.timestamp || 0))
    .slice(0, toDelete)
    .map((row) => row?.id)
    .filter(Boolean);
  if (ids.length === 0) return 0;
  await deleteScreenshots(ids);
  return ids.length;
}

function listMetaViaScreenshotCursor(db) {
  return new Promise((resolve, reject) => {
    const out = [];
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).openCursor();
    req.onsuccess = (event) => {
      const cursor = event?.target?.result;
      if (!cursor) return;
      out.push(toMetaRecord(cursor.value));
      cursor.continue();
    };
    tx.oncomplete = () =>
      resolve(out.sort((a, b) => Number(b?.timestamp || 0) - Number(a?.timestamp || 0)));
    tx.onerror = () => reject(tx.error);
  });
}

function isMissingMetaStoreError(err) {
  const message = String(err?.message || err || '');
  return message.includes('object stores was not found') || message.includes('not found');
}

function isQuotaExceededError(err) {
  const message = String(err?.message || err || '');
  return (
    err?.name === 'QuotaExceededError' ||
    message.includes('QuotaExceededError') ||
    message.toLowerCase().includes('quota')
  );
}

async function persistStorageEvent(event) {
  try {
    await chrome.storage.local.set({
      [STORAGE_EVENT_KEY]: {
        id: `${event.type}:${event.timestamp}:${event.purgedCount || 0}`,
        ...event,
      },
    });
  } catch {
    // Non-fatal. Storage notices remain best-effort.
  }
}
