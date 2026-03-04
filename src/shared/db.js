import { DB_NAME, DB_VERSION, STORE_NAME, TILES_STORE } from './constants.js';

let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp');
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
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
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
    req.onsuccess = () =>
      resolve(req.result.sort((a, b) => b.timestamp - a.timestamp));
    req.onerror = () => reject(req.error);
  });
}

export async function deleteScreenshot(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ─── Pending tiles (capture buffer) ──────────────────────────────────────────

export async function saveTile(jobId, index, x, y, blob) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TILES_STORE, 'readwrite');
    tx.objectStore(TILES_STORE).put({ id: `${jobId}:${index}`, jobId, index, x, y, blob });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getTiles(jobId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db
      .transaction(TILES_STORE)
      .objectStore(TILES_STORE)
      .index('jobId')
      .getAll(IDBKeyRange.only(jobId));
    req.onsuccess = () =>
      resolve(req.result.sort((a, b) => a.index - b.index));
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
