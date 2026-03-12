import { showToast } from '../shared/toast.js';
import { getRegisteredDomain } from '../shared/url-utils.js';
import { getUserSettings } from '../shared/repos/settings-repo.js';
import { canUseFeature } from '../shared/capabilities.js';
import { formatUrlCount } from './urls/urls-state.js';
import {
  loadUrls,
  loadUrlRecords,
  loadUndoSnapshot,
  getCurrentTabUrl,
  getAllTabUrls,
  openUrl,
  exportUrlsAsTxt,
  exportUrlsAsCsv,
  copyUrlsToClipboard,
  setUrlStar,
  setUrlTags,
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
let savedViewsEnabled = false;
let tagsEnabled = false;
let activeUrlView = 'all';
let activeTagFilter = '';
let urlRecordsCache = [];
let renderVersion = 0;

const TAG_SUGGESTIONS = [
  'Research',
  'Interest',
  'Private',
  'reading',
  'follow-up',
  'reference',
  'archive',
  'later',
];

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
const urlViewsBar = document.getElementById('urlViewsBar');
const urlViewAllBtn = document.getElementById('btn-url-view-all');
const urlViewStarredBtn = document.getElementById('btn-url-view-starred');
const urlViewTodayBtn = document.getElementById('btn-url-view-today');
const urlViewDomainBtn = document.getElementById('btn-url-view-domain');
const urlTagFilterRow = document.getElementById('urlTagFilterRow');
const urlTagFilterSelect = document.getElementById('urlTagFilterSelect');

let actionsApi = null;

function perfLog(label, extra = {}) {
  if (!POPUP_DEBUG) return;
  const sinceUrlsInitMs = initStartedAt
    ? Number((performance.now() - initStartedAt).toFixed(1))
    : null;
  console.debug('[THE Collector][PopupPerf]', { label, sinceUrlsInitMs, ...extra });
}

function reportError(err, userMessage) {
  console.error('[THE Collector][non-fatal]', 'urls panel action', err);
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

function createUrlItemEl(record) {
  const url = typeof record?.url === 'string' ? record.url : String(record || '');
  const starred = record?.starred === true;
  const tags = Array.isArray(record?.tags) ? record.tags : [];
  const tagChipsHtml =
    tags.length === 0
      ? '<span class="url-tag-chip-empty">No tags</span>'
      : tags
          .map(
            (tag) => `
        <span class="url-tag-chip">
          <span>${esc(tag)}</span>
          <button
            class="url-tag-chip-remove"
            type="button"
            data-action="tag-remove"
            data-tag="${esc(tag)}"
            aria-label="Remove tag ${esc(tag)}"
            title="Remove tag ${esc(tag)}"
          >
            ×
          </button>
        </span>`
          )
          .join('');
  const tagSuggestionsHtml = TAG_SUGGESTIONS.map(
    (tag) => `
      <button
        class="url-tag-suggest-btn sc-btn sc-btn-ghost"
        type="button"
        data-action="tag-suggest"
        data-tag="${esc(tag)}"
      >
        ${esc(tag)}
      </button>`
  ).join('');
  const item = document.createElement('div');
  item.className = 'url-item';
  item.dataset.url = url;
  item.innerHTML = `
    <span class="url-index"></span>
    <div class="url-main">
      <span class="url-text" title="${esc(url)}">${esc(url)}</span>
      ${
        tagsEnabled
          ? `<div class="url-tag-row">${tagChipsHtml}</div>
      <div class="url-tags-editor hidden">
        <div class="url-tag-suggestions">${tagSuggestionsHtml}</div>
        <div class="url-tag-input-row">
          <input
            class="url-tag-input sc-input"
            type="text"
            maxlength="24"
            placeholder="Add tag"
            data-action="tag-input"
            aria-label="Add tag"
          />
          <button class="url-tag-add sc-btn sc-btn-secondary" type="button" data-action="tag-add">
            Add
          </button>
        </div>
      </div>`
          : ''
      }
    </div>
    ${
      tagsEnabled
        ? `<button
      class="url-tags-toggle"
      type="button"
      title="Edit tags"
      aria-label="Edit tags"
      data-action="toggle-tags"
      aria-expanded="false"
    >
      #
    </button>`
        : ''
    }
    <button
      class="btn-star ${starred ? 'active' : ''}"
      title="${starred ? 'Remove from Starred' : 'Add to Starred'}"
      aria-label="${starred ? 'Remove from Starred' : 'Add to Starred'}"
      aria-pressed="${starred ? 'true' : 'false'}"
      data-action="star"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
      </svg>
    </button>
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

function isSameLocalDay(a, b) {
  const aDate = new Date(a);
  const bDate = new Date(b);
  return (
    aDate.getFullYear() === bDate.getFullYear() &&
    aDate.getMonth() === bDate.getMonth() &&
    aDate.getDate() === bDate.getDate()
  );
}

function normalizeTagValue(input) {
  return String(input || '')
    .trim()
    .slice(0, 24);
}

function getTagFilterOptions(records) {
  const out = [];
  for (const record of records) {
    const tags = Array.isArray(record?.tags) ? record.tags : [];
    for (const tag of tags) {
      const normalized = normalizeTagValue(tag);
      if (!normalized) continue;
      if (out.includes(normalized)) continue;
      out.push(normalized);
    }
  }
  return out.sort((a, b) => a.localeCompare(b));
}

function syncTagFilterControls(records) {
  if (!urlTagFilterRow || !urlTagFilterSelect) return;
  urlTagFilterRow.classList.toggle('hidden', !tagsEnabled);
  if (!tagsEnabled) {
    activeTagFilter = '';
    return;
  }
  const options = getTagFilterOptions(records);
  const current = activeTagFilter;
  urlTagFilterSelect.innerHTML = `<option value="">All Tags</option>${options
    .map((tag) => `<option value="${esc(tag)}">${esc(tag)}</option>`)
    .join('')}`;
  const preserve = options.includes(current) ? current : '';
  activeTagFilter = preserve;
  urlTagFilterSelect.value = preserve;
}

function getRecordsForCurrentView() {
  let records = urlRecordsCache;
  if (savedViewsEnabled && activeUrlView === 'starred') {
    records = records.filter((record) => record.starred === true);
  } else if (savedViewsEnabled && activeUrlView === 'today') {
    const now = Date.now();
    records = records.filter((record) => isSameLocalDay(record.createdAt, now));
  }
  if (tagsEnabled && activeTagFilter) {
    records = records.filter((record) =>
      (Array.isArray(record.tags) ? record.tags : []).some((tag) => tag === activeTagFilter)
    );
  }
  return records;
}

function setActiveUrlView(view) {
  activeUrlView = view;
  if (!savedViewsEnabled) return;
  const map = {
    all: urlViewAllBtn,
    starred: urlViewStarredBtn,
    today: urlViewTodayBtn,
    domain: urlViewDomainBtn,
  };
  for (const [key, btn] of Object.entries(map)) {
    if (!btn) continue;
    const active = key === view;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  }
}

function renderDomainGroupedList(records) {
  const byDomain = new Map();
  for (const record of records) {
    const domain = getRegisteredDomain(record.url) || 'unknown';
    if (!byDomain.has(domain)) byDomain.set(domain, []);
    byDomain.get(domain).push(record);
  }

  const fragment = document.createDocumentFragment();
  const sortedDomains = [...byDomain.keys()].sort((a, b) => a.localeCompare(b));
  let index = 1;
  for (const domain of sortedDomains) {
    const title = document.createElement('div');
    title.className = 'url-group-title';
    title.textContent = `${domain} (${byDomain.get(domain).length})`;
    fragment.appendChild(title);

    for (const record of byDomain.get(domain)) {
      const item = createUrlItemEl(record);
      item.querySelector('.url-index').textContent = String(index++);
      fragment.appendChild(item);
    }
  }
  urlListEl.appendChild(fragment);
}

function renderCurrentView() {
  const records = getRecordsForCurrentView();
  urlListEl.innerHTML = '';
  if (records.length === 0) {
    urlListEl.style.display = 'none';
    emptyStateEl.style.display = 'flex';
    const labels = {
      all: 'No URLs collected yet',
      starred: 'No starred URLs yet',
      today: 'No URLs saved today',
      domain: 'No URLs available by domain',
    };
    const titleEl = emptyStateEl.querySelector('.empty-title');
    if (titleEl) {
      const base = labels[activeUrlView] || labels.all;
      titleEl.textContent = activeTagFilter ? `No URLs match tag "${activeTagFilter}"` : base;
    }
    actionsApi?.updateRestoreButtonState();
    return;
  }

  urlListEl.style.display = 'block';
  emptyStateEl.style.display = 'none';

  if (savedViewsEnabled && activeUrlView === 'domain') {
    renderDomainGroupedList(records);
  } else {
    const fragment = document.createDocumentFragment();
    records.forEach((record, i) => {
      const item = createUrlItemEl(record);
      item.querySelector('.url-index').textContent = String(i + 1);
      fragment.appendChild(item);
    });
    urlListEl.appendChild(fragment);
  }
  actionsApi?.updateRestoreButtonState();
}

function renderList(urls) {
  const startedAt = performance.now();
  currentUrlCount = urls.length;
  updateBadge(urls.length);
  const seq = ++renderVersion;
  void loadUrlRecords()
    .then((records) => {
      if (seq !== renderVersion) return;
      urlRecordsCache = records;
      syncTagFilterControls(records);
      renderCurrentView();
      perfLog('urls.renderList', {
        count: urls.length,
        durationMs: Number((performance.now() - startedAt).toFixed(1)),
        view: activeUrlView,
      });
    })
    .catch((err) => reportError(err, 'Could not render URL list'));
}

async function initSavedViewsFeature() {
  try {
    const settings = await getUserSettings();
    savedViewsEnabled = canUseFeature('saved_url_views', settings);
    tagsEnabled = canUseFeature('url_tags', settings);
  } catch {
    savedViewsEnabled = false;
    tagsEnabled = false;
  }

  if (!urlViewsBar) return;
  urlViewsBar.classList.toggle('hidden', !savedViewsEnabled);
  if (urlTagFilterRow) urlTagFilterRow.classList.toggle('hidden', !tagsEnabled);
  setActiveUrlView('all');
  activeTagFilter = '';

  if (!savedViewsEnabled && !tagsEnabled) return;

  const viewMap = [
    ['all', urlViewAllBtn],
    ['starred', urlViewStarredBtn],
    ['today', urlViewTodayBtn],
    ['domain', urlViewDomainBtn],
  ];

  for (const [view, button] of viewMap) {
    button?.addEventListener('click', () => {
      setActiveUrlView(view);
      renderCurrentView();
    });
  }

  urlTagFilterSelect?.addEventListener('change', () => {
    activeTagFilter = normalizeTagValue(urlTagFilterSelect.value);
    renderCurrentView();
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
    loadUrlRecords,
    setUrlStar,
    setUrlTags,
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

  await initSavedViewsFeature();
  const initialUrls = await loadUrls();
  renderList(initialUrls);
  await actionsApi.refreshUndoState();
  historyView.showHistoryView(false);
  perfLog('urls.init.done', { count: initialUrls.length });
}
