import { getScreenshot } from '../shared/db.js';
import { getSettings } from '../shared/settings.js';
import { MSG } from '../shared/messages.js';
import { showToast } from '../shared/toast.js';
import { anchorDownloadBlob } from '../shared/download.js';
import { buildPdfFromCanvas } from './pdf-export.js';

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
const presetEmailBtn = document.getElementById('presetEmail');
const presetDocsBtn = document.getElementById('presetDocs');
const presetPdfAutoBtn = document.getElementById('presetPdfAuto');
const pdfPageSizeEl = document.getElementById('pdfPageSize');
const stampOverlayEl = document.getElementById('stampOverlay');
const clearEditsBtn = document.getElementById('clearEdits');

const toolButtons = {
  crop: document.getElementById('toolCrop'),
  blur: document.getElementById('toolBlur'),
  highlight: document.getElementById('toolHighlight'),
  text: document.getElementById('toolText'),
  shape: document.getElementById('toolShape'),
  emoji: document.getElementById('toolEmoji'),
};

const GOOGLE_DOCS_PIXEL_LIMIT = 25_000_000;
const UI_CANVAS_FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const EMOJI_FONT_FAMILY =
  '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

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
let presetRunning = false;

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
    document.title = `THE Collector · ${record.title || record.url}`;
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
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      screenshotImg.onload = null;
      screenshotImg.onerror = null;
      URL.revokeObjectURL(objectUrl);
    };

    screenshotImg.onload = () => {
      naturalW = screenshotImg.naturalWidth;
      naturalH = screenshotImg.naturalHeight;
      loadingEl.classList.add('hidden');
      imageSkeletonEl.classList.add('hidden');
      stageEl.classList.remove('hidden');
      screenshotImg.classList.remove('hidden');
      refreshOverlayCanvas();
      cleanup();
      resolve();
    };

    screenshotImg.onerror = () => {
      cleanup();
      reject(new Error('Failed to render screenshot image.'));
    };

    screenshotImg.src = objectUrl;
  });
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
    ctx.font = `600 14px ${UI_CANVAS_FONT_FAMILY}`;
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
    ctx.font = `24px ${EMOJI_FONT_FAMILY}`;
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
    ctx.font = `600 11px ${UI_CANVAS_FONT_FAMILY}`;
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

if (presetEmailBtn) {
  presetEmailBtn.addEventListener('click', async () => {
    await runPreset('email').catch((err) => showError(`Email preset failed: ${err.message}`));
  });
}
if (presetDocsBtn) {
  presetDocsBtn.addEventListener('click', async () => {
    await runPreset('docs').catch((err) => showError(`Docs preset failed: ${err.message}`));
  });
}
if (presetPdfAutoBtn) {
  presetPdfAutoBtn.addEventListener('click', async () => {
    await runPreset('pdf_auto').catch((err) => showError(`PDF Auto preset failed: ${err.message}`));
  });
}

async function runPreset(kind) {
  if (presetRunning) return;
  presetRunning = true;
  setPresetButtonsDisabled(true);
  try {
    if (kind === 'email') {
      await runExport('jpg');
      openEmailDraft();
      showToast('Email preset ready: JPG exported + draft opened.', 'success');
      return;
    }
    if (kind === 'docs') {
      await copyToClipboard({ forceDocsFit: true });
      showToast('Docs preset ready: image copied with Docs-safe sizing.', 'success');
      return;
    }
    if (kind === 'pdf_auto') {
      const previousSize = pdfPageSizeEl.value;
      pdfPageSizeEl.value = 'auto';
      try {
        await runExport('pdf');
      } finally {
        pdfPageSizeEl.value = previousSize;
      }
      showToast('PDF Auto preset ready.', 'success');
      return;
    }
    throw new Error(`Unknown preset: ${kind}`);
  } finally {
    setPresetButtonsDisabled(false);
    presetRunning = false;
  }
}

function setPresetButtonsDisabled(disabled) {
  if (presetEmailBtn) presetEmailBtn.disabled = disabled;
  if (presetDocsBtn) presetDocsBtn.disabled = disabled;
  if (presetPdfAutoBtn) presetPdfAutoBtn.disabled = disabled;
}

function openEmailDraft() {
  const subject = 'Screenshot from THE Collector';
  const source = sanitizeHttpUrl(sourceUrl);
  const bodyLines = ['I exported a screenshot from THE Collector.'];
  if (source) bodyLines.push(`Source: ${source}`);
  bodyLines.push(`Captured: ${new Date(captureTimestamp).toLocaleString()}`);
  bodyLines.push('', 'Please attach the exported JPG file.');
  const href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
  const a = document.createElement('a');
  a.href = href;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

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
      const pdfBlob = await buildPdfFromCanvas(edited, pageSize, canvasToBlob);
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

async function copyToClipboard(options = {}) {
  if (!currentBlob) {
    throw new Error('Copy is unavailable before image load.');
  }
  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
    throw new Error('Clipboard image copy is not supported in this browser context.');
  }

  const base = await buildEditedCanvas();
  const shouldFit = Boolean(options.forceDocsFit) || Boolean(settings.fitClipboardToDocsLimit);
  const fitted = maybeFitForDocsLimit(base, shouldFit);
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

async function triggerDownloadBlob(blob, ext) {
  const hasDownloads = await chrome.permissions.contains({
    permissions: ['downloads'],
  });
  const titleText = document.title.replace(/^THE Collector\s*·\s*/i, '').trim() || 'screenshot';

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
  await anchorDownloadBlob({ blob, filename: fallbackName });
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
    ctx.font = `600 ${size}px ${UI_CANVAS_FONT_FAMILY}`;
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
    ctx.font = `${size}px ${EMOJI_FONT_FAMILY}`;
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
  ctx.font = `600 ${fontSize}px ${UI_CANVAS_FONT_FAMILY}`;
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

init();
