import {
  listScreenshotMeta,
  listScreenshots,
  getScreenshot,
  deleteScreenshots,
} from '../shared/db.js';
import { getSettings } from '../shared/settings.js';
import { showToast } from '../shared/toast.js';
import { downloadRecord } from './history-downloads.js';
import {
  getRecordDomain,
  getRecordExportType,
  buildGroups,
  buildRecordHints,
  formatDuration,
  buildCardDiagnosticText,
  formatBytes,
  runWithConcurrency,
} from './history-utils.js';

const gridEl = document.getElementById('grid');
const emptyEl = document.getElementById('empty');
const loadingEl = document.getElementById('loading');
const historySkeletonEl = document.getElementById('historySkeleton');
const captureDiagnosticsEl = document.getElementById('captureDiagnostics');
const captureDiagnosticsTextEl = document.getElementById('captureDiagnosticsText');
const captureDiagnosticsDismissEl = document.getElementById('captureDiagnosticsDismiss');
const countEl = document.getElementById('count');
const clearAllBtn = document.getElementById('clearAllBtn');
const openFilesBtn = document.getElementById('openFilesBtn');
const cardTpl = document.getElementById('cardTpl');
const filterDomainEl = document.getElementById('filterDomain');
const filterFromEl = document.getElementById('filterFrom');
const filterToEl = document.getElementById('filterTo');
const filterTypeEl = document.getElementById('filterType');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');

const filesOverlayEl = document.getElementById('filesOverlay');
const closeFilesBtn = document.getElementById('closeFilesBtn');
const filesListEl = document.getElementById('filesList');
const filesStatusEl = document.getElementById('filesStatus');
const selectAllEl = document.getElementById('selectAll');
const selectedCountEl = document.getElementById('selectedCount');
const downloadSelectedBtn = document.getElementById('downloadSelected');
const deleteSelectedBtn = document.getElementById('deleteSelected');
const fileRowTpl = document.getElementById('fileRowTpl');
const CAPTURE_REPORTS_KEY = 'captureReports';

let allRecords = [];
let records = [];
let groups = [];
const selectedBaseIds = new Set();
let filesOverlayClosing = false;
const THUMB_LOAD_CONCURRENCY = 4;
const thumbLoadQueue = [];
let thumbLoadWorkers = 0;
let captureReports = [];
let dismissedCaptureDiagnosticKey = '';
let filterDomainTimer = null;
const filters = {
  domain: '',
  fromDate: '',
  toDate: '',
  type: 'all',
};
const DEBUG_THUMB_QUEUE =
  new URLSearchParams(window.location.search).get('debugThumbQueue') === '1' ||
  window.localStorage.getItem('sc_debug_thumb_queue') === '1';

function logNonFatal(context, err) {
  if (window.localStorage.getItem('sc_debug_non_fatal') !== '1') return;
  console.debug('[THE Collector][non-fatal]', context, err);
}

init().catch((err) => {
  if (historySkeletonEl) historySkeletonEl.classList.add('hidden');
  loadingEl.classList.add('hidden');
  filesStatusEl.textContent = `Failed to load history: ${err.message}`;
  showToast(`Failed to load history: ${err.message}`, 'error', 3000);
});

async function init() {
  wireFilters();
  await refreshAll();
}

async function refreshAll() {
  captureReports = await loadCaptureReports();
  try {
    allRecords = await listScreenshotMeta();
  } catch (err) {
    // Safety net for old/partial DB schema states.
    if (String(err?.message || '').includes('object stores was not found')) {
      const full = await listScreenshots();
      allRecords = full.map((r) => ({
        ...r,
        byteSize: r.blob?.size || 0,
        blobType: r.blobType || r.blob?.type || 'image/png',
      }));
    } else {
      throw err;
    }
  }
  allRecords.sort((a, b) => b.timestamp - a.timestamp);
  applyFilters();
  if (historySkeletonEl) historySkeletonEl.classList.add('hidden');
  loadingEl.classList.add('hidden');
  renderCaptureDiagnostics();
  renderMainView();
  renderFilesOverlay(true);
}

function wireFilters() {
  filterDomainEl.addEventListener('input', () => {
    if (filterDomainTimer) clearTimeout(filterDomainTimer);
    filterDomainTimer = setTimeout(() => {
      filters.domain = String(filterDomainEl.value || '').trim().toLowerCase();
      applyFiltersAndRender();
      filterDomainTimer = null;
    }, 150);
  });
  filterFromEl.addEventListener('change', () => {
    filters.fromDate = filterFromEl.value || '';
    applyFiltersAndRender();
  });
  filterToEl.addEventListener('change', () => {
    filters.toDate = filterToEl.value || '';
    applyFiltersAndRender();
  });
  filterTypeEl.addEventListener('change', () => {
    filters.type = filterTypeEl.value || 'all';
    applyFiltersAndRender();
  });
  resetFiltersBtn.addEventListener('click', () => {
    if (filterDomainTimer) {
      clearTimeout(filterDomainTimer);
      filterDomainTimer = null;
    }
    filterDomainEl.value = '';
    filterFromEl.value = '';
    filterToEl.value = '';
    filterTypeEl.value = 'all';
    filters.domain = '';
    filters.fromDate = '';
    filters.toDate = '';
    filters.type = 'all';
    applyFiltersAndRender(true);
  });
}

function applyFiltersAndRender(resetSelection = false) {
  applyFilters();
  renderMainView();
  renderFilesOverlay(resetSelection);
}

function applyFilters() {
  const fromTs = filters.fromDate
    ? new Date(`${filters.fromDate}T00:00:00`).getTime()
    : null;
  const toTs = filters.toDate
    ? new Date(`${filters.toDate}T23:59:59.999`).getTime()
    : null;
  records = allRecords.filter((record) => {
    if (filters.domain) {
      const domain = getRecordDomain(record);
      if (!domain.includes(filters.domain)) return false;
    }
    if (fromTs !== null && Number(record.timestamp || 0) < fromTs) return false;
    if (toTs !== null && Number(record.timestamp || 0) > toTs) return false;
    if (filters.type !== 'all' && getRecordExportType(record) !== filters.type) return false;
    return true;
  });
  groups = buildGroups(records);
  selectedBaseIds.clear();
}

function renderMainView() {
  thumbLoadQueue.length = 0;
  debugThumbQueue('reset');
  gridEl.innerHTML = '';
  const hasAnyRecords = allRecords.length > 0;

  if (records.length === 0) {
    emptyEl.classList.remove('hidden');
    gridEl.classList.add('hidden');
    clearAllBtn.classList.toggle('hidden', !hasAnyRecords);
    openFilesBtn.classList.toggle('hidden', !hasAnyRecords);
    updateCount(0, allRecords.length);
    return;
  }

  emptyEl.classList.add('hidden');
  gridEl.classList.remove('hidden');
  clearAllBtn.classList.remove('hidden');
  openFilesBtn.classList.remove('hidden');
  updateCount(records.length, allRecords.length);

  const fragment = document.createDocumentFragment();
  for (const record of records) {
    fragment.appendChild(buildCard(record));
  }
  gridEl.appendChild(fragment);
}

function buildCard(record) {
  const node = cardTpl.content.cloneNode(true);
  const card = node.querySelector('.card');
  const canvas = node.querySelector('.thumb-canvas');
  const urlEl = node.querySelector('.card-url');
  const metaEl = node.querySelector('.card-meta');
  const diagnosticEl = node.querySelector('.card-diagnostic');
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
  const hints = buildRecordHints(record);
  const suffix = hints.length ? ` · ${hints.join(' · ')}` : '';
  metaEl.textContent =
    `${new Date(record.timestamp).toLocaleDateString()} · ${record.width}×${record.height}px${suffix}`;
  const diagnosticText = buildCardDiagnosticText(record);
  if (diagnosticText) {
    diagnosticEl.textContent = diagnosticText;
    diagnosticEl.classList.remove('hidden');
  } else {
    diagnosticEl.classList.add('hidden');
  }

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

async function loadCaptureReports() {
  try {
    const state = await chrome.storage.local.get({ [CAPTURE_REPORTS_KEY]: [] });
    return Array.isArray(state[CAPTURE_REPORTS_KEY]) ? state[CAPTURE_REPORTS_KEY] : [];
  } catch (err) {
    logNonFatal('loadCaptureReports', err);
    return [];
  }
}

function renderCaptureDiagnostics() {
  if (!captureDiagnosticsEl) return;
  const lastFailed = captureReports.find((r) => r && r.ok === false && r.error);
  if (!lastFailed) {
    captureDiagnosticsEl.classList.add('hidden');
    if (captureDiagnosticsTextEl) captureDiagnosticsTextEl.textContent = '';
    dismissedCaptureDiagnosticKey = '';
    return;
  }
  const diagnosticKey = `${lastFailed.timestamp || ''}|${lastFailed.error || ''}`;
  if (dismissedCaptureDiagnosticKey === diagnosticKey) {
    captureDiagnosticsEl.classList.add('hidden');
    return;
  }
  const durationPart =
    Number(lastFailed.durationMs || 0) > 0
      ? ` after ${formatDuration(lastFailed.durationMs)}`
      : '';
  const tilePart =
    Number(lastFailed.totalTiles || 0) > 0
      ? ` (${Number(lastFailed.capturedTiles || 0)}/${Number(lastFailed.totalTiles || 0)} tiles captured)`
      : '';
  if (captureDiagnosticsTextEl) {
    captureDiagnosticsTextEl.textContent =
      `Last capture failed${durationPart}${tilePart}: ${lastFailed.error}`;
  }
  captureDiagnosticsDismissEl?.setAttribute('data-key', diagnosticKey);
  captureDiagnosticsEl.classList.remove('hidden');
}

captureDiagnosticsDismissEl?.addEventListener('click', () => {
  dismissedCaptureDiagnosticKey = captureDiagnosticsDismissEl.getAttribute('data-key') || '';
  captureDiagnosticsEl?.classList.add('hidden');
});

function openPreview(id) {
  const url = chrome.runtime.getURL(`src/preview/preview.html?id=${id}`);
  chrome.tabs.create({ url });
}

function updateCount(filtered, total) {
  if (total === 0) {
    countEl.textContent = '';
    return;
  }
  if (total > filtered) {
    countEl.textContent = `· ${filtered} of ${total} screenshots`;
    return;
  }
  countEl.textContent = `· ${filtered} screenshot${filtered !== 1 ? 's' : ''}`;
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
  console.debug('[THE Collector][HistoryThumbQueue]', {
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
    await deleteScreenshots([id]).catch((err) => logNonFatal('deleteScreenshots', err));
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

function renderFilesOverlay(resetSelection = false) {
  filesListEl.innerHTML = '';
  if (resetSelection) selectedBaseIds.clear();

  const fragment = document.createDocumentFragment();
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
    const hints = buildRecordHints(record);
    const suffix = hints.length ? ` (${hints.join(', ')})` : '';
    link.textContent = `${group.url || '(no source URL)'}${suffix}`;
    link.title = group.url;
    link.addEventListener('click', () => openPreview(group.previewId));

    sizeEl.textContent = formatBytes(group.totalBytes);
    dateEl.textContent = new Date(group.timestamp).toLocaleString();

    fragment.appendChild(node);
  }
  filesListEl.appendChild(fragment);

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
      await downloadRecord({
        record: fullRecord,
        settings,
        partIndex: job.partIndex,
        partTotal: job.partTotal,
        titleHint: job.titleHint,
        allowSaveAs,
      });
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
  const total = allRecords.length;
  if (!confirm(`Delete all ${total} screenshot${total !== 1 ? 's' : ''}? This cannot be undone.`)) return;

  await deleteScreenshots(allRecords.map((record) => record.id));
  showToast('All screenshots deleted.', 'success');
  await refreshAll();
});
