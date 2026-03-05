import { showToast } from '../shared/toast.js';
import {
  listScreenshotMetaRecords,
  listScreenshotRecords,
  getScreenshotById,
  deleteScreenshotRecords,
  loadCaptureReports as loadCaptureReportsFromRepo,
} from '../shared/repos/screenshot-repo.js';
import {
  getRecordDomain,
  getRecordExportType,
  buildGroups,
  formatDuration,
} from './history-utils.js';
import { createHistoryFilters, filterRecords } from './history-filters.js';
import { createThumbLoader } from './history-thumbs.js';
import { createHistoryCards } from './history-cards.js';
import { createHistoryFilesOverlay } from './history-files-overlay.js';

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
const compareBtn = document.getElementById('compareBtn');
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
let allRecords = [];
let records = [];
let groups = [];
let captureReports = [];
let dismissedCaptureDiagnosticKey = '';
const compareSelection = [];
const DEBUG_THUMB_QUEUE =
  new URLSearchParams(window.location.search).get('debugThumbQueue') === '1' ||
  window.localStorage.getItem('sc_debug_thumb_queue') === '1';

function logNonFatal(context, err) {
  if (window.localStorage.getItem('sc_debug_non_fatal') !== '1') return;
  console.debug('[THE Collector][non-fatal]', context, err);
}

function openPreview(id) {
  const url = chrome.runtime.getURL(`src/preview/preview.html?id=${id}`);
  chrome.tabs.create({ url });
}

function openDiffPreview(baseId, compareId) {
  const url = chrome.runtime.getURL(
    `src/preview/preview.html?id=${encodeURIComponent(baseId)}&compareId=${encodeURIComponent(compareId)}&mode=diff`
  );
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

function updateCompareUi() {
  const selected = compareSelection.length;
  if (compareBtn) {
    compareBtn.textContent = `Compare (${selected}/2)`;
    compareBtn.disabled = selected !== 2;
  }
}

function toggleCompareSelection(id) {
  const idx = compareSelection.indexOf(id);
  if (idx !== -1) {
    compareSelection.splice(idx, 1);
    renderMainView();
    updateCompareUi();
    return;
  }
  compareSelection.push(id);
  if (compareSelection.length > 2) compareSelection.shift();
  renderMainView();
  updateCompareUi();
}

const thumbLoader = createThumbLoader({
  getScreenshot: getScreenshotById,
  deleteScreenshots: deleteScreenshotRecords,
  logNonFatal,
  debugEnabled: DEBUG_THUMB_QUEUE,
  concurrency: 4,
});

const cards = createHistoryCards({
  cardTpl,
  enqueueThumbLoad: (id, canvasEl) => thumbLoader.enqueue(id, canvasEl),
  openPreview,
  deleteScreenshots: deleteScreenshotRecords,
  refreshAll: () => refreshAll(),
  compareSelection,
  toggleCompareSelection,
});

const filesOverlay = createHistoryFilesOverlay({
  els: {
    filesOverlayEl,
    openFilesBtn,
    closeFilesBtn,
    filesListEl,
    filesStatusEl,
    selectAllEl,
    selectedCountEl,
    downloadSelectedBtn,
    deleteSelectedBtn,
    fileRowTpl,
  },
  getGroups: () => groups,
  getAllRecords: () => allRecords,
  getScreenshot: getScreenshotById,
  deleteScreenshots: deleteScreenshotRecords,
  openPreview,
  refreshAll: () => refreshAll(),
});

function applyFilters() {
  records = filterRecords(allRecords, filters.getFilters(), getRecordDomain, getRecordExportType);
  groups = buildGroups(records);
  compareSelection.length = 0;
}

function applyFiltersAndRender(resetSelection = false) {
  applyFilters();
  renderMainView();
  filesOverlay.renderFilesOverlay(resetSelection);
}

const filters = createHistoryFilters({
  filterDomainEl,
  filterFromEl,
  filterToEl,
  filterTypeEl,
  resetFiltersBtn,
  onChange: (resetSelection) => applyFiltersAndRender(resetSelection),
});

function renderMainView() {
  thumbLoader.resetQueue();
  gridEl.innerHTML = '';
  const hasAnyRecords = allRecords.length > 0;

  if (records.length === 0) {
    emptyEl.classList.remove('hidden');
    gridEl.classList.add('hidden');
    clearAllBtn.classList.toggle('hidden', !hasAnyRecords);
    openFilesBtn.classList.toggle('hidden', !hasAnyRecords);
    compareBtn.classList.toggle('hidden', !hasAnyRecords);
    updateCompareUi();
    updateCount(0, allRecords.length);
    return;
  }

  emptyEl.classList.add('hidden');
  gridEl.classList.remove('hidden');
  clearAllBtn.classList.remove('hidden');
  openFilesBtn.classList.remove('hidden');
  compareBtn.classList.remove('hidden');
  updateCount(records.length, allRecords.length);

  const fragment = document.createDocumentFragment();
  for (const record of records) {
    fragment.appendChild(cards.buildCard(record));
  }
  gridEl.appendChild(fragment);
  updateCompareUi();
}

async function loadCaptureReports() {
  try {
    return await loadCaptureReportsFromRepo();
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
    Number(lastFailed.durationMs || 0) > 0 ? ` after ${formatDuration(lastFailed.durationMs)}` : '';
  const tilePart =
    Number(lastFailed.totalTiles || 0) > 0
      ? ` (${Number(lastFailed.capturedTiles || 0)}/${Number(lastFailed.totalTiles || 0)} tiles captured)`
      : '';
  if (captureDiagnosticsTextEl) {
    captureDiagnosticsTextEl.textContent = buildFriendlyCaptureFailureText({
      error: lastFailed.error,
      durationPart,
      tilePart,
    });
  }
  captureDiagnosticsDismissEl?.setAttribute('data-key', diagnosticKey);
  captureDiagnosticsEl.classList.remove('hidden');
}

function buildFriendlyCaptureFailureText({ error, durationPart, tilePart }) {
  const message = String(error || '').trim();
  const lower = message.toLowerCase();
  const details = `Latest capture didn’t complete${durationPart}${tilePart}.`;

  if (
    lower.includes('chrome://') ||
    lower.includes('edge://') ||
    (lower.includes('cannot access') && lower.includes('url'))
  ) {
    return `${details} This page is restricted by the browser. Open a regular website tab and try again.`;
  }

  if (lower.includes('already running')) {
    return `${details} Another capture is already in progress for this tab. Wait a moment, then retry.`;
  }

  if (lower.includes('target') && (lower.includes('changed') || lower.includes('mismatch'))) {
    return `${details} The page layout changed during capture. Let the page settle, then try again.`;
  }

  if (lower.includes('quota') || lower.includes('max_capture_visible_tab_calls_per_second')) {
    return `${details} The browser temporarily rate-limited capture requests. Please retry in a few seconds.`;
  }

  if (!message) {
    return `${details} Please try again on the same tab.`;
  }

  return `${details} ${message}`;
}

captureDiagnosticsDismissEl?.addEventListener('click', () => {
  dismissedCaptureDiagnosticKey = captureDiagnosticsDismissEl.getAttribute('data-key') || '';
  captureDiagnosticsEl?.classList.add('hidden');
});

clearAllBtn.addEventListener('click', async () => {
  const total = allRecords.length;
  if (!confirm(`Delete all ${total} screenshot${total !== 1 ? 's' : ''}? This cannot be undone.`))
    return;

  await deleteScreenshotRecords(allRecords.map((record) => record.id));
  showToast('All screenshots deleted.', 'success');
  await refreshAll();
});

compareBtn?.addEventListener('click', () => {
  if (compareSelection.length !== 2) return;
  const [first, second] = compareSelection;
  openDiffPreview(first, second);
});

async function refreshAll() {
  captureReports = await loadCaptureReports();
  try {
    allRecords = await listScreenshotMetaRecords();
  } catch (err) {
    if (String(err?.message || '').includes('object stores was not found')) {
      const full = await listScreenshotRecords();
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
  filesOverlay.renderFilesOverlay(true);
}

async function init() {
  filters.wireFilters();
  filesOverlay.wireEvents();
  await refreshAll();
}

init().catch((err) => {
  if (historySkeletonEl) historySkeletonEl.classList.add('hidden');
  loadingEl.classList.add('hidden');
  filesStatusEl.textContent = `Failed to load history: ${err.message}`;
  showToast(`Failed to load history: ${err.message}`, 'error', 3000);
});
