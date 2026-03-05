// capture-agent.js — injected into the target page by the service worker.
// Self-contained: no ES module imports.

(function () {
  'use strict';

  // Guard against double-injection on repeated captures
  if (window.__screenCollectorAgent) return;
  window.__screenCollectorAgent = true;

  const SETTLE_MS = 200;
  const IFRAME_MIN_AREA_RATIO = 0.22;
  const IFRAME_MIN_SCROLL_DELTA = 32;
  const ELEMENT_MIN_AREA_RATIO = 0.16;
  const ELEMENT_MIN_SCROLL_DELTA = 32;
  const FALLBACK_PROTOCOL = {
    CS_GET_METRICS: 'CS_GET_METRICS',
    CS_PREPARE: 'CS_PREPARE',
    CS_SCROLL_TO: 'CS_SCROLL_TO',
    CS_RESTORE: 'CS_RESTORE',
  };

  // Saved state for restore
  let savedFixed = [];
  let savedScroll = { x: 0, y: 0 };

  // Active capture target: page or dominant same-origin iframe
  let activeTarget = null; // { type: 'page' } | { type: 'iframe', ... } | { type: 'element', ... }
  let activeTargetId = null;
  let targetSeq = 0;
  const targetRegistry = new Map(); // targetId -> target descriptor

  function getProtocol() {
    const injected = window.__THE_COLLECTOR_PROTOCOL;
    if (!injected || typeof injected !== 'object') return FALLBACK_PROTOCOL;

    const required = [
      'CS_GET_METRICS',
      'CS_PREPARE',
      'CS_SCROLL_TO',
      'CS_RESTORE',
    ];
    for (const key of required) {
      if (typeof injected[key] !== 'string' || injected[key].length === 0) {
        return FALLBACK_PROTOCOL;
      }
    }
    return injected;
  }

  // ─── Metrics ────────────────────────────────────────────────────────────────

  function getMetrics() {
    targetRegistry.clear();
    const dpr = window.devicePixelRatio || 1;
    const iframeTarget = detectDominantSameOriginIframe();

    if (iframeTarget) {
      const frameView = iframeTarget.win;
      const frameDoc = frameView.document;
      const frameEl = iframeTarget.frame;
      const rect = clampRectToViewport(frameEl.getBoundingClientRect());
      const frameRoot = frameDoc.documentElement;
      const targetId = registerTarget({
        type: 'iframe',
        frame: iframeTarget.frame,
        win: iframeTarget.win,
      });

      return {
        scrollW: Math.max(frameRoot.scrollWidth, frameDoc.body?.scrollWidth || 0),
        scrollH: Math.max(frameRoot.scrollHeight, frameDoc.body?.scrollHeight || 0),
        // Step size must match actually visible crop area to avoid stitched gaps
        viewW: Math.max(1, Math.round(rect.width)),
        viewH: Math.max(1, Math.round(rect.height)),
        dpr,
        captureMode: 'iframe',
        targetId,
        crop: {
          x: Math.round(rect.left * dpr),
          y: Math.round(rect.top * dpr),
          w: Math.max(1, Math.round(rect.width * dpr)),
          h: Math.max(1, Math.round(rect.height * dpr)),
        },
      };
    }

    const elementTarget = detectDominantScrollableElement();
    if (elementTarget) {
      const rect = clampRectToViewport(elementTarget.el.getBoundingClientRect());
      const targetId = registerTarget({
        type: 'element',
        el: elementTarget.el,
      });
      return {
        scrollW: Math.max(1, elementTarget.el.scrollWidth),
        scrollH: Math.max(1, elementTarget.el.scrollHeight),
        // Step size must match actually visible crop area to avoid stitched gaps
        viewW: Math.max(1, Math.round(rect.width)),
        viewH: Math.max(1, Math.round(rect.height)),
        dpr,
        captureMode: 'element',
        targetId,
        crop: {
          x: Math.round(rect.left * dpr),
          y: Math.round(rect.top * dpr),
          w: Math.max(1, Math.round(rect.width * dpr)),
          h: Math.max(1, Math.round(rect.height * dpr)),
        },
      };
    }

    const targetId = registerTarget({ type: 'page' });
    return {
      scrollW: document.documentElement.scrollWidth,
      scrollH: document.documentElement.scrollHeight,
      viewW: window.innerWidth,
      viewH: window.innerHeight,
      dpr,
      captureMode: 'page',
      targetId,
      crop: null,
    };
  }

  function registerTarget(target) {
    const id = `t_${++targetSeq}`;
    targetRegistry.set(id, target);
    return id;
  }

  function detectDominantSameOriginIframe() {
    const frames = document.querySelectorAll('iframe, frame');
    if (frames.length === 0) return null;

    const viewportArea = Math.max(1, window.innerWidth * window.innerHeight);
    let best = null;

    for (const frame of frames) {
      const frameWin = getSameOriginFrameWindow(frame);
      if (!frameWin) continue;

      const rect = frame.getBoundingClientRect();
      const clamped = clampRectToViewport(rect);
      const visibleArea = clamped.width * clamped.height;
      if (visibleArea < viewportArea * IFRAME_MIN_AREA_RATIO) continue;

      const frameDoc = frameWin.document;
      const root = frameDoc.documentElement;
      const body = frameDoc.body;
      const scrollH = Math.max(root.scrollHeight, body?.scrollHeight || 0);
      const scrollW = Math.max(root.scrollWidth, body?.scrollWidth || 0);
      const viewH = Math.max(1, frameWin.innerHeight);
      const viewW = Math.max(1, frameWin.innerWidth);

      const verticalScrollable = scrollH > viewH + IFRAME_MIN_SCROLL_DELTA;
      const horizontalScrollable = scrollW > viewW + IFRAME_MIN_SCROLL_DELTA;
      if (!verticalScrollable && !horizontalScrollable) continue;

      if (!best || visibleArea > best.visibleArea) {
        best = { frame, win: frameWin, visibleArea };
      }
    }

    return best;
  }

  function detectDominantScrollableElement() {
    const viewportArea = Math.max(1, window.innerWidth * window.innerHeight);
    let best = null;
    walkElements(document, (el) => {
      if (!isElementScrollable(el)) return;
      const rect = el.getBoundingClientRect();
      const clamped = clampRectToViewport(rect);
      const visibleArea = clamped.width * clamped.height;
      if (visibleArea < viewportArea * ELEMENT_MIN_AREA_RATIO) return;

      if (!best || visibleArea > best.visibleArea) {
        best = { el, visibleArea };
      }
    });
    return best;
  }

  function isElementScrollable(el) {
    if (!(el instanceof Element)) return false;
    if (el === document.documentElement || el === document.body) return false;
    if (!hasRenderableBox(el)) return false;
    if (el.clientWidth < 80 || el.clientHeight < 80) return false;

    // Fast structural gate before expensive computed-style checks.
    const scrollableY = el.scrollHeight > el.clientHeight + ELEMENT_MIN_SCROLL_DELTA;
    const scrollableX = el.scrollWidth > el.clientWidth + ELEMENT_MIN_SCROLL_DELTA;
    if (!scrollableY && !scrollableX) return false;

    const cs = window.getComputedStyle(el);
    const canScrollY = /(auto|scroll|overlay)/.test(cs.overflowY);
    const canScrollX = /(auto|scroll|overlay)/.test(cs.overflowX);
    const vertical = canScrollY && el.scrollHeight > el.clientHeight + ELEMENT_MIN_SCROLL_DELTA;
    const horizontal = canScrollX && el.scrollWidth > el.clientWidth + ELEMENT_MIN_SCROLL_DELTA;
    if (!vertical && !horizontal) return false;

    if (cs.visibility === 'hidden' || cs.display === 'none') return false;
    return true;
  }

  function clampRectToViewport(rect) {
    const left = clamp(rect.left, 0, window.innerWidth);
    const top = clamp(rect.top, 0, window.innerHeight);
    const right = clamp(rect.right, 0, window.innerWidth);
    const bottom = clamp(rect.bottom, 0, window.innerHeight);
    return {
      left,
      top,
      width: Math.max(0, right - left),
      height: Math.max(0, bottom - top),
    };
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function getSameOriginFrameWindow(frame) {
    try {
      const win = frame.contentWindow;
      if (!win?.document?.documentElement) return null;
      return win;
    } catch (_) {
      return null;
    }
  }

  // ─── Fixed/sticky handling ─────────────────────────────────────────────────

  function suppressFixed(targetId) {
    savedScroll = { x: window.scrollX, y: window.scrollY };
    savedFixed = [];
    activeTarget = { type: 'page' };
    activeTargetId = targetId || null;

    suppressFixedInDocument(document, savedFixed);

    const target = resolveTarget(targetId);
    if (target.type === 'iframe') {
      const frameDoc = target.win.document;
      const frameFixed = [];
      suppressFixedInDocument(frameDoc, frameFixed);
      activeTarget = {
        type: 'iframe',
        frame: target.frame,
        win: target.win,
        savedScroll: { x: target.win.scrollX, y: target.win.scrollY },
        savedFixed: frameFixed,
      };
      return;
    }

    if (target.type === 'element') {
      activeTarget = {
        type: 'element',
        el: target.el,
        savedScroll: {
          x: target.el.scrollLeft,
          y: target.el.scrollTop,
        },
      };
      return;
    }
  }

  function resolveTarget(targetId) {
    if (!targetId) return { type: 'page' };
    return targetRegistry.get(targetId) || { type: 'page' };
  }

  function suppressFixedInDocument(doc, out) {
    const view = doc.defaultView;
    if (!view) return;

    walkElements(doc, (el) => {
      if (!hasRenderableBox(el)) return;
      const pos = view.getComputedStyle(el).position;
      if (pos === 'fixed' || pos === 'sticky') {
        out.push({ el, visibility: el.style.visibility });
        el.style.setProperty('visibility', 'hidden', 'important');
      }
    });
  }

  function walkElements(doc, visitor) {
    const root = doc.documentElement || doc;
    const walker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    let node = walker.currentNode;
    while (node) {
      visitor(node);
      node = walker.nextNode();
    }
  }

  function hasRenderableBox(el) {
    if (!el || typeof el.getClientRects !== 'function') return false;
    return el.getClientRects().length > 0;
  }

  function restoreFixed() {
    for (const { el, visibility } of savedFixed) {
      el.style.visibility = visibility;
    }
    savedFixed = [];

    if (activeTarget?.type === 'iframe') {
      for (const { el, visibility } of activeTarget.savedFixed) {
        el.style.visibility = visibility;
      }
      try {
        activeTarget.win.scrollTo(activeTarget.savedScroll.x, activeTarget.savedScroll.y);
      } catch (_) {}
    }

    if (activeTarget?.type === 'element') {
      try {
        activeTarget.el.scrollLeft = activeTarget.savedScroll.x;
        activeTarget.el.scrollTop = activeTarget.savedScroll.y;
      } catch (_) {}
    }

    window.scrollTo(savedScroll.x, savedScroll.y);
    activeTarget = null;
    activeTargetId = null;
  }

  // ─── Scroll + settle ────────────────────────────────────────────────────────

  function scrollAndSettle(x, y, callback) {
    if (activeTargetId == null && activeTarget?.type !== 'page') {
      callback();
      return;
    }

    const targetState = validateActiveTarget();
    if (!targetState.ok) {
      callback(targetState.error);
      return;
    }

    try {
      if (activeTarget?.type === 'iframe') {
        activeTarget.win.scrollTo(x, y);
      } else if (activeTarget?.type === 'element') {
        activeTarget.el.scrollLeft = x;
        activeTarget.el.scrollTop = y;
      } else {
        window.scrollTo(x, y);
      }
    } catch (_) {
      window.scrollTo(x, y);
    }

    requestAnimationFrame(() => {
      setTimeout(() => callback(null), SETTLE_MS);
    });
  }

  function validateActiveTarget() {
    if (!activeTarget || activeTarget.type === 'page') return { ok: true };

    if (activeTarget.type === 'element') {
      if (!activeTarget.el || !activeTarget.el.isConnected) {
        return { ok: false, error: 'Capture target element is no longer available' };
      }
      return { ok: true };
    }

    if (activeTarget.type === 'iframe') {
      if (!activeTarget.frame || !activeTarget.frame.isConnected) {
        return { ok: false, error: 'Capture target iframe is no longer available' };
      }
      const win = getSameOriginFrameWindow(activeTarget.frame);
      if (!win || win !== activeTarget.win) {
        return { ok: false, error: 'Capture target iframe context changed' };
      }
      return { ok: true };
    }

    return { ok: true };
  }

  function validateScrollPayload(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return { ok: false, error: 'Invalid scroll payload' };
    }
    const x = Number(payload.x);
    const y = Number(payload.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return { ok: false, error: 'Invalid scroll coordinates' };
    }
    if (
      payload.targetId != null &&
      typeof payload.targetId !== 'string'
    ) {
      return { ok: false, error: 'Invalid target id' };
    }
    return { ok: true, value: { x, y, targetId: payload.targetId || null } };
  }

  // ─── Message listener ───────────────────────────────────────────────────────

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    const { type, payload } = msg;
    const protocol = getProtocol();

    switch (type) {
      case protocol.CS_GET_METRICS:
        sendResponse(getMetrics());
        break;

      case protocol.CS_PREPARE:
        suppressFixed(payload?.targetId);
        sendResponse({ ok: true, targetId: payload?.targetId || null });
        break;

      case protocol.CS_SCROLL_TO:
        {
          const parsed = validateScrollPayload(payload);
          if (!parsed.ok) {
            sendResponse({ done: false, error: parsed.error });
            break;
          }
          const { x, y, targetId } = parsed.value;
        if (
          targetId &&
          activeTargetId &&
          targetId !== activeTargetId
        ) {
          sendResponse({ done: false, error: 'Capture target mismatch' });
          break;
        }
        scrollAndSettle(x, y, (error) =>
          sendResponse(error ? { done: false, error } : { done: true })
        );
        return true; // async — keep channel open
        }

      case protocol.CS_RESTORE:
        restoreFixed();
        sendResponse({ ok: true });
        break;
    }
  });
})();
