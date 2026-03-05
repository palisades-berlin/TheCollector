import { getUserSettings } from '../shared/repos/settings-repo.js';
import { getScreenshotById } from '../shared/repos/screenshot-repo.js';
import { MSG } from '../shared/messages.js';
import { showToast } from '../shared/toast.js';
import { anchorDownloadBlob } from '../shared/download.js';
import { buildPdfFromCanvas } from './pdf-export.js';
import { buildDiffBlob } from './preview-diff.js';
import { createAnnotationsController } from './preview-annotations.js';
import { createPreviewExportController } from './preview-export.js';
import {
  sanitizeHttpUrl,
  setSourceUrlLink,
  setSourceUrlTextForDiff,
  loadBlobIntoPreview,
} from './preview-init.js';

const params = new URLSearchParams(location.search);
const id = params.get('id');
const compareId = params.get('compareId');
const modeFromQuery = params.get('mode') || 'page';
const isDiffMode = Boolean(compareId) || modeFromQuery === 'diff';

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
const editbarEl = document.querySelector('.editbar');

const toolButtons = {
  crop: document.getElementById('toolCrop'),
  blur: document.getElementById('toolBlur'),
  highlight: document.getElementById('toolHighlight'),
  text: document.getElementById('toolText'),
  shape: document.getElementById('toolShape'),
  emoji: document.getElementById('toolEmoji'),
};

const UI_CANVAS_FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const EMOJI_FONT_FAMILY = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

let currentBlob = null;
let sourceUrl = '';
let captureTimestamp = Date.now();
let settings = {
  defaultExportFormat: 'png',
  defaultPdfPageSize: 'auto',
  autoDownloadMode: 'off',
  saveAs: false,
  downloadDirectory: '',
  fitClipboardToDocsLimit: true,
};

const annotations = createAnnotationsController({
  annotationLayer,
  screenshotImg,
  imageContainer,
  toolButtons,
  clearEditsBtn,
  uiFontFamily: UI_CANVAS_FONT_FAMILY,
  emojiFontFamily: EMOJI_FONT_FAMILY,
  decodeImageToCanvas,
});

const exportController = createPreviewExportController({
  MSG,
  showToast,
  anchorDownloadBlob,
  buildPdfFromCanvas,
  sanitizeHttpUrl,
  buttons: {
    downloadPngBtn,
    downloadJpgBtn,
    downloadPdfBtn,
    copyImageBtn,
    presetEmailBtn,
    presetDocsBtn,
    presetPdfAutoBtn,
  },
  pdfPageSizeEl,
  canvasToBlob,
  buildEditedCanvas: () =>
    annotations.buildEditedCanvas({
      currentBlob,
      stampEnabled: stampOverlayEl.checked,
      sourceUrl,
      captureTimestamp,
    }),
  getCurrentBlob: () => currentBlob,
  getSettings: () => settings,
  getSourceUrl: () => sourceUrl,
  getCaptureTimestamp: () => captureTimestamp,
  showError,
});

function showError(msg) {
  loadingEl.classList.add('hidden');
  imageSkeletonEl.classList.add('hidden');
  errorMsgEl.textContent = msg;
  errorMsgEl.classList.remove('hidden');
}

async function init() {
  if (!id) {
    showError('No screenshot ID in URL.');
    return;
  }

  try {
    settings = await getUserSettings();
    pdfPageSizeEl.value = settings.defaultPdfPageSize;

    const record = await getScreenshotById(id);
    if (!record) {
      showError('Screenshot not found. It may have been deleted.');
      return;
    }

    if (isDiffMode) {
      const second = await getScreenshotById(compareId || '');
      if (!second) {
        showError('Comparison screenshot not found. It may have been deleted.');
        return;
      }
      await setupDiffPreview(record, second);
    } else {
      await setupSinglePreview(record);
    }

    if (modeFromQuery === 'diff' || isDiffMode) {
      modeNoticeEl.textContent =
        'Visual Diff active: green marks added/brighter areas, red marks removed/darker areas.';
      modeNoticeEl.classList.remove('hidden');
    } else if (modeFromQuery === 'iframe') {
      modeNoticeEl.textContent = 'Captured using same-origin iframe mode.';
      modeNoticeEl.classList.remove('hidden');
    } else if (modeFromQuery === 'element') {
      modeNoticeEl.textContent = 'Captured using inner scroll-container mode.';
      modeNoticeEl.classList.remove('hidden');
    }

    if (!isDiffMode) await exportController.maybeAutoDownload();
  } catch (err) {
    showError(`Failed to load screenshot: ${err.message}`);
  }
}

async function setupSinglePreview(record) {
  sourceUrl = record.url || '';
  captureTimestamp = record.timestamp || Date.now();
  setSourceUrlLink(sourceUrlEl, record.url || '');
  document.title = `THE Collector · ${record.title || record.url}`;
  captureTimeEl.textContent = new Date(record.timestamp).toLocaleString();
  dimensionsEl.textContent = `${record.width} × ${record.height} px`;
  await setCurrentBlob(record.blob);
}

async function setupDiffPreview(baseRecord, compareRecord) {
  disableEditingForDiff();
  const { blob, width, height } = await buildDiffBlob({
    baseBlob: baseRecord.blob,
    compareBlob: compareRecord.blob,
    decodeImageToCanvas,
    canvasToBlob,
    legendFontFamily: UI_CANVAS_FONT_FAMILY,
  });
  sourceUrl = '';
  captureTimestamp = Number(compareRecord.timestamp || Date.now());
  setSourceUrlTextForDiff(sourceUrlEl, baseRecord.url || '', compareRecord.url || '');
  document.title = `THE Collector · Diff ${baseRecord.title || baseRecord.url} vs ${compareRecord.title || compareRecord.url}`;
  captureTimeEl.textContent = `${new Date(baseRecord.timestamp).toLocaleString()} -> ${new Date(compareRecord.timestamp).toLocaleString()}`;
  dimensionsEl.textContent = `${width} × ${height} px (diff)`;
  await setCurrentBlob(blob);
}

function disableEditingForDiff() {
  if (editbarEl) editbarEl.classList.add('hidden');
  stampOverlayEl.checked = false;
  stampOverlayEl.disabled = true;
  clearEditsBtn.disabled = true;
  annotations.setTool(null);
}

async function setCurrentBlob(blob) {
  currentBlob = blob;
  annotations.markEditedCanvasDirty();
  await loadBlobIntoPreview({
    blob,
    screenshotImg,
    loadingEl,
    imageSkeletonEl,
    stageEl,
    onImageReady: ({ naturalW, naturalH }) => {
      annotations.setNaturalSize(naturalW, naturalH);
      annotations.refreshOverlayCanvas();
    },
  });
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

annotations.bindEvents();
exportController.bindEvents();
init();
