import { getScreenshot } from '../shared/db.js';
import { getSettings } from '../shared/settings.js';
import { MSG } from '../shared/messages.js';
import { showToast } from '../shared/toast.js';

const params = new URLSearchParams(location.search);
const id = params.get('id');
const modeFromQuery = params.get('mode') || 'page';

const stageEl = document.getElementById('stage');
const screenshotImg = document.getElementById('screenshot');
const annotationLayer = document.getElementById('annotationLayer');
const imageContainer = document.getElementById('imageContainer');
const imageSkeletonEl = document.getElementById('imageSkeleton');
const loadingEl = document.getElementById('loading');
const errorMsgEl = document.getElementById('errorMsg');
const modeNoticeEl = document.getElementById('modeNotice');
const sourceUrlEl = document.getElementById('sourceUrl');
const captureTimeEl = document.getElementById('captureTime');
const dimensionsEl = document.getElementById('dimensions');
const downloadPngBtn = document.getElementById('downloadPng');
const downloadJpgBtn = document.getElementById('downloadJpg');
const downloadPdfBtn = document.getElementById('downloadPdf');
const copyImageBtn = document.getElementById('copyImage');
const pdfPageSizeEl = document.getElementById('pdfPageSize');
const stampOverlayEl = document.getElementById('stampOverlay');
const clearEditsBtn = document.getElementById('clearEdits');
const editbarEl = document.querySelector('.editbar');
const zoomHintEl = document.querySelector('.zoom-hint');

const toolButtons = {
  crop: document.getElementById('toolCrop'),
  blur: document.getElementById('toolBlur'),
  highlight: document.getElementById('toolHighlight'),
  text: document.getElementById('toolText'),
  shape: document.getElementById('toolShape'),
  emoji: document.getElementById('toolEmoji'),
};

const PDF_PAGE = {
  a4: { w: 595.276, h: 841.89 },
  letter: { w: 612, h: 792 },
};
const GOOGLE_DOCS_PIXEL_LIMIT = 25_000_000;

let currentBlob = null;
let sourceUrl = '';
let captureTimestamp = Date.now();
let naturalW = 0;
let naturalH = 0;
let zoomed = false;
let activeTool = null;
let pointerStart = null;
let draftRect = null;
let cropRect = null;
let annotations = [];
let lastTapAt = 0;
let settings = {
  defaultExportFormat: 'png',
  defaultPdfPageSize: 'auto',
  autoDownloadMode: 'off',
  saveAs: false,
  downloadDirectory: '',
  fitClipboardToDocsLimit: true,
};
let hasAutoDownloaded = false;

// ─── Init ─────────────────────────────────────────────────────────────────────

function sanitizeHttpUrl(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
  } catch (_) {
    return '';
  }
  return '';
}

async function init() {
  if (!id) {
    showError('No screenshot ID in URL.');
    return;
  }

  try {
    settings = await getSettings();
    pdfPageSizeEl.value = settings.defaultPdfPageSize;

    const record = await getScreenshot(id);
    if (!record) {
      showError('Screenshot not found. It may have been deleted.');
      return;
    }

    sourceUrl = record.url || '';
    captureTimestamp = record.timestamp || Date.now();

    const safeUrl = sanitizeHttpUrl(record.url || '');
    sourceUrlEl.textContent = record.url || '';
    if (safeUrl) {
      sourceUrlEl.href = safeUrl;
      sourceUrlEl.target = '_blank';
      sourceUrlEl.rel = 'noopener noreferrer';
      sourceUrlEl.removeAttribute('aria-disabled');
      sourceUrlEl.style.pointerEvents = '';
    } else {
      sourceUrlEl.removeAttribute('href');
      sourceUrlEl.removeAttribute('target');
      sourceUrlEl.removeAttribute('rel');
      sourceUrlEl.setAttribute('aria-disabled', 'true');
      sourceUrlEl.style.pointerEvents = 'none';
    }
    document.title = `Collector · ${record.title || record.url}`;
    captureTimeEl.textContent = new Date(record.timestamp).toLocaleString();
    dimensionsEl.textContent = `${record.width} × ${record.height} px`;

    await setupSinglePreview(record);

    if (modeFromQuery === 'iframe') {
      modeNoticeEl.textContent = 'Captured using same-origin iframe mode.';
      modeNoticeEl.classList.remove('hidden');
    } else if (modeFromQuery === 'element') {
      modeNoticeEl.textContent = 'Captured using inner scroll-container mode.';
      modeNoticeEl.classList.remove('hidden');
    }

    maybeAutoDownload();
  } catch (err) {
    showError(`Failed to load screenshot: ${err.message}`);
  }
}

async function setupSinglePreview(record) {
  currentBlob = record.blob;
  const objectUrl = URL.createObjectURL(record.blob);
  screenshotImg.src = objectUrl;
    screenshotImg.onload = () => {
      naturalW = screenshotImg.naturalWidth;
      naturalH = screenshotImg.naturalHeight;
      loadingEl.classList.add('hidden');
      imageSkeletonEl.classList.add('hidden');
      stageEl.classList.remove('hidden');
      screenshotImg.classList.remove('hidden');
      refreshOverlayCanvas();
      URL.revokeObjectURL(objectUrl);
  };
}

function showError(msg) {
  loadingEl.classList.add('hidden');
  imageSkeletonEl.classList.add('hidden');
  errorMsgEl.textContent = msg;
  errorMsgEl.classList.remove('hidden');
}

function maybeAutoDownload() {
  if (settings.autoDownloadMode !== 'after_preview' || hasAutoDownloaded) return;
  hasAutoDownloaded = true;
  setTimeout(() => {
    runExport(settings.defaultExportFormat).catch((err) => {
      showError(`Auto-download failed: ${err.message}`);
    });
  }, 250);
}

// ─── Zoom toggle ──────────────────────────────────────────────────────────────

imageContainer.addEventListener('click', (e) => {
  if (activeTool) return; // editing mode disables zoom toggle
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

// ─── Editing tools ────────────────────────────────────────────────────────────

for (const [tool, btn] of Object.entries(toolButtons)) {
  btn.addEventListener('click', () => setTool(activeTool === tool ? null : tool));
}

clearEditsBtn.addEventListener('click', () => {
  cropRect = null;
  draftRect = null;
  annotations = [];
  refreshOverlayCanvas();
});

function setTool(tool) {
  activeTool = tool;
  pointerStart = null;
  draftRect = null;

  for (const [name, btn] of Object.entries(toolButtons)) {
    btn.classList.toggle('active', name === activeTool);
  }

  annotationLayer.classList.toggle('editable', !!activeTool);
  annotationLayer.style.cursor = activeTool ? 'crosshair' : 'default';
  if (activeTool && zoomed) {
    zoomed = false;
    screenshotImg.classList.add('fit');
    screenshotImg.classList.remove('full');
    imageContainer.classList.remove('zoomed');
  }
  refreshOverlayCanvas();
}

annotationLayer.addEventListener('pointerdown', (e) => {
  if (!activeTool) return;
  const pt = eventToImagePoint(e);
  if (!pt) return;

  annotationLayer.setPointerCapture(e.pointerId);
  pointerStart = pt;
  draftRect = { x: pt.x, y: pt.y, w: 1, h: 1 };

  if (activeTool === 'text') {
    const text = prompt('Enter label text:');
    if (text) annotations.push({ type: 'text', x: pt.x, y: pt.y, text });
    pointerStart = null;
    draftRect = null;
    refreshOverlayCanvas();
  }

  if (activeTool === 'emoji') {
    const emoji = prompt('Enter emoji:', '🔒') || '🔒';
    annotations.push({ type: 'emoji', x: pt.x, y: pt.y, emoji });
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

  if (activeTool === 'crop') cropRect = { ...draftRect };
  if (activeTool === 'blur') annotations.push({ type: 'blur', rect: { ...draftRect } });
  if (activeTool === 'highlight') annotations.push({ type: 'highlight', rect: { ...draftRect } });
  if (activeTool === 'shape') annotations.push({ type: 'shape', rect: { ...draftRect } });

  pointerStart = null;
  draftRect = null;
  refreshOverlayCanvas();
});

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

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
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
    ctx.font = '600 14px Segoe UI';
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
    ctx.font = '24px Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji';
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
    ctx.font = '600 11px Segoe UI';
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

// ─── Downloads ────────────────────────────────────────────────────────────────

downloadPngBtn.addEventListener('click', async () => {
  await runExport('png').catch((err) => showError(`PNG export failed: ${err.message}`));
});

downloadJpgBtn.addEventListener('click', async () => {
  await runExport('jpg').catch((err) => showError(`JPG export failed: ${err.message}`));
});

downloadPdfBtn.addEventListener('click', async () => {
  await runExport('pdf').catch((err) => showError(`PDF export failed: ${err.message}`));
});

copyImageBtn.addEventListener('click', async () => {
  await copyToClipboard().catch((err) => showError(`Copy failed: ${err.message}`));
});

async function runExport(format) {
  if (!currentBlob) {
    throw new Error('Export is unavailable before image load.');
  }

  if (format === 'png') {
    const canvas = await buildEditedCanvas();
    const blob = await canvasToBlob(canvas, 'image/png');
    await triggerDownloadBlob(blob, 'png');
    showToast('PNG download started.', 'success');
    return;
  }

  if (format === 'jpg') {
    const canvas = await buildEditedCanvas();
    const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
    await triggerDownloadBlob(blob, 'jpg');
    showToast('JPG download started.', 'success');
    return;
  }

  if (format === 'pdf') {
    const originalHtml = downloadPdfBtn.innerHTML;
    downloadPdfBtn.disabled = true;
    downloadPdfBtn.innerHTML = 'Building PDF…';
    try {
      const edited = await buildEditedCanvas();
      const pageSize = pdfPageSizeEl.value;
      const pdfBlob = await buildPdfFromCanvas(edited, pageSize);
      await triggerDownloadBlob(pdfBlob, 'pdf');
      showToast('PDF download started.', 'success');
    } finally {
      downloadPdfBtn.disabled = false;
      downloadPdfBtn.innerHTML = originalHtml;
    }
    return;
  }

  throw new Error(`Unsupported export format: ${format}`);
}

async function copyToClipboard() {
  if (!currentBlob) {
    throw new Error('Copy is unavailable before image load.');
  }
  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
    throw new Error('Clipboard image copy is not supported in this browser context.');
  }

  const base = await buildEditedCanvas();
  const fitted = maybeFitForDocsLimit(base, settings.fitClipboardToDocsLimit);
  const blob = await canvasToBlob(fitted, 'image/png');
  const item = new ClipboardItem({ 'image/png': blob });
  await navigator.clipboard.write([item]);

  if (fitted !== base) {
    showToast('Copied (resized to Docs-safe limit).', 'info');
  } else {
    showToast('Copied image to clipboard.', 'success');
  }
}

function maybeFitForDocsLimit(canvas, shouldFit) {
  if (!shouldFit) return canvas;
  const pixels = canvas.width * canvas.height;
  if (pixels <= GOOGLE_DOCS_PIXEL_LIMIT) return canvas;

  const scale = Math.sqrt(GOOGLE_DOCS_PIXEL_LIMIT / pixels);
  const out = document.createElement('canvas');
  out.width = Math.max(1, Math.floor(canvas.width * scale));
  out.height = Math.max(1, Math.floor(canvas.height * scale));
  const ctx = out.getContext('2d');
  if (!ctx) return canvas;
  ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, out.width, out.height);
  return out;
}

function triggerDownload(href, filename) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(href), 1500);
}

async function triggerDownloadBlob(blob, ext) {
  const hasDownloads = await chrome.permissions.contains({
    permissions: ['downloads'],
  });
  const titleText = document.title.replace(/^Collector\s*·\s*/i, '').trim() || 'screenshot';

  if (hasDownloads) {
    try {
      const result = await chrome.runtime.sendMessage({
        type: MSG.PT_DOWNLOAD,
        payload: {
          blob,
          ext,
          title: titleText,
        },
      });
      if (!result?.ok) {
        throw new Error(result?.error || 'downloads.download failed');
      }
      return;
    } catch (_) {
      // Fallback to anchor download if runtime messaging fails
      // (for example very large payload transfer edge cases).
    }
  }

  const fallbackName = `screenshot-${Date.now()}.${ext}`;
  triggerDownload(URL.createObjectURL(blob), fallbackName);
}

async function buildEditedCanvas() {
  const base = await decodeImageToCanvas(currentBlob);
  const ctx = base.getContext('2d');

  for (const ann of annotations) {
    applyAnnotation(ctx, base, ann);
  }

  if (stampOverlayEl.checked) {
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
    return out;
  }

  return base;
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
    ctx.font = `600 ${size}px Segoe UI`;
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
    ctx.font = `${size}px Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji`;
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
  ctx.font = `600 ${fontSize}px Segoe UI`;
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

async function decodeImageToCanvas(blob) {
  const decoded = await decodeImageBlob(blob);
  const w = decoded.width || decoded.naturalWidth;
  const h = decoded.height || decoded.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(decoded, 0, 0);
  if (typeof decoded.close === 'function') decoded.close();
  return canvas;
}

async function decodeImageBlob(blob) {
  if (typeof createImageBitmap === 'function') return createImageBitmap(blob);
  const url = URL.createObjectURL(blob);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to decode image blob'));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (out) => {
        if (out) resolve(out);
        else reject(new Error('canvas.toBlob returned null'));
      },
      type,
      quality
    );
  });
}

// ─── Smart PDF splitting ──────────────────────────────────────────────────────

async function buildPdfFromCanvas(canvas, pageSize) {
  if (pageSize === 'auto') {
    const jpeg = await canvasToBlob(canvas, 'image/jpeg', 0.9);
    const bytes = new Uint8Array(await jpeg.arrayBuffer());
    return buildPdfDocument([singleAutoPage(canvas.width, canvas.height, bytes)]);
  }

  const page = PDF_PAGE[pageSize];
  const margin = 24;
  const availW = page.w - margin * 2;
  const availH = page.h - margin * 2;
  const pxPerPage = Math.max(1, Math.floor((availH / availW) * canvas.width));
  const breaks = computeSmartBreaks(canvas, pxPerPage);

  const pages = [];
  let startY = 0;
  for (const endY of breaks) {
    const sliceH = endY - startY;
    if (sliceH <= 0) continue;
    const slice = document.createElement('canvas');
    slice.width = canvas.width;
    slice.height = sliceH;
    slice.getContext('2d').drawImage(canvas, 0, startY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

    const jpeg = await canvasToBlob(slice, 'image/jpeg', 0.9);
    const bytes = new Uint8Array(await jpeg.arrayBuffer());
    const drawW = availW;
    const drawH = (sliceH / canvas.width) * drawW;
    pages.push({
      pageW: page.w,
      pageH: page.h,
      drawW,
      drawH,
      drawX: margin,
      drawY: page.h - margin - drawH,
      imgW: slice.width,
      imgH: slice.height,
      bytes,
    });
    startY = endY;
  }

  return buildPdfDocument(pages);
}

function singleAutoPage(imgW, imgH, bytes) {
  const maxSide = 14400;
  const scale = Math.min(1, maxSide / Math.max(imgW, imgH));
  return {
    pageW: imgW * scale,
    pageH: imgH * scale,
    drawW: imgW * scale,
    drawH: imgH * scale,
    drawX: 0,
    drawY: 0,
    imgW,
    imgH,
    bytes,
  };
}

function computeSmartBreaks(canvas, targetSliceH) {
  const maxY = canvas.height;
  const search = Math.max(24, Math.floor(targetSliceH * 0.16));
  const minSlice = Math.max(40, Math.floor(targetSliceH * 0.55));
  const ink = sampleRowInk(canvas);
  const out = [];
  let y = 0;

  while (y < maxY) {
    const target = y + targetSliceH;
    if (target >= maxY) {
      out.push(maxY);
      break;
    }
    const lo = Math.max(y + minSlice, target - search);
    const hi = Math.min(maxY - 1, target + search);

    let bestY = target;
    let bestScore = Number.POSITIVE_INFINITY;
    for (let i = lo; i <= hi; i++) {
      const dist = Math.abs(i - target) / search;
      const score = ink[i] + dist * 0.12;
      if (score < bestScore) {
        bestScore = score;
        bestY = i;
      }
    }

    out.push(bestY);
    y = bestY;
  }

  return out;
}

function sampleRowInk(canvas) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const { width, height } = canvas;
  const stepX = Math.max(1, Math.floor(width / 700));
  const bandH = 24;
  const out = new Array(height);

  for (let y0 = 0; y0 < height; y0 += bandH) {
    const h = Math.min(bandH, height - y0);
    const data = ctx.getImageData(0, y0, width, h).data;

    for (let ly = 0; ly < h; ly++) {
      let dark = 0;
      let total = 0;
      const rowOffset = ly * width * 4;

      for (let x = 0; x < width; x += stepX) {
        const i = rowOffset + x * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        if (lum < 242) dark++;
        total++;
      }

      out[y0 + ly] = dark / Math.max(1, total);
    }
  }
  return out;
}

function buildPdfDocument(pages) {
  const text = new TextEncoder();
  const parts = [];
  const offsets = [0];
  let len = 0;
  const appendText = (s) => {
    const bytes = text.encode(s);
    parts.push(bytes);
    len += bytes.length;
  };
  const appendBytes = (bytes) => {
    parts.push(bytes);
    len += bytes.length;
  };
  const pushObj = (num, body) => {
    offsets[num] = len;
    appendText(`${num} 0 obj\n${body}\nendobj\n`);
  };

  appendText('%PDF-1.4\n');

  const pageCount = pages.length;
  const firstPageObj = 3;
  const firstImgObj = firstPageObj + pageCount;
  const firstContentObj = firstImgObj + pageCount;
  const totalObjs = 2 + pageCount * 3;

  pushObj(1, '<< /Type /Catalog /Pages 2 0 R >>');

  const kids = [];
  for (let i = 0; i < pageCount; i++) kids.push(`${firstPageObj + i} 0 R`);
  pushObj(2, `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${pageCount} >>`);

  for (let i = 0; i < pageCount; i++) {
    const p = pages[i];
    const pageObj = firstPageObj + i;
    const imgObj = firstImgObj + i;
    const contentObj = firstContentObj + i;
    pushObj(
      pageObj,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${fmt(p.pageW)} ${fmt(p.pageH)}] /Resources << /XObject << /Im0 ${imgObj} 0 R >> >> /Contents ${contentObj} 0 R >>`
    );
  }

  for (let i = 0; i < pageCount; i++) {
    const p = pages[i];
    const imgObj = firstImgObj + i;
    offsets[imgObj] = len;
    appendText(
      `${imgObj} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${p.imgW} /Height ${p.imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.bytes.length} >>\nstream\n`
    );
    appendBytes(p.bytes);
    appendText('\nendstream\nendobj\n');
  }

  for (let i = 0; i < pageCount; i++) {
    const p = pages[i];
    const contentObj = firstContentObj + i;
    const content = `q
${fmt(p.drawW)} 0 0 ${fmt(p.drawH)} ${fmt(p.drawX)} ${fmt(p.drawY)} cm
/Im0 Do
Q
`;
    pushObj(contentObj, `<< /Length ${text.encode(content).length} >>\nstream\n${content}endstream`);
  }

  const xrefOffset = len;
  appendText(`xref\n0 ${totalObjs + 1}\n0000000000 65535 f \n`);
  for (let i = 1; i <= totalObjs; i++) {
    appendText(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
  }
  appendText(`trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return new Blob(parts, { type: 'application/pdf' });
}

function fmt(n) {
  return Number(n.toFixed(3)).toString();
}

init();
