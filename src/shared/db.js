import { DB_NAME, DB_VERSION, STORE_NAME, META_STORE, TILES_STORE } from './constants.js';

let _db = null;

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
      // Run again for v4 to repair profiles that reached v3 without META_STORE.
      if (oldVersion < 4) {
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
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME, META_STORE], 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.objectStore(META_STORE).put(toMetaRecord(record));
    tx.oncomplete = () => resolve(record.id);
    tx.onerror = () => reject(tx.error);
  });
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
  return new Promise((resolve, reject) => {
    const req = db.transaction(META_STORE).objectStore(META_STORE).getAll();
    req.onsuccess = () => resolve(req.result.sort((a, b) => b.timestamp - a.timestamp));
    req.onerror = () => reject(req.error);
  });
}

export async function deleteScreenshots(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME, META_STORE], 'readwrite');
    const screenshotStore = tx.objectStore(STORE_NAME);
    const metaStore = tx.objectStore(META_STORE);
    for (const id of ids) {
      screenshotStore.delete(id);
      metaStore.delete(id);
    }
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
