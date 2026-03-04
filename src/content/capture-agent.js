// capture-agent.js — injected into the target page by the service worker.
// Self-contained: no ES module imports.

(function () {
  'use strict';

  // Guard against double-injection on repeated captures
  if (window.__screenCollectorAgent) return;
  window.__screenCollectorAgent = true;

  const SETTLE_MS = 200;

  // Saved state for restore
  let savedFixed = [];
  let savedScroll = { x: 0, y: 0 };

  // ─── Page metrics ───────────────────────────────────────────────────────────

  function getMetrics() {
    return {
      scrollW: document.documentElement.scrollWidth,
      scrollH: document.documentElement.scrollHeight,
      viewW: window.innerWidth,
      viewH: window.innerHeight,
      dpr: window.devicePixelRatio || 1,
    };
  }

  // ─── Fixed/sticky element handling ─────────────────────────────────────────
  //
  // We hide fixed/sticky elements during the scroll-capture pass so they
  // don't appear repeated in every tile. They are restored when capture ends.

  function suppressFixed() {
    savedScroll = { x: window.scrollX, y: window.scrollY };
    savedFixed = [];

    const all = document.querySelectorAll('*');
    for (const el of all) {
      const pos = window.getComputedStyle(el).position;
      if (pos === 'fixed' || pos === 'sticky') {
        savedFixed.push({ el, visibility: el.style.visibility });
        el.style.setProperty('visibility', 'hidden', 'important');
      }
    }
  }

  function restoreFixed() {
    for (const { el, visibility } of savedFixed) {
      el.style.visibility = visibility;
    }
    savedFixed = [];
    window.scrollTo(savedScroll.x, savedScroll.y);
  }

  // ─── Scroll + settle ────────────────────────────────────────────────────────

  function scrollAndSettle(x, y, callback) {
    window.scrollTo(x, y);
    // Wait for rAF (layout flush) + settle delay before signalling ready
    requestAnimationFrame(() => {
      setTimeout(callback, SETTLE_MS);
    });
  }

  // ─── Message listener ────────────────────────────────────────────────────────

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    const { type, payload } = msg;

    switch (type) {
      case 'CS_GET_METRICS':
        sendResponse(getMetrics());
        break;

      case 'CS_PREPARE':
        suppressFixed();
        sendResponse({ ok: true });
        break;

      case 'CS_SCROLL_TO':
        scrollAndSettle(payload.x, payload.y, () =>
          sendResponse({ done: true })
        );
        return true; // async — keep channel open

      case 'CS_RESTORE':
        restoreFixed();
        sendResponse({ ok: true });
        break;
    }
  });
})();
