import { MSG } from '../shared/messages.js';
import { SCROLL_SETTLE_MS } from '../shared/constants.js';
import { saveTile } from '../shared/db.js';

// ─── Offscreen document management ───────────────────────────────────────────

let offscreenReady = false;

async function ensureOffscreen() {
  if (offscreenReady) return;
  try {
    const contexts = await chrome.offscreen.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
    });
    if (contexts.length > 0) {
      offscreenReady = true;
      return;
    }
  } catch (_) {}

  await chrome.offscreen.createDocument({
    url: chrome.runtime.getURL('src/offscreen/offscreen.html'),
    reasons: ['BLOBS'],
    justification: 'Stitch captured screenshot tiles into a full-page image',
  });
  offscreenReady = true;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sendToTab(tabId, type, payload = {}) {
  return chrome.tabs.sendMessage(tabId, { type, payload });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function broadcast(type, payload) {
  chrome.runtime.sendMessage({ type, payload }).catch(() => {
    // Popup may be closed — that's fine
  });
}

// ─── Core capture logic ───────────────────────────────────────────────────────

async function captureTab(tabId) {
  // Inject content script (guard in agent prevents double-injection issues)
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['src/content/capture-agent.js'],
  });
  await sleep(150);

  // Get full-page dimensions and viewport size
  const metrics = await sendToTab(tabId, MSG.CS_GET_METRICS);
  const { scrollW, scrollH, viewW, viewH, dpr } = metrics;

  const cols = Math.ceil(scrollW / viewW);
  const rows = Math.ceil(scrollH / viewH);
  const totalTiles = cols * rows;

  broadcast(MSG.SW_PROGRESS, { percent: 5, tabId });

  // Suppress fixed/sticky elements to avoid repeated headers in capture
  await sendToTab(tabId, MSG.CS_PREPARE);

  const tab = await chrome.tabs.get(tabId);
  // Use a single UUID as both the screenshot ID and the tile job ID
  const id = crypto.randomUUID();
  let done = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const scrollX = col * viewW;
      const scrollY = row * viewH;

      // Scroll and wait for page to settle (content script does the timing)
      await sendToTab(tabId, MSG.CS_SCROLL_TO, { x: scrollX, y: scrollY });
      // Small extra buffer for compositor to flush
      await sleep(50);

      const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
        format: 'png',
      });

      // Convert dataURL → Blob and persist to IDB.
      // This avoids sending large binary data through chrome.runtime.sendMessage
      // (which has a hard 64 MiB limit). The offscreen document reads tiles
      // directly from IDB, so only tiny metadata crosses the message boundary.
      const blob = await fetch(dataUrl).then((r) => r.blob());
      const tileIndex = row * cols + col;
      await saveTile(id, tileIndex, Math.round(scrollX * dpr), Math.round(scrollY * dpr), blob);

      done++;
      const percent = 5 + Math.round((done / totalTiles) * 80);
      broadcast(MSG.SW_PROGRESS, { percent, tabId });
    }
  }

  // Restore page state (fixed elements, scroll position)
  await sendToTab(tabId, MSG.CS_RESTORE);
  broadcast(MSG.SW_PROGRESS, { percent: 88, tabId });

  // Tell the offscreen document to stitch — only metadata in the message
  await ensureOffscreen();

  const stitchResult = await chrome.runtime.sendMessage({
    type: MSG.OS_STITCH,
    payload: {
      id,          // also used as jobId for tile lookup
      totalW: Math.round(scrollW * dpr),
      totalH: Math.round(scrollH * dpr),
      sourceUrl: tab.url,
      title: tab.title,
    },
  });

  if (!stitchResult?.ok) {
    throw new Error(stitchResult?.error || 'Stitching failed');
  }

  broadcast(MSG.SW_PROGRESS, { percent: 100, tabId });
  broadcast(MSG.SW_DONE, { id, tabId });

  // Open preview in a tab next to the source tab
  const previewUrl = chrome.runtime.getURL(
    `src/preview/preview.html?id=${id}`
  );
  await chrome.tabs.create({ url: previewUrl, index: tab.index + 1 });

  return id;
}

// ─── Message listener ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === MSG.CAPTURE_START) {
    captureTab(msg.payload.tabId)
      .then((id) => sendResponse({ ok: true, id }))
      .catch((err) => {
        broadcast(MSG.SW_ERROR, { error: err.message });
        sendResponse({ ok: false, error: err.message });
      });
    return true; // keep channel open for async sendResponse
  }
});

// ─── Keyboard shortcut ────────────────────────────────────────────────────────

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'capture-fullpage') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  captureTab(tab.id).catch((err) =>
    console.error('[screen-collector] Capture error:', err)
  );
});
