// offscreen.js — runs in a chrome.offscreen document.
// Has full DOM/Canvas access. Reads tiles from IndexedDB (written by the
// service worker), stitches them into one image (or multiple chunk images
// when oversized), saves the result,
// then cleans up the temporary tile data.

import { MSG } from '../shared/messages.js';
import { MAX_CANVAS_SIDE } from '../shared/constants.js';
import { getTiles, deleteTiles, saveScreenshot } from '../shared/db.js';

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== MSG.OS_STITCH) return;

  const { id, totalW, totalH, sourceUrl, title } = msg.payload;

  stitch(id, totalW, totalH, sourceUrl, title)
    .then((result) => sendResponse({ ok: true, ...result }))
    .catch((err) => sendResponse({ ok: false, error: err.message }));

  return true; // async
});

// ─── Stitching ────────────────────────────────────────────────────────────────

async function stitch(id, totalW, totalH, sourceUrl, title) {
  // Read tiles written to IDB by the service worker.
  // No large data crosses the message boundary — only tiny metadata did.
  const tiles = await getTiles(id);
  if (tiles.length === 0) {
    throw new Error('No tiles found in IDB for job ' + id);
  }

  const baseTitle = title || sourceUrl;
  const baseTimestamp = Date.now();

  try {
    // Fast path: single-image stitch within canvas limits
    if (totalW <= MAX_CANVAS_SIDE && totalH <= MAX_CANVAS_SIDE) {
      const rendered = await renderChunk(tiles, 0, 0, totalW, totalH);
      await saveScreenshot({
        id,
        url: sourceUrl,
        title: baseTitle,
        timestamp: baseTimestamp,
        blob: rendered.blob,
        thumbBlob: rendered.thumbBlob,
        width: totalW,
        height: totalH,
      });
      return { ids: [id], partCount: 1, split: false };
    }

    // Oversized fallback: stitch to a single scaled image within canvas limits.
    if (tiles.some((tile) => {
      const { width, height } = tileDimensions(tile);
      return width <= 0 || height <= 0;
    })) {
      await hydrateTileDimensions(tiles);
    }
    const chunks = buildChunks(totalW, totalH);
    const bucketedTiles = bucketTilesByChunk(tiles, chunks);
    const stitched = await renderScaledFromChunks({
      chunks,
      bucketedTiles,
      totalW,
      totalH,
    });
    await saveScreenshot({
      id,
      url: sourceUrl,
      title: `${baseTitle} (Auto-stitched)`,
      timestamp: baseTimestamp,
      blob: stitched.blob,
      thumbBlob: stitched.thumbBlob,
      width: stitched.width,
      height: stitched.height,
      originalWidth: totalW,
      originalHeight: totalH,
      autoScaledFromOversized: true,
    });
    return { ids: [id], partCount: 1, split: false };
  } finally {
    await deleteTiles(id);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildChunks(totalW, totalH) {
  const cols = Math.ceil(totalW / MAX_CANVAS_SIDE);
  const rows = Math.ceil(totalH / MAX_CANVAS_SIDE);
  const out = [];
  let part = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      part++;
      const x = col * MAX_CANVAS_SIDE;
      const y = row * MAX_CANVAS_SIDE;
      out.push({
        part,
        row,
        col,
        x,
        y,
        w: Math.min(MAX_CANVAS_SIDE, totalW - x),
        h: Math.min(MAX_CANVAS_SIDE, totalH - y),
      });
    }
  }
  return out;
}

function bucketTilesByChunk(tiles, chunks) {
  const buckets = chunks.map(() => []);
  if (chunks.length === 0) return buckets;

  const cols = Math.max(1, Math.round(chunks[chunks.length - 1].col + 1));
  const rows = Math.max(1, Math.round(chunks[chunks.length - 1].row + 1));

  for (const tile of tiles) {
    const { width, height } = tileDimensions(tile);
    const startCol = clampInt(Math.floor(tile.x / MAX_CANVAS_SIDE), 0, cols - 1);
    const endCol = clampInt(Math.floor((tile.x + width - 1) / MAX_CANVAS_SIDE), 0, cols - 1);
    const startRow = clampInt(Math.floor(tile.y / MAX_CANVAS_SIDE), 0, rows - 1);
    const endRow = clampInt(Math.floor((tile.y + height - 1) / MAX_CANVAS_SIDE), 0, rows - 1);

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const idx = row * cols + col;
        if (idx >= 0 && idx < buckets.length) {
          buckets[idx].push(tile);
        }
      }
    }
  }

  return buckets;
}

async function renderChunk(
  tiles,
  chunkX,
  chunkY,
  chunkW,
  chunkH,
  includeThumb = true,
  decodedCache = null
) {
  const canvas = document.createElement('canvas');
  canvas.width = chunkW;
  canvas.height = chunkH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to create 2D canvas context');

  for (const tile of tiles) {
    const decoded = decodedCache
      ? await getCachedDecodedTile(tile, decodedCache)
      : await decodeTile(tile.blob);
    const fullW = decoded.width || decoded.naturalWidth;
    const fullH = decoded.height || decoded.naturalHeight;
    const srcX = tile.sx ?? 0;
    const srcY = tile.sy ?? 0;
    const srcW = Math.max(1, Math.min(tile.sw ?? fullW, fullW - srcX));
    const srcH = Math.max(1, Math.min(tile.sh ?? fullH, fullH - srcY));
    const tileW = srcW;
    const tileH = srcH;

    const overlap = getRectOverlap(
      tile.x,
      tile.y,
      tileW,
      tileH,
      chunkX,
      chunkY,
      chunkW,
      chunkH
    );

    if (overlap) {
      const sx = srcX + (overlap.x - tile.x);
      const sy = srcY + (overlap.y - tile.y);
      const dx = overlap.x - chunkX;
      const dy = overlap.y - chunkY;
      ctx.drawImage(decoded, sx, sy, overlap.w, overlap.h, dx, dy, overlap.w, overlap.h);
    }

    if (!decodedCache && typeof decoded.close === 'function') {
      decoded.close();
    }
  }

  const blob = await canvasToBlob(canvas, 'image/png');
  const thumbBlob = includeThumb ? await createThumbBlob(canvas) : null;
  return { blob, thumbBlob };
}

async function renderScaledFromChunks({ chunks, bucketedTiles, totalW, totalH }) {
  const scale = Math.min(1, MAX_CANVAS_SIDE / Math.max(totalW, totalH));
  const outW = Math.max(1, Math.round(totalW * scale));
  const outH = Math.max(1, Math.round(totalH * scale));
  const outCanvas = document.createElement('canvas');
  outCanvas.width = outW;
  outCanvas.height = outH;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) throw new Error('Failed to create oversized stitch canvas');

  const decodedCache = new Map();
  try {
    for (const chunk of chunks) {
      const rendered = await renderChunk(
        bucketedTiles[chunk.part - 1],
        chunk.x,
        chunk.y,
        chunk.w,
        chunk.h,
        false,
        decodedCache
      );
      const decoded = await decodeTile(rendered.blob);
      const dx = Math.round(chunk.x * scale);
      const dy = Math.round(chunk.y * scale);
      const dw = Math.max(1, Math.round(chunk.w * scale));
      const dh = Math.max(1, Math.round(chunk.h * scale));
      outCtx.drawImage(decoded, 0, 0, decoded.width || decoded.naturalWidth, decoded.height || decoded.naturalHeight, dx, dy, dw, dh);
      if (typeof decoded.close === 'function') decoded.close();
    }
  } finally {
    releaseDecodedTileCache(decodedCache);
  }

  return {
    blob: await canvasToBlob(outCanvas, 'image/png'),
    thumbBlob: await createThumbBlob(outCanvas),
    width: outW,
    height: outH,
  };
}

async function getCachedDecodedTile(tile, decodedCache) {
  const key = tile.id || `${tile.jobId || ''}:${tile.index || ''}`;
  if (!decodedCache.has(key)) {
    decodedCache.set(key, await decodeTile(tile.blob));
  }
  return decodedCache.get(key);
}

function releaseDecodedTileCache(decodedCache) {
  for (const decoded of decodedCache.values()) {
    if (typeof decoded?.close === 'function') decoded.close();
  }
  decodedCache.clear();
}

function tileDimensions(tile) {
  if (tile.sw && tile.sh) return { width: tile.sw, height: tile.sh };
  if (tile.w && tile.h) return { width: tile.w, height: tile.h };
  if (tile._w && tile._h) return { width: tile._w, height: tile._h };
  return { width: 0, height: 0 };
}

function clampInt(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

async function hydrateTileDimensions(tiles) {
  for (const tile of tiles) {
    if (tile.sw && tile.sh) continue;
    if (tile._w && tile._h) continue;
    const decoded = await decodeTile(tile.blob);
    tile._w = Math.max(1, decoded.width || decoded.naturalWidth || 0);
    tile._h = Math.max(1, decoded.height || decoded.naturalHeight || 0);
    if (typeof decoded.close === 'function') decoded.close();
  }
}

function getRectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  const x1 = Math.max(ax, bx);
  const y1 = Math.max(ay, by);
  const x2 = Math.min(ax + aw, bx + bw);
  const y2 = Math.min(ay + ah, by + bh);

  if (x2 <= x1 || y2 <= y1) return null;
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

async function decodeTile(blob) {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(blob);
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    return await loadImage(objectUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode tile image'));
    img.src = src;
  });
}

async function createThumbBlob(sourceCanvas) {
  const maxW = 720;
  const maxH = 540;
  const scale = Math.min(1, maxW / sourceCanvas.width, maxH / sourceCanvas.height);
  const outW = Math.max(1, Math.round(sourceCanvas.width * scale));
  const outH = Math.max(1, Math.round(sourceCanvas.height * scale));
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = outW;
  thumbCanvas.height = outH;
  const tctx = thumbCanvas.getContext('2d');
  if (!tctx) return null;
  tctx.drawImage(sourceCanvas, 0, 0, outW, outH);
  return canvasToBlob(thumbCanvas, 'image/jpeg', 0.84);
}

function canvasToBlob(canvas, type = 'image/png', quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('canvas.toBlob returned null'));
      },
      type,
      quality
    );
  });
}
