import { showToast } from '../shared/toast.js';
import { formatUrlCount } from './urls/urls-state.js';
import {
  loadUrls,
  loadUndoSnapshot,
  getCurrentTabUrl,
  getAllTabUrls,
  openUrl,
  exportUrlsAsTxt,
  exportUrlsAsCsv,
  copyUrlsToClipboard,
  refreshHistoryEntries,
  createUrlMutations,
} from './urls/urls-state.js';
import { createUrlsHistoryView } from './urls/urls-history-view.js';
import { wireUrlsPanelEvents } from './urls/urls-actions.js';

const POPUP_DEBUG =
  new URLSearchParams(location.search).get('debugPopupPerf') === '1' ||
  window.localStorage.getItem('sc_debug_popup_perf') === '1';

let initialized = false;
let clearConfirmTimer = null;
let currentUrlCount = 0;
let undoUrlCount = 0;
let initStartedAt = 0;

const urlCount = document.getElementById('urlCount');
const urlListEl = document.getElementById('url-list');
const emptyStateEl = document.getElementById('empty-state');
const addBtn = document.getElementById('btn-add');
const addAllBtn = document.getElementById('btn-add-all');
const copyBtn = document.getElementById('btn-copy');
const exportBtn = document.getElementById('btn-export');
const exportCsvBtn = document.getElementById('btn-export-csv');
const emailBtn = document.getElementById('btn-email');
const restoreBtn = document.getElementById('btn-restore');
const clearBtn = document.getElementById('btn-clear');
const urlHistoryBtn = document.getElementById('btn-url-history');
const urlsMainViewEl = document.getElementById('urlsMainView');
const urlsHistoryViewEl = document.getElementById('urlsHistoryView');
const urlHistoryBackBtn = document.getElementById('btn-url-history-back');
const urlHistoryClearBtn = document.getElementById('btn-url-history-clear');
const urlHistoryListEl = document.getElementById('url-history-list');
const urlHistoryEmptyEl = document.getElementById('url-history-empty');
const urlHistoryMoreBtn = document.getElementById('btn-url-history-more');

function perfLog(label, extra = {}) {
  if (!POPUP_DEBUG) return;
  const sinceUrlsInitMs = initStartedAt
    ? Number((performance.now() - initStartedAt).toFixed(1))
    : null;
  console.debug('[THE Collector][PopupPerf]', { label, sinceUrlsInitMs, ...extra });
}

function reportError(err, userMessage) {
  console.error(err);
  showToast(userMessage);
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function updateBadge(count) {
  urlCount.textContent = formatUrlCount(count);
}

function createUrlItemEl(url) {
  const item = document.createElement('div');
  item.className = 'url-item';
  item.dataset.url = url;
  item.innerHTML = `
    <span class="url-index"></span>
    <span class="url-text" title="${esc(url)}">${esc(url)}</span>
    <button class="btn-open" title="Open in new tab" aria-label="Open URL" data-action="open">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
      </svg>
    </button>
    <button class="btn-remove" title="Remove" aria-label="Remove URL" data-action="remove">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    </button>
  `;
  return item;
}

let actionsApi = null;

function renderList(urls) {
  const startedAt = performance.now();
  currentUrlCount = urls.length;
  updateBadge(urls.length);

  if (urls.length === 0) {
    urlListEl.style.display = 'none';
    emptyStateEl.style.display = 'flex';
    actionsApi?.updateRestoreButtonState();
    return;
  }

  urlListEl.style.display = 'block';
  emptyStateEl.style.display = 'none';
  urlListEl.innerHTML = '';
  const fragment = document.createDocumentFragment();
  urls.forEach((url, i) => {
    const item = createUrlItemEl(url);
    item.querySelector('.url-index').textContent = String(i + 1);
    fragment.appendChild(item);
  });
  urlListEl.appendChild(fragment);
  actionsApi?.updateRestoreButtonState();
  perfLog('urls.renderList', {
    count: urls.length,
    durationMs: Number((performance.now() - startedAt).toFixed(1)),
  });
}

export async function initUrlsPanel() {
  if (initialized) return;

  const historyView = createUrlsHistoryView({
    urlsMainViewEl,
    urlsHistoryViewEl,
    urlHistoryListEl,
    urlHistoryEmptyEl,
    urlHistoryMoreBtn,
  });

  const mutations = createUrlMutations({
    isHistoryViewOpen: () => !urlsHistoryViewEl.classList.contains('hidden'),
    onHistoryChange: (entries) => {
      historyView.setEntries(entries);
      historyView.renderHistoryList();
    },
  });

  const state = {
    loadUrls,
    loadUndoSnapshot,
    getCurrentTabUrl,
    getAllTabUrls,
    openUrl,
    exportUrlsAsTxt,
    exportUrlsAsCsv,
    copyUrlsToClipboard,
    refreshHistoryEntries,
    mutations,
  };

  initStartedAt = performance.now();
  perfLog('urls.init.start');
  initialized = true;

  actionsApi = wireUrlsPanelEvents({
    els: {
      urlListEl,
      addBtn,
      addAllBtn,
      copyBtn,
      exportBtn,
      exportCsvBtn,
      emailBtn,
      restoreBtn,
      clearBtn,
      urlHistoryBtn,
      urlHistoryBackBtn,
      urlHistoryClearBtn,
      urlHistoryListEl,
      urlHistoryMoreBtn,
    },
    getCurrentUrlCount: () => currentUrlCount,
    getUndoUrlCount: () => undoUrlCount,
    setUndoUrlCount: (count) => {
      undoUrlCount = Number(count || 0);
    },
    renderList,
    reportError,
    state,
    historyView,
    setClearConfirmTimer: (timer) => {
      clearConfirmTimer = timer;
    },
    getClearConfirmTimer: () => clearConfirmTimer,
  });

  const initialUrls = await loadUrls();
  renderList(initialUrls);
  await actionsApi.refreshUndoState();
  historyView.showHistoryView(false);
  perfLog('urls.init.done', { count: initialUrls.length });
}
