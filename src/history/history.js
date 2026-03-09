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
import { applySavedTheme } from '../shared/theme.js';
import { getUserSettings } from '../shared/repos/settings-repo.js';
import { canUseFeature } from '../shared/capabilities.js';
import {
  buildCaptureProfileUsageSummary,
  sanitizeCaptureProfileId,
} from '../shared/capture-profiles.js';

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
const filterProfileEl = document.getElementById('filterProfile');
const filterProfileItemEl = document.getElementById('filterProfileItem');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');
const profileUsageSummaryEl = document.getElementById('profileUsageSummary');
const profileUsageResearchEl = document.getElementById('profileUsageResearch');
const profileUsageInterestEl = document.getElementById('profileUsageInterest');
const profileUsagePrivateEl = document.getElementById('profileUsagePrivate');
const profileUsageUnknownWrapEl = document.getElementById('profileUsageUnknownWrap');
const profileUsageUnknownEl = document.getElementById('profileUsageUnknown');

const filesOverlayEl = document.getElementById('filesOverlay');
const closeFilesBtn = document.getElementById('closeFilesBtn');
const filesListEl = document.getElementById('filesList');
const filesStatusEl = document.getElementById('filesStatus');
const selectAllEl = document.getElementById('selectAll');
const selectedCountEl = document.getElementById('selectedCount');
const downloadSelectedBtn = document.getElementById('downloadSelected');
const deleteSelectedBtn = document.getElementById('deleteSelected');
const fileRowTpl = document.getElementById('fileRowTpl');
const DISMISSED_DIAGNOSTIC_STORAGE_KEY = 'history.dismissedCaptureDiagnosticKey';
let allRecords = [];
let records = [];
let groups = [];
let captureReports = [];
let dismissedCaptureDiagnosticKey = loadDismissedDiagnosticKey();
let canUseBulkActions = false;
const compareSelection = [];
const DEBUG_THUMB_QUEUE =
  new URLSearchParams(window.location.search).get('debugThumbQueue') === '1' ||
  window.localStorage.getItem('sc_debug_thumb_queue') === '1';

function logNonFatal(context, err) {
  if (window.localStorage.getItem('sc_debug_non_fatal') !== '1') return;
  console.debug('[THE Collector][non-fatal]', context, err);
}

function loadDismissedDiagnosticKey() {
  try {
    return String(window.localStorage.getItem(DISMISSED_DIAGNOSTIC_STORAGE_KEY) || '');
  } catch {
    return '';
  }
}

function persistDismissedDiagnosticKey(key) {
  dismissedCaptureDiagnosticKey = String(key || '');
  try {
    if (dismissedCaptureDiagnosticKey) {
      window.localStorage.setItem(DISMISSED_DIAGNOSTIC_STORAGE_KEY, dismissedCaptureDiagnosticKey);
    } else {
      window.localStorage.removeItem(DISMISSED_DIAGNOSTIC_STORAGE_KEY);
    }
  } catch {
    // Non-fatal: diagnostics dismissal still works for this session via in-memory state.
  }
}

function maybeShowQueueCompletionToast() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('queueCompleted') !== '1') return;
  const total = Math.max(0, Number(params.get('total') || 0));
  const success = Math.max(0, Number(params.get('success') || 0));
  const failed = Math.max(0, Number(params.get('failed') || 0));
  if (total <= 0) return;
  showToast(
    `Queue finished: ${success} succeeded, ${failed} failed.`,
    failed > 0 ? 'info' : 'success'
  );
  params.delete('queueCompleted');
  params.delete('total');
  params.delete('success');
  params.delete('failed');
  const nextQuery = params.toString();
  const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}`;
  window.history.replaceState({}, '', nextUrl);
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
  records = filterRecords(
    allRecords,
    filters.getFilters(),
    getRecordDomain,
    getRecordExportType,
    getRecordProfileId
  );
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
  filterProfileEl,
  resetFiltersBtn,
  onChange: (resetSelection) => applyFiltersAndRender(resetSelection),
});

function getRecordProfileId(record) {
  return sanitizeCaptureProfileId(
    record?.captureProfileId || record?.captureReport?.profileId || ''
  );
}

function renderProfileUsageSummary(showProfiles) {
  if (!profileUsageSummaryEl) return;
  profileUsageSummaryEl.classList.toggle('hidden', !showProfiles);
  if (!showProfiles) return;

  const summary = buildCaptureProfileUsageSummary(allRecords);
  if (profileUsageResearchEl)
    profileUsageResearchEl.textContent = String(summary.byProfile.research || 0);
  if (profileUsageInterestEl)
    profileUsageInterestEl.textContent = String(summary.byProfile.interest || 0);
  if (profileUsagePrivateEl)
    profileUsagePrivateEl.textContent = String(summary.byProfile.private || 0);
  if (profileUsageUnknownEl) profileUsageUnknownEl.textContent = String(summary.unknown || 0);
  if (profileUsageUnknownWrapEl) {
    profileUsageUnknownWrapEl.classList.toggle('hidden', Number(summary.unknown || 0) <= 0);
  }
}

function renderMainView() {
  thumbLoader.resetQueue();
  gridEl.innerHTML = '';
  const hasAnyRecords = allRecords.length > 0;

  if (records.length === 0) {
    emptyEl.classList.remove('hidden');
    gridEl.classList.add('hidden');
    clearAllBtn.classList.toggle('hidden', !hasAnyRecords);
    openFilesBtn.classList.toggle('hidden', !hasAnyRecords || !canUseBulkActions);
    compareBtn.classList.toggle('hidden', !hasAnyRecords);
    updateCompareUi();
    updateCount(0, allRecords.length);
    return;
  }

  emptyEl.classList.add('hidden');
  gridEl.classList.remove('hidden');
  clearAllBtn.classList.remove('hidden');
  openFilesBtn.classList.toggle('hidden', !canUseBulkActions);
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
    persistDismissedDiagnosticKey('');
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
  persistDismissedDiagnosticKey(captureDiagnosticsDismissEl.getAttribute('data-key') || '');
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
  gridEl.setAttribute('aria-busy', 'true');
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
  renderProfileUsageSummary(!filterProfileItemEl?.classList.contains('hidden'));
  renderMainView();
  filesOverlay.renderFilesOverlay(true);
  gridEl.setAttribute('aria-busy', 'false');
}

async function init() {
  await applySavedTheme();
  maybeShowQueueCompletionToast();
  try {
    const settings = await getUserSettings();
    const showProfileFilter = canUseFeature('smart_save_profiles', settings || {});
    canUseBulkActions = canUseFeature('bulk_actions_v1', settings || {});
    filterProfileItemEl?.classList.toggle('hidden', !showProfileFilter);
    renderProfileUsageSummary(showProfileFilter);
    openFilesBtn?.classList.toggle('hidden', !canUseBulkActions);
  } catch (err) {
    logNonFatal('loadHistorySettings', err);
    canUseBulkActions = false;
    filterProfileItemEl?.classList.add('hidden');
    renderProfileUsageSummary(false);
    openFilesBtn?.classList.add('hidden');
  }
  filters.wireFilters();
  filesOverlay.wireEvents();
  await refreshAll();
}

init().catch((err) => {
  if (historySkeletonEl) historySkeletonEl.classList.add('hidden');
  loadingEl.classList.add('hidden');
  filesStatusEl.textContent = `Failed to load history: ${err.message}`;
  gridEl.setAttribute('aria-busy', 'false');
  showToast(`Failed to load history: ${err.message}`, 'error', 3000);
});
