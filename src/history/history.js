import {
  listScreenshotMeta,
  listScreenshots,
  getScreenshot,
  deleteScreenshots,
} from '../shared/db.js';
import { getSettings } from '../shared/settings.js';
import { showToast } from '../shared/toast.js';
import { initLiquidUI } from '../shared/liquid.js';

const gridEl = document.getElementById('grid');
const emptyEl = document.getElementById('empty');
const loadingEl = document.getElementById('loading');
const historySkeletonEl = document.getElementById('historySkeleton');
const countEl = document.getElementById('count');
const clearAllBtn = document.getElementById('clearAllBtn');
const openFilesBtn = document.getElementById('openFilesBtn');
const cardTpl = document.getElementById('cardTpl');

const filesOverlayEl = document.getElementById('filesOverlay');
const closeFilesBtn = document.getElementById('closeFilesBtn');
const filesListEl = document.getElementById('filesList');
const filesStatusEl = document.getElementById('filesStatus');
const selectAllEl = document.getElementById('selectAll');
const selectedCountEl = document.getElementById('selectedCount');
const downloadSelectedBtn = document.getElementById('downloadSelected');
const deleteSelectedBtn = document.getElementById('deleteSelected');
const fileRowTpl = document.getElementById('fileRowTpl');

let records = [];
let groups = [];
const selectedBaseIds = new Set();
let filesOverlayClosing = false;
const THUMB_LOAD_CONCURRENCY = 4;
const thumbLoadQueue = [];
let thumbLoadWorkers = 0;
const DEBUG_THUMB_QUEUE =
  new URLSearchParams(window.location.search).get('debugThumbQueue') === '1' ||
  window.localStorage.getItem('sc_debug_thumb_queue') === '1';

init().catch((err) => {
  if (historySkeletonEl) historySkeletonEl.classList.add('hidden');
  loadingEl.classList.add('hidden');
  filesStatusEl.textContent = `Failed to load history: ${err.message}`;
  showToast(`Failed to load history: ${err.message}`, 'error', 3000);
});

async function init() {
  initLiquidUI({
    enableTilt: true,
    tiltSelector: '.card, .files-panel, .btn-action',
  });
  await refreshAll();
}

async function refreshAll() {
  try {
    records = await listScreenshotMeta();
  } catch (err) {
    // Safety net for old/partial DB schema states.
    if (String(err?.message || '').includes('object stores was not found')) {
      const full = await listScreenshots();
      records = full.map((r) => ({
        ...r,
        byteSize: r.blob?.size || 0,
      }));
    } else {
      throw err;
    }
  }
  groups = buildGroups(records);
  records.sort((a, b) => b.timestamp - a.timestamp);
  if (historySkeletonEl) historySkeletonEl.classList.add('hidden');
  loadingEl.classList.add('hidden');
  renderMainView();
  renderFilesOverlay(true);
}

function renderMainView() {
  thumbLoadQueue.length = 0;
  debugThumbQueue('reset');
  gridEl.innerHTML = '';

  if (records.length === 0) {
    emptyEl.classList.remove('hidden');
    gridEl.classList.add('hidden');
    clearAllBtn.classList.add('hidden');
    openFilesBtn.classList.add('hidden');
    countEl.textContent = '';
    return;
  }

  emptyEl.classList.add('hidden');
  gridEl.classList.remove('hidden');
  clearAllBtn.classList.remove('hidden');
  openFilesBtn.classList.remove('hidden');
  updateCount(records.length);

  for (const record of records) {
    gridEl.appendChild(buildCard(record));
  }
}

function buildCard(record) {
  const node = cardTpl.content.cloneNode(true);
  const card = node.querySelector('.card');
  const canvas = node.querySelector('.thumb-canvas');
  const urlEl = node.querySelector('.card-url');
  const metaEl = node.querySelector('.card-meta');
  const openBtn = node.querySelector('.btn-open');
  const deleteBtn = node.querySelector('.btn-delete');

  canvas.classList.remove('thumb-broken');
  enqueueThumbLoad(record.id, canvas);

  try {
    urlEl.textContent = new URL(record.url).hostname;
    urlEl.title = record.url;
  } catch {
    urlEl.textContent = record.url;
  }
  const hints = [];
  if (record.splitCount > 1 && record.splitPart > 0) {
    hints.push(`Part ${record.splitPart}/${record.splitCount}`);
  }
  if (record.stitchedFrom) hints.push('Stitched');
  const suffix = hints.length ? ` · ${hints.join(' · ')}` : '';
  metaEl.textContent =
    `${new Date(record.timestamp).toLocaleDateString()} · ${record.width}×${record.height}px${suffix}`;

  card.addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    openPreview(record.id);
  });
  openBtn.addEventListener('click', () => openPreview(record.id));
  deleteBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!confirm('Delete screenshot file? This cannot be undone.')) return;
    await deleteScreenshots([record.id]);
    await refreshAll();
  });

  return node;
}

function openPreview(id) {
  const url = chrome.runtime.getURL(`src/preview/preview.html?id=${id}`);
  chrome.tabs.create({ url });
}

function updateCount(n) {
  countEl.textContent = `· ${n} screenshot${n !== 1 ? 's' : ''}`;
}

function enqueueThumbLoad(id, canvasEl) {
  thumbLoadQueue.push({ id, canvasEl });
  debugThumbQueue('enqueue', { id });
  drainThumbLoadQueue();
}

function drainThumbLoadQueue() {
  while (thumbLoadWorkers < THUMB_LOAD_CONCURRENCY && thumbLoadQueue.length > 0) {
    const next = thumbLoadQueue.shift();
    thumbLoadWorkers++;
    debugThumbQueue('start', { id: next.id });
    loadCardThumbWhenReady(next.id, next.canvasEl)
      .catch(() => {
        const canvas = next.canvasEl;
        if (canvas?.isConnected) {
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvas.width || 1, canvas.height || 1);
          canvas.classList.add('thumb-broken');
        }
        debugThumbQueue('error', { id: next.id });
      })
      .finally(() => {
        thumbLoadWorkers--;
        debugThumbQueue('done', { id: next.id });
        drainThumbLoadQueue();
      });
  }
}

function debugThumbQueue(event, extra = {}) {
  if (!DEBUG_THUMB_QUEUE) return;
  console.debug('[Collector][HistoryThumbQueue]', {
    event,
    queueDepth: thumbLoadQueue.length,
    activeWorkers: thumbLoadWorkers,
    ...extra,
  });
}

async function loadCardThumb(id, canvasEl) {
  if (!canvasEl?.isConnected) return;
  const record = await getScreenshot(id);
  if (!record?.blob) {
    await deleteScreenshots([id]).catch(() => {});
    return;
  }
  const thumbBlob =
    record.thumbBlob instanceof Blob && record.thumbBlob.size > 0
      ? record.thumbBlob
      : record.blob;
  const bitmap = await createImageBitmap(thumbBlob);
  try {
    if (!canvasEl.isConnected) return;
    drawThumbBitmapCover(canvasEl, bitmap);
  } finally {
    if (typeof bitmap.close === 'function') bitmap.close();
  }
}

async function loadCardThumbWhenReady(id, canvasEl) {
  if (!canvasEl) return;
  // buildCard runs before insertion into the grid; wait until mounted + laid out.
  for (let i = 0; i < 10; i++) {
    if (canvasEl.isConnected && canvasEl.clientWidth > 0 && canvasEl.clientHeight > 0) {
      break;
    }
    await nextFrame();
  }
  await loadCardThumb(id, canvasEl);
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function drawThumbBitmapCover(canvas, bitmap) {
  const targetW = Math.max(1, canvas.clientWidth || 320);
  const targetH = Math.max(1, canvas.clientHeight || 240);
  const ratio = Math.max(targetW / bitmap.width, targetH / bitmap.height);
  const drawW = Math.max(1, Math.round(bitmap.width * ratio));
  const drawH = Math.max(1, Math.round(bitmap.height * ratio));
  const dx = Math.round((targetW - drawW) / 2);
  const dy = Math.round((targetH - drawH) / 2);

  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, targetW, targetH);
  ctx.drawImage(bitmap, dx, dy, drawW, drawH);
}

// ─── Files overlay ───────────────────────────────────────────────────────────

function buildGroups(allRecords) {
  return allRecords
    .map((record) => ({
      baseId: record.id,
      records: [record],
      timestamp: record.timestamp,
      previewId: record.id,
      url: record.url || '',
      totalBytes: record.byteSize || 0,
    }))
    .sort((a, b) => b.timestamp - a.timestamp);
}

function renderFilesOverlay(resetSelection = false) {
  filesListEl.innerHTML = '';
  if (resetSelection) selectedBaseIds.clear();

  for (const group of groups) {
    const node = fileRowTpl.content.cloneNode(true);
    const row = node.querySelector('.file-row');
    const check = node.querySelector('.file-check');
    const link = node.querySelector('.file-link');
    const sizeEl = node.querySelector('.file-size');
    const dateEl = node.querySelector('.file-date');

    row.dataset.baseId = group.baseId;
    check.checked = selectedBaseIds.has(group.baseId);
    check.addEventListener('change', () => {
      if (check.checked) selectedBaseIds.add(group.baseId);
      else selectedBaseIds.delete(group.baseId);
      updateSelectionUi();
    });

    const record = group.records[0];
    const hints = [];
    if (record.splitCount > 1 && record.splitPart > 0) {
      hints.push(`Part ${record.splitPart}/${record.splitCount}`);
    }
    if (record.stitchedFrom) hints.push('Stitched');
    const suffix = hints.length ? ` (${hints.join(', ')})` : '';
    link.textContent = `${group.url || '(no source URL)'}${suffix}`;
    link.title = group.url;
    link.addEventListener('click', () => openPreview(group.previewId));

    sizeEl.textContent = formatBytes(group.totalBytes);
    dateEl.textContent = new Date(group.timestamp).toLocaleString();

    filesListEl.appendChild(node);
  }

  filesStatusEl.textContent = '';
  updateSelectionUi();
}

function updateSelectionUi() {
  const selected = selectedBaseIds.size;
  selectedCountEl.textContent = `(${selected} Selected)`;
  downloadSelectedBtn.disabled = selected === 0;
  deleteSelectedBtn.disabled = selected === 0;
  selectAllEl.checked = groups.length > 0 && selected === groups.length;
  selectAllEl.indeterminate = selected > 0 && selected < groups.length;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

function blobExt(blob) {
  const type = blob?.type || '';
  if (type.includes('jpeg')) return 'jpg';
  if (type.includes('pdf')) return 'pdf';
  return 'png';
}

function sanitizeFilenameSegment(raw) {
  return String(raw || '')
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 90);
}

function sanitizeDirPath(raw) {
  if (!raw) return '';
  return String(raw)
    .replace(/\\/g, '/')
    .replace(/[^a-zA-Z0-9/_-]/g, '')
    .replace(/\.\./g, '')
    .replace(/\/{2,}/g, '/')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .slice(0, 120);
}

function buildFilename({ title, ext, directory, partIndex, partTotal }) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const safeTitle = sanitizeFilenameSegment(title) || 'screenshot';
  const suffix = partTotal > 1 ? `-part-${partIndex + 1}` : '';
  const baseName = `${safeTitle}-${ts}${suffix}.${ext}`;
  const dir = sanitizeDirPath(directory);
  return dir ? `${dir}/${baseName}` : baseName;
}

function fallbackDownload(blob, ext) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `screenshot-${Date.now()}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

async function downloadRecord(record, settings, partIndex, partTotal, titleHint, allowSaveAs) {
  const ext = blobExt(record.blob);
  const hasDownloads = await chrome.permissions.contains({ permissions: ['downloads'] });
  if (!hasDownloads) {
    fallbackDownload(record.blob, ext);
    return;
  }

  const filename = buildFilename({
    title: titleHint || record.url || record.title || 'screenshot',
    ext,
    directory: settings.downloadDirectory,
    partIndex,
    partTotal,
  });
  const url = URL.createObjectURL(record.blob);
  try {
    await chrome.downloads.download({
      url,
      filename,
      saveAs: partTotal > 1 ? false : Boolean(allowSaveAs && settings.saveAs),
    });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
}

openFilesBtn.addEventListener('click', () => {
  if (!filesOverlayEl.classList.contains('hidden')) return;
  filesOverlayEl.classList.remove('hidden');
  filesOverlayEl.classList.remove('leaving');
  filesOverlayEl.classList.add('entering');
  setTimeout(() => filesOverlayEl.classList.remove('entering'), 230);
});

closeFilesBtn.addEventListener('click', () => {
  closeFilesOverlay();
});

filesOverlayEl.addEventListener('click', (e) => {
  if (e.target === filesOverlayEl) closeFilesOverlay();
});

window.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!filesOverlayEl.classList.contains('hidden')) {
    closeFilesOverlay();
  }
});

function closeFilesOverlay() {
  if (filesOverlayEl.classList.contains('hidden')) return;
  if (filesOverlayClosing) return;
  filesOverlayClosing = true;
  filesOverlayEl.classList.remove('entering');
  filesOverlayEl.classList.add('leaving');
  setTimeout(() => {
    filesOverlayEl.classList.add('hidden');
    filesOverlayEl.classList.remove('leaving');
    filesOverlayClosing = false;
  }, 190);
}

selectAllEl.addEventListener('change', () => {
  selectedBaseIds.clear();
  if (selectAllEl.checked) {
    for (const g of groups) selectedBaseIds.add(g.baseId);
  }
  renderFilesOverlay(false);
});

downloadSelectedBtn.addEventListener('click', async () => {
  const selectedGroups = groups.filter((g) => selectedBaseIds.has(g.baseId));
  if (selectedGroups.length === 0) return;
  const totalSelectedFiles = selectedGroups.reduce(
    (sum, group) => sum + group.records.length,
    0
  );
  const allowSaveAs = totalSelectedFiles === 1;

  downloadSelectedBtn.disabled = true;
  filesStatusEl.textContent = `Downloading ${selectedGroups.length} selected item(s)…`;
  try {
    const settings = await getSettings();
    const jobs = [];
    for (const group of selectedGroups) {
      for (let idx = 0; idx < group.records.length; idx++) {
        jobs.push({
          id: group.records[idx].id,
          partIndex: idx,
          partTotal: group.records.length,
          titleHint: group.url || group.records[idx].title || 'screenshot',
        });
      }
    }
    await runWithConcurrency(jobs, 2, async (job) => {
      const fullRecord = await getScreenshot(job.id);
      if (!fullRecord?.blob) throw new Error(`Missing screenshot data: ${job.id}`);
      await downloadRecord(
        fullRecord,
        settings,
        job.partIndex,
        job.partTotal,
        job.titleHint,
        allowSaveAs
      );
    });
    filesStatusEl.textContent = 'Download completed.';
    showToast('Download completed.', 'success');
  } catch (err) {
    filesStatusEl.textContent = `Download failed: ${err.message}`;
    showToast(`Download failed: ${err.message}`, 'error', 3200);
  } finally {
    updateSelectionUi();
  }
});

deleteSelectedBtn.addEventListener('click', async () => {
  const selectedGroups = groups.filter((g) => selectedBaseIds.has(g.baseId));
  if (selectedGroups.length === 0) return;
  const total = selectedGroups.reduce((sum, g) => sum + g.records.length, 0);
  if (!confirm(`Delete ${total} screenshot file(s)? This cannot be undone.`)) return;

  try {
    const ids = selectedGroups.flatMap((group) => group.records.map((record) => record.id));
    await deleteScreenshots(ids);
    filesStatusEl.textContent = 'Selected files deleted.';
    showToast('Selected files deleted.', 'success');
    await refreshAll();
  } catch (err) {
    filesStatusEl.textContent = `Delete failed: ${err.message}`;
    showToast(`Delete failed: ${err.message}`, 'error', 3200);
    updateSelectionUi();
  }
});

clearAllBtn.addEventListener('click', async () => {
  const total = records.length;
  if (!confirm(`Delete all ${total} screenshot${total !== 1 ? 's' : ''}? This cannot be undone.`)) return;

  await deleteScreenshots(records.map((record) => record.id));
  showToast('All screenshots deleted.', 'success');
  await refreshAll();
});

async function runWithConcurrency(items, limit, worker) {
  let index = 0;
  const runners = Array.from({ length: Math.max(1, limit) }, async () => {
    while (index < items.length) {
      const current = items[index++];
      await worker(current);
    }
  });
  await Promise.all(runners);
}
