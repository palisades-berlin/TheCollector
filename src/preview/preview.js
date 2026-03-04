import { getScreenshot } from '../shared/db.js';

const params = new URLSearchParams(location.search);
const id = params.get('id');

const screenshotImg = document.getElementById('screenshot');
const imageContainer = document.getElementById('imageContainer');
const loadingEl = document.getElementById('loading');
const errorMsgEl = document.getElementById('errorMsg');
const sourceUrlEl = document.getElementById('sourceUrl');
const captureTimeEl = document.getElementById('captureTime');
const dimensionsEl = document.getElementById('dimensions');
const downloadPngBtn = document.getElementById('downloadPng');
const downloadJpgBtn = document.getElementById('downloadJpg');

let currentBlob = null;
let zoomed = false;

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  if (!id) {
    showError('No screenshot ID in URL.');
    return;
  }

  try {
    const record = await getScreenshot(id);
    if (!record) {
      showError('Screenshot not found. It may have been deleted.');
      return;
    }

    currentBlob = record.blob;
    const objectUrl = URL.createObjectURL(record.blob);

    screenshotImg.src = objectUrl;
    screenshotImg.onload = () => {
      loadingEl.classList.add('hidden');
      screenshotImg.classList.remove('hidden');
    };

    // Populate toolbar metadata
    sourceUrlEl.textContent = record.url;
    sourceUrlEl.href = record.url;
    document.title = `screen-collector · ${record.title || record.url}`;

    const date = new Date(record.timestamp);
    captureTimeEl.textContent = date.toLocaleString();
    dimensionsEl.textContent = `${record.width} × ${record.height} px`;
  } catch (err) {
    showError(`Failed to load screenshot: ${err.message}`);
  }
}

function showError(msg) {
  loadingEl.classList.add('hidden');
  errorMsgEl.textContent = msg;
  errorMsgEl.classList.remove('hidden');
}

// ─── Zoom toggle ──────────────────────────────────────────────────────────────

imageContainer.addEventListener('click', (e) => {
  // Only toggle when clicking the image itself
  if (e.target !== screenshotImg) return;
  zoomed = !zoomed;
  screenshotImg.classList.toggle('fit', !zoomed);
  screenshotImg.classList.toggle('full', zoomed);
  imageContainer.classList.toggle('zoomed', zoomed);
});

// ─── Downloads ────────────────────────────────────────────────────────────────

downloadPngBtn.addEventListener('click', () => {
  if (!currentBlob) return;
  triggerDownload(URL.createObjectURL(currentBlob), `screenshot-${Date.now()}.png`);
});

downloadJpgBtn.addEventListener('click', async () => {
  if (!currentBlob) return;

  // Re-encode PNG → JPG via canvas
  const img = new Image();
  img.src = URL.createObjectURL(currentBlob);
  await new Promise((resolve) => (img.onload = resolve));

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext('2d').drawImage(img, 0, 0);

  canvas.toBlob(
    (blob) => {
      if (blob) triggerDownload(URL.createObjectURL(blob), `screenshot-${Date.now()}.jpg`);
    },
    'image/jpeg',
    0.92
  );
});

function triggerDownload(href, filename) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

init();
