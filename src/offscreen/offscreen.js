// offscreen.js — runs in a chrome.offscreen document.
// Has full DOM/Canvas access. Reads tiles from IndexedDB (written by the
// service worker), stitches them into a single image, saves the result,
// then cleans up the temporary tile data.

import { MSG } from '../shared/messages.js';
import { MAX_CANVAS_SIDE } from '../shared/constants.js';
import { getTiles, deleteTiles, saveScreenshot } from '../shared/db.js';

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== MSG.OS_STITCH) return;

  const { id, totalW, totalH, sourceUrl, title } = msg.payload;

  stitch(id, totalW, totalH, sourceUrl, title)
    .then(() => sendResponse({ ok: true }))
    .catch((err) => sendResponse({ ok: false, error: err.message }));

  return true; // async
});

// ─── Stitching ────────────────────────────────────────────────────────────────

async function stitch(id, totalW, totalH, sourceUrl, title) {
  if (totalW > MAX_CANVAS_SIDE || totalH > MAX_CANVAS_SIDE) {
    throw new Error(
      `Page too large (${totalW}×${totalH}px). Max canvas side is ${MAX_CANVAS_SIDE}px. ` +
        'Multi-image fallback coming in a future update.'
    );
  }

  // Read tiles written to IDB by the service worker.
  // No large data crosses the message boundary — only tiny metadata did.
  const tiles = await getTiles(id);
  if (tiles.length === 0) {
    throw new Error('No tiles found in IDB for job ' + id);
  }

  const canvas = document.createElement('canvas');
  canvas.width = totalW;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d');

  for (const tile of tiles) {
    const objectUrl = URL.createObjectURL(tile.blob);
    const img = await loadImage(objectUrl);
    ctx.drawImage(img, tile.x, tile.y);
    URL.revokeObjectURL(objectUrl);
  }

  const blob = await canvasToBlob(canvas);

  // Persist the final screenshot, then clean up the temporary tile buffer
  await saveScreenshot({
    id,
    url: sourceUrl,
    title: title || sourceUrl,
    timestamp: Date.now(),
    blob,
    width: totalW,
    height: totalH,
  });

  await deleteTiles(id);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode tile image'));
    img.src = src;
  });
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('canvas.toBlob returned null'));
      },
      'image/png'
    );
  });
}
