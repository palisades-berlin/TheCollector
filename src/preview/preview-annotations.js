export function createAnnotationsController({
  annotationLayer,
  screenshotImg,
  imageContainer,
  toolButtons,
  clearEditsBtn,
  uiFontFamily,
  emojiFontFamily,
  decodeImageToCanvas,
}) {
  let naturalW = 0;
  let naturalH = 0;
  let zoomed = false;
  let activeTool = null;
  let pointerStart = null;
  let draftRect = null;
  let cropRect = null;
  let annotations = [];
  let lastTapAt = 0;
  let editedCanvasRevision = 0;
  const editedCanvasMemo = new Map();

  function markEditedCanvasDirty() {
    editedCanvasRevision++;
    editedCanvasMemo.clear();
  }

  function setNaturalSize(width, height) {
    naturalW = Number(width || 0);
    naturalH = Number(height || 0);
  }

  function setTool(tool) {
    activeTool = tool;
    pointerStart = null;
    draftRect = null;

    for (const [name, btn] of Object.entries(toolButtons)) {
      btn.classList.toggle('active', name === activeTool);
    }

    annotationLayer.classList.toggle('editable', Boolean(activeTool));
    annotationLayer.style.cursor = activeTool ? 'crosshair' : 'default';
    if (activeTool && zoomed) {
      zoomed = false;
      screenshotImg.classList.add('fit');
      screenshotImg.classList.remove('full');
      imageContainer.classList.remove('zoomed');
    }
    refreshOverlayCanvas();
  }

  function clearEdits() {
    cropRect = null;
    draftRect = null;
    annotations = [];
    markEditedCanvasDirty();
    refreshOverlayCanvas();
  }

  function eventToImagePoint(e) {
    const rect = screenshotImg.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const x = (e.clientX - rect.left) * (naturalW / rect.width);
    const y = (e.clientY - rect.top) * (naturalH / rect.height);
    return {
      x: clamp(x, 0, naturalW),
      y: clamp(y, 0, naturalH),
    };
  }

  function normalizeRect(x1, y1, x2, y2) {
    const x = Math.min(x1, x2);
    const y = Math.min(y1, y2);
    return {
      x,
      y,
      w: Math.abs(x2 - x1),
      h: Math.abs(y2 - y1),
    };
  }

  function refreshOverlayCanvas() {
    if (!naturalW || !naturalH) return;
    const rect = screenshotImg.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const dpr = window.devicePixelRatio || 1;
    annotationLayer.width = Math.round(rect.width * dpr);
    annotationLayer.height = Math.round(rect.height * dpr);
    annotationLayer.style.width = `${rect.width}px`;
    annotationLayer.style.height = `${rect.height}px`;

    const ctx = annotationLayer.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const sx = rect.width / naturalW;
    const sy = rect.height / naturalH;
    const toView = (r) => ({ x: r.x * sx, y: r.y * sy, w: r.w * sx, h: r.h * sy });

    for (const ann of annotations) {
      drawAnnotationPreview(ctx, ann, sx, sy, toView);
    }
    if (cropRect) drawCropPreview(ctx, toView(cropRect), rect.width, rect.height);
    if (draftRect) {
      const vr = toView(draftRect);
      ctx.save();
      ctx.strokeStyle = activeTool === 'crop' ? '#ffee58' : '#4fc3f7';
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 6]);
      ctx.strokeRect(vr.x, vr.y, vr.w, vr.h);
      ctx.restore();
    }
  }

  function drawAnnotationPreview(ctx, ann, sx, sy, toView) {
    if (ann.type === 'text') {
      ctx.save();
      ctx.font = `600 14px ${uiFontFamily}`;
      ctx.fillStyle = '#ffecb3';
      ctx.strokeStyle = '#263238';
      ctx.lineWidth = 3;
      const x = ann.x * sx;
      const y = ann.y * sy;
      ctx.strokeText(ann.text, x, y);
      ctx.fillText(ann.text, x, y);
      ctx.restore();
      return;
    }

    if (ann.type === 'emoji') {
      ctx.save();
      ctx.font = `24px ${emojiFontFamily}`;
      ctx.fillText(ann.emoji, ann.x * sx, ann.y * sy);
      ctx.restore();
      return;
    }

    const vr = toView(ann.rect);
    if (ann.type === 'blur') {
      ctx.save();
      ctx.fillStyle = 'rgba(120, 120, 120, 0.45)';
      ctx.fillRect(vr.x, vr.y, vr.w, vr.h);
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(vr.x, vr.y, vr.w, vr.h);
      ctx.fillStyle = '#fff';
      ctx.font = `600 11px ${uiFontFamily}`;
      ctx.fillText('BLUR', vr.x + 6, vr.y + 14);
      ctx.restore();
    } else if (ann.type === 'highlight') {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 235, 59, 0.28)';
      ctx.fillRect(vr.x, vr.y, vr.w, vr.h);
      ctx.strokeStyle = 'rgba(255, 213, 79, 0.85)';
      ctx.strokeRect(vr.x, vr.y, vr.w, vr.h);
      ctx.restore();
    } else if (ann.type === 'shape') {
      ctx.save();
      ctx.strokeStyle = '#ef5350';
      ctx.lineWidth = 2;
      ctx.strokeRect(vr.x, vr.y, vr.w, vr.h);
      ctx.restore();
    }
  }

  function drawCropPreview(ctx, crop, fullW, fullH) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
    ctx.fillRect(0, 0, fullW, fullH);
    ctx.clearRect(crop.x, crop.y, crop.w, crop.h);
    ctx.strokeStyle = '#ffee58';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 6]);
    ctx.strokeRect(crop.x, crop.y, crop.w, crop.h);
    ctx.restore();
  }

  function applyAnnotation(ctx, canvas, ann) {
    if (ann.type === 'blur') {
      const { x, y, w, h } = integerRect(ann.rect, canvas.width, canvas.height);
      const tmp = document.createElement('canvas');
      tmp.width = w;
      tmp.height = h;
      const tctx = tmp.getContext('2d');
      tctx.drawImage(canvas, x, y, w, h, 0, 0, w, h);
      ctx.save();
      ctx.filter = 'blur(9px)';
      ctx.drawImage(tmp, 0, 0, w, h, x, y, w, h);
      ctx.restore();
      return;
    }

    if (ann.type === 'highlight') {
      const { x, y, w, h } = integerRect(ann.rect, canvas.width, canvas.height);
      ctx.save();
      ctx.fillStyle = 'rgba(255, 235, 59, 0.3)';
      ctx.fillRect(x, y, w, h);
      ctx.restore();
      return;
    }

    if (ann.type === 'shape') {
      const { x, y, w, h } = integerRect(ann.rect, canvas.width, canvas.height);
      ctx.save();
      ctx.strokeStyle = '#ef5350';
      ctx.lineWidth = Math.max(2, Math.round(canvas.width / 900));
      ctx.strokeRect(x, y, w, h);
      ctx.restore();
      return;
    }

    if (ann.type === 'text') {
      ctx.save();
      const size = Math.max(18, Math.round(canvas.width / 80));
      ctx.font = `600 ${size}px ${uiFontFamily}`;
      ctx.lineWidth = Math.max(3, Math.round(size / 8));
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillStyle = '#fff7c2';
      ctx.strokeText(ann.text, ann.x, ann.y);
      ctx.fillText(ann.text, ann.x, ann.y);
      ctx.restore();
      return;
    }

    if (ann.type === 'emoji') {
      ctx.save();
      const size = Math.max(28, Math.round(canvas.width / 38));
      ctx.font = `${size}px ${emojiFontFamily}`;
      ctx.fillText(ann.emoji, ann.x, ann.y);
      ctx.restore();
    }
  }

  function integerRect(rect, maxW, maxH) {
    const x = clamp(Math.floor(rect.x), 0, maxW - 1);
    const y = clamp(Math.floor(rect.y), 0, maxH - 1);
    const w = clamp(Math.ceil(rect.w), 1, maxW - x);
    const h = clamp(Math.ceil(rect.h), 1, maxH - y);
    return { x, y, w, h };
  }

  function drawStampOverlay(ctx, width, height, url, timestamp) {
    const line1 = safeText(url || '');
    const line2 = new Date(timestamp).toLocaleString();
    const fontSize = Math.max(12, Math.round(width / 95));
    const pad = Math.max(8, Math.round(width / 160));
    const gap = Math.round(fontSize * 0.35);

    ctx.save();
    ctx.font = `600 ${fontSize}px ${uiFontFamily}`;
    const w1 = ctx.measureText(line1).width;
    const w2 = ctx.measureText(line2).width;
    const boxW = Math.min(width - pad * 2, Math.max(w1, w2) + pad * 2);
    const lineH = Math.round(fontSize * 1.25);
    const boxH = lineH * 2 + gap + pad * 2;
    const x = width - boxW - pad;
    const y = height - boxH - pad;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.58)';
    ctx.fillRect(x, y, boxW, boxH);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillText(trimToWidth(ctx, line1, boxW - pad * 2), x + pad, y + pad + lineH - 4);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(trimToWidth(ctx, line2, boxW - pad * 2), x + pad, y + pad + lineH * 2 + gap - 4);
    ctx.restore();
  }

  async function buildEditedCanvas({ currentBlob, stampEnabled, sourceUrl, captureTimestamp }) {
    const memoKey = `${editedCanvasRevision}|stamp:${stampEnabled ? 1 : 0}`;
    const cached = editedCanvasMemo.get(memoKey);
    if (cached) return cached;

    const base = await decodeImageToCanvas(currentBlob);
    const ctx = base.getContext('2d');

    for (const ann of annotations) {
      applyAnnotation(ctx, base, ann);
    }

    if (stampEnabled) {
      drawStampOverlay(ctx, base.width, base.height, sourceUrl, captureTimestamp);
    }

    if (cropRect) {
      const x = clamp(Math.round(cropRect.x), 0, base.width - 1);
      const y = clamp(Math.round(cropRect.y), 0, base.height - 1);
      const w = clamp(Math.round(cropRect.w), 1, base.width - x);
      const h = clamp(Math.round(cropRect.h), 1, base.height - y);
      const out = document.createElement('canvas');
      out.width = w;
      out.height = h;
      out.getContext('2d').drawImage(base, x, y, w, h, 0, 0, w, h);
      editedCanvasMemo.set(memoKey, out);
      return out;
    }

    editedCanvasMemo.set(memoKey, base);
    return base;
  }

  function bindEvents() {
    imageContainer.addEventListener('click', (e) => {
      if (activeTool) return;
      if (e.target !== screenshotImg) return;
      const now = Date.now();
      if (now - lastTapAt < 250) return;
      lastTapAt = now;
      zoomed = !zoomed;
      screenshotImg.classList.toggle('fit', !zoomed);
      screenshotImg.classList.toggle('full', zoomed);
      imageContainer.classList.toggle('zoomed', zoomed);
      refreshOverlayCanvas();
    });

    window.addEventListener('resize', () => refreshOverlayCanvas());
    screenshotImg.addEventListener('load', () => refreshOverlayCanvas());

    for (const [tool, btn] of Object.entries(toolButtons)) {
      btn.addEventListener('click', () => setTool(activeTool === tool ? null : tool));
    }

    clearEditsBtn.addEventListener('click', () => clearEdits());

    annotationLayer.addEventListener('pointerdown', (e) => {
      if (!activeTool) return;
      const pt = eventToImagePoint(e);
      if (!pt) return;

      annotationLayer.setPointerCapture(e.pointerId);
      pointerStart = pt;
      draftRect = { x: pt.x, y: pt.y, w: 1, h: 1 };

      if (activeTool === 'text') {
        const text = prompt('Enter label text:');
        if (text) {
          annotations.push({ type: 'text', x: pt.x, y: pt.y, text });
          markEditedCanvasDirty();
        }
        pointerStart = null;
        draftRect = null;
        refreshOverlayCanvas();
      }

      if (activeTool === 'emoji') {
        const emoji = prompt('Enter emoji:', '🔒') || '🔒';
        annotations.push({ type: 'emoji', x: pt.x, y: pt.y, emoji });
        markEditedCanvasDirty();
        pointerStart = null;
        draftRect = null;
        refreshOverlayCanvas();
      }
    });

    annotationLayer.addEventListener('pointermove', (e) => {
      if (!activeTool || !pointerStart || !draftRect) return;
      const pt = eventToImagePoint(e);
      if (!pt) return;
      draftRect = normalizeRect(pointerStart.x, pointerStart.y, pt.x, pt.y);
      refreshOverlayCanvas();
    });

    annotationLayer.addEventListener('pointerup', () => {
      if (!activeTool || !draftRect) return;
      const minSize = 8;
      if (draftRect.w < minSize || draftRect.h < minSize) {
        pointerStart = null;
        draftRect = null;
        refreshOverlayCanvas();
        return;
      }

      let mutated = false;
      if (activeTool === 'crop') {
        cropRect = { ...draftRect };
        mutated = true;
      }
      if (activeTool === 'blur') {
        annotations.push({ type: 'blur', rect: { ...draftRect } });
        mutated = true;
      }
      if (activeTool === 'highlight') {
        annotations.push({ type: 'highlight', rect: { ...draftRect } });
        mutated = true;
      }
      if (activeTool === 'shape') {
        annotations.push({ type: 'shape', rect: { ...draftRect } });
        mutated = true;
      }
      if (mutated) markEditedCanvasDirty();

      pointerStart = null;
      draftRect = null;
      refreshOverlayCanvas();
    });
  }

  function safeText(s) {
    return String(s).replace(/\s+/g, ' ').trim();
  }

  function trimToWidth(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let out = text;
    while (out.length > 1 && ctx.measureText(`${out}…`).width > maxWidth) {
      out = out.slice(0, -1);
    }
    return `${out}…`;
  }

  return {
    bindEvents,
    setNaturalSize,
    refreshOverlayCanvas,
    setTool,
    clearEdits,
    markEditedCanvasDirty,
    hasActiveTool() {
      return Boolean(activeTool);
    },
    buildEditedCanvas,
  };
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
