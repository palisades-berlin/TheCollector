import { showToast } from '../shared/toast.js';
import {
  getRegisteredDomain,
  cleanUrl,
  normalizeUrlForCompare,
  isCollectibleUrl,
} from '../shared/url-utils.js';
import { URL_HISTORY_ACTION } from '../shared/url-history.js';
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
  setUrlNote,
  removeUrlMetadata,
  createUrlMutations,
  formatUrlCount,
  buildNormalizedSet,
  URL_LIMIT,
  refreshHistoryEntries,
} from '../popup/urls/urls-state.js';
import { getUserSettings } from '../shared/repos/settings-repo.js';
import { canUseFeature } from '../shared/capabilities.js';

const els = {
  urlCount: document.getElementById('urlCount'),
  addBtn: document.getElementById('btn-add'),
  addAllBtn: document.getElementById('btn-add-all'),
  copyBtn: document.getElementById('btn-copy'),
  exportBtn: document.getElementById('btn-export'),
  exportCsvBtn: document.getElementById('btn-export-csv'),
  emailBtn: document.getElementById('btn-email'),
  restoreBtn: document.getElementById('btn-restore'),
  clearBtn: document.getElementById('btn-clear'),
  filterDomain: document.getElementById('filterDomain'),
  filterTagWrap: document.getElementById('filterTagWrap'),
  filterTag: document.getElementById('filterTag'),
  filterFrom: document.getElementById('filterFrom'),
  filterTo: document.getElementById('filterTo'),
  bulkActionsBar: document.getElementById('bulkActionsBar'),
  bulkSelectedCount: document.getElementById('bulkSelectedCount'),
  bulkSelectVisibleBtn: document.getElementById('bulkSelectVisibleBtn'),
  bulkClearBtn: document.getElementById('bulkClearBtn'),
  bulkCopyBtn: document.getElementById('bulkCopyBtn'),
  bulkOpenBtn: document.getElementById('bulkOpenBtn'),
  bulkExportTxtBtn: document.getElementById('bulkExportTxtBtn'),
  bulkExportCsvBtn: document.getElementById('bulkExportCsvBtn'),
  bulkDeleteBtn: document.getElementById('bulkDeleteBtn'),
  urlList: document.getElementById('urlList'),
  emptyState: document.getElementById('emptyState'),
  urlsView: document.getElementById('urlsView'),
  changeLogView: document.getElementById('changeLogView'),
  changeLogList: document.getElementById('changeLogList'),
  changeLogEmpty: document.getElementById('changeLogEmpty'),
  viewAll: document.getElementById('view-all'),
  viewStarred: document.getElementById('view-starred'),
  viewToday: document.getElementById('view-today'),
  viewDomain: document.getElementById('view-domain'),
  viewChangeLog: document.getElementById('view-change-log'),
};

let activeView = 'all';
let records = [];
let undoCount = 0;
let clearConfirmTimer = null;
let historyEntries = [];
let tagsEnabled = false;
let notesEnabled = false;
let bulkActionsEnabled = false;
const URL_NOTE_MAX = 140;
const selectedUrls = new Set();

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

const mutations = createUrlMutations({
  isHistoryViewOpen: () => activeView === 'change-log',
  onHistoryChange: (entries) => {
    historyEntries = entries;
    if (activeView === 'change-log') renderChangeLog();
  },
});

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizeDateStart(input) {
  if (!input) return null;
  const date = new Date(`${input}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function normalizeDateEnd(input) {
  if (!input) return null;
  const date = new Date(`${input}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function isSameLocalDay(a, b) {
  const aa = new Date(a);
  const bb = new Date(b);
  return (
    aa.getFullYear() === bb.getFullYear() &&
    aa.getMonth() === bb.getMonth() &&
    aa.getDate() === bb.getDate()
  );
}

function normalizeTag(input) {
  return String(input || '')
    .trim()
    .slice(0, 24);
}

function normalizeSelectionKey(url) {
  return normalizeUrlForCompare(url);
}

function getSelectedUrlList() {
  const selected = [];
  for (const record of records) {
    if (selectedUrls.has(normalizeSelectionKey(record.url))) selected.push(record.url);
  }
  return selected;
}

function syncSelectionWithRecords() {
  if (selectedUrls.size === 0) return;
  const known = new Set(records.map((record) => normalizeSelectionKey(record.url)));
  for (const key of [...selectedUrls]) {
    if (!known.has(key)) selectedUrls.delete(key);
  }
}

function getRecordByUrl(url) {
  const normalizedUrl = normalizeUrlForCompare(url);
  return records.find((record) => normalizeUrlForCompare(record.url) === normalizedUrl) || null;
}

function setActiveView(view) {
  activeView = view;
  const map = {
    all: els.viewAll,
    starred: els.viewStarred,
    today: els.viewToday,
    domain: els.viewDomain,
    'change-log': els.viewChangeLog,
  };
  for (const [key, btn] of Object.entries(map)) {
    const active = key === view;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  }
  const showChangeLog = view === 'change-log';
  els.urlsView.classList.toggle('hidden', showChangeLog);
  els.changeLogView.classList.toggle('hidden', !showChangeLog);
  if (showChangeLog) {
    renderChangeLog();
    renderBulkActions();
    return;
  }
  renderUrls();
}

function getFilteredRecords() {
  const domainFilter = (els.filterDomain.value || '').trim().toLowerCase();
  const tagFilter = (els.filterTag.value || '').trim();
  const fromTs = normalizeDateStart(els.filterFrom.value);
  const toTs = normalizeDateEnd(els.filterTo.value);
  let out = records.slice();

  if (activeView === 'starred') out = out.filter((r) => r.starred === true);
  if (activeView === 'today') out = out.filter((r) => isSameLocalDay(r.createdAt, Date.now()));

  if (domainFilter) {
    out = out.filter((record) => {
      const domain = getRegisteredDomain(record.url) || '';
      return domain.includes(domainFilter);
    });
  }

  if (tagFilter) {
    out = out.filter((record) =>
      (Array.isArray(record.tags) ? record.tags : []).includes(tagFilter)
    );
  }

  if (fromTs) out = out.filter((record) => Number(record.createdAt || 0) >= fromTs);
  if (toTs) out = out.filter((record) => Number(record.createdAt || 0) <= toTs);

  return out;
}

function renderTagFilterOptions() {
  els.filterTagWrap?.classList.toggle('hidden', !tagsEnabled);
  if (!tagsEnabled) {
    els.filterTag.value = '';
    return;
  }
  const tags = [];
  for (const record of records) {
    for (const tag of Array.isArray(record.tags) ? record.tags : []) {
      if (!tags.includes(tag)) tags.push(tag);
    }
  }
  tags.sort((a, b) => a.localeCompare(b));
  const current = els.filterTag.value;
  els.filterTag.innerHTML = `<option value="">All Tags</option>${tags
    .map((tag) => `<option value="${esc(tag)}">${esc(tag)}</option>`)
    .join('')}`;
  if (tags.includes(current)) els.filterTag.value = current;
}

function renderBulkActions() {
  const shouldShow = bulkActionsEnabled && activeView !== 'change-log';
  els.bulkActionsBar?.classList.toggle('hidden', !shouldShow);
  if (!shouldShow) return;
  const selectedCount = getSelectedUrlList().length;
  const label = `${selectedCount} selected`;
  if (els.bulkSelectedCount) els.bulkSelectedCount.textContent = label;
  const hasSelection = selectedCount > 0;
  for (const button of [
    els.bulkClearBtn,
    els.bulkCopyBtn,
    els.bulkOpenBtn,
    els.bulkExportTxtBtn,
    els.bulkExportCsvBtn,
    els.bulkDeleteBtn,
  ]) {
    if (button) button.disabled = !hasSelection;
  }
}

function renderDomainView(filtered) {
  const byDomain = new Map();
  for (const record of filtered) {
    const domain = getRegisteredDomain(record.url) || 'unknown';
    if (!byDomain.has(domain)) byDomain.set(domain, []);
    byDomain.get(domain).push(record);
  }

  const domains = [...byDomain.keys()].sort((a, b) => a.localeCompare(b));
  const chunks = [];
  for (const domain of domains) {
    chunks.push(`<div class="sc-pill">${esc(domain)} (${byDomain.get(domain).length})</div>`);
    for (const record of byDomain.get(domain)) {
      chunks.push(renderUrlRow(record));
    }
  }
  els.urlList.innerHTML = chunks.join('');
}

function renderUrlRow(record) {
  const selected = selectedUrls.has(normalizeSelectionKey(record.url));
  const tags = Array.isArray(record.tags) ? record.tags : [];
  const note = typeof record.note === 'string' ? record.note : '';
  const hasNote = note.length > 0;
  const tagsHtml = tags.length
    ? `<div class="url-tags">${tags
        .map(
          (tag) =>
            `<span class="sc-pill url-tag-chip">${esc(tag)}${
              tagsEnabled
                ? ` <button class="url-tag-remove" type="button" data-action="tag-remove" data-tag="${esc(tag)}" aria-label="Remove tag ${esc(tag)}">×</button>`
                : ''
            }</span>`
        )
        .join('')}</div>`
    : '';
  const suggestionsHtml = TAG_SUGGESTIONS.map(
    (tag) =>
      `<button class="sc-btn sc-btn-sm" type="button" data-action="tag-suggest" data-tag="${esc(tag)}">${esc(tag)}</button>`
  ).join('');
  const tagControlsHtml = tagsEnabled
    ? `<div class="url-tag-controls hidden">
        <div class="url-tag-suggestions">${suggestionsHtml}</div>
        <div class="url-tag-input-row">
          <input class="sc-input" type="text" maxlength="24" placeholder="Add tag" data-action="tag-input" />
          <button class="sc-btn sc-btn-secondary sc-btn-sm" type="button" data-action="tag-add">Add</button>
        </div>
      </div>`
    : '';
  const noteControlsHtml = notesEnabled
    ? `<div class="url-note-controls hidden">
        <textarea
          class="sc-input url-note-input"
          rows="2"
          maxlength="${URL_NOTE_MAX}"
          placeholder="Add note (max ${URL_NOTE_MAX} characters)"
          data-action="note-input"
        >${esc(note)}</textarea>
        <div class="url-note-row">
          <span class="url-note-count" data-action="note-count">${note.length}/${URL_NOTE_MAX}</span>
          <div class="url-note-actions">
            <button class="sc-btn sc-btn-secondary sc-btn-sm" type="button" data-action="note-save">Save</button>
            <button class="sc-btn sc-btn-sm" type="button" data-action="note-clear">Clear</button>
          </div>
        </div>
      </div>`
    : '';
  return `
    <div class="url-row" data-url="${esc(record.url)}">
      <div class="url-main">
        <div class="url-title" title="${esc(record.url)}">${esc(record.url)}</div>
        <div class="url-meta">
          <span>${esc(getRegisteredDomain(record.url) || 'unknown')}</span>
          <span>${new Date(record.createdAt || Date.now()).toLocaleString()}</span>
          ${notesEnabled && hasNote ? '<span class="sc-pill">Note saved</span>' : ''}
        </div>
        ${tagsHtml}
        ${tagControlsHtml}
        ${noteControlsHtml}
      </div>
      <div class="url-actions">
        ${
          bulkActionsEnabled
            ? `<label class="url-select-control"><input type="checkbox" data-action="row-select" ${selected ? 'checked' : ''} />Select</label>`
            : ''
        }
        ${
          tagsEnabled
            ? '<button class="sc-btn sc-btn-sm" data-action="toggle-tags" aria-expanded="false">Tags</button>'
            : ''
        }
        ${
          notesEnabled
            ? '<button class="sc-btn sc-btn-sm" data-action="toggle-note" aria-expanded="false">Note</button>'
            : ''
        }
        <button class="sc-btn sc-btn-sm" data-action="star" aria-pressed="${record.starred ? 'true' : 'false'}">${record.starred ? 'Unstar' : 'Star'}</button>
        <button class="sc-btn sc-btn-sm" data-action="open">Open</button>
        <button class="sc-btn sc-btn-sm sc-btn-danger" data-action="remove">Remove</button>
      </div>
    </div>`;
}

function renderUrls() {
  const filtered = getFilteredRecords();
  els.urlList.innerHTML = '';
  els.emptyState.classList.toggle('hidden', filtered.length > 0);
  if (filtered.length === 0) {
    renderBulkActions();
    return;
  }

  if (activeView === 'domain') {
    renderDomainView(filtered);
    renderBulkActions();
    return;
  }

  els.urlList.innerHTML = filtered.map((record) => renderUrlRow(record)).join('');
  renderBulkActions();
}

function renderChangeLog() {
  els.changeLogList.innerHTML = '';
  els.changeLogEmpty.classList.toggle('hidden', historyEntries.length > 0);
  if (!historyEntries.length) return;
  els.changeLogList.innerHTML = historyEntries
    .slice(0, 60)
    .map(
      (entry) => `
      <div class="change-log-row" data-history-id="${esc(entry.id)}">
        <div>
          <div><strong>${esc(entry.urls[0] || '(no URL)')}</strong></div>
          <div class="url-meta">
            <span>${new Date(entry.createdAt || Date.now()).toLocaleString()}</span>
            <span>${esc(entry.actionType || 'unknown')}</span>
            <span>${entry.urls.length} URL${entry.urls.length === 1 ? '' : 's'}</span>
          </div>
        </div>
        <div class="change-log-actions">
          <button class="sc-btn sc-btn-sm" data-history-action="restore">Restore</button>
          <button class="sc-btn sc-btn-sm" data-history-action="copy">Copy</button>
          <button class="sc-btn sc-btn-sm" data-history-action="txt">TXT</button>
          <button class="sc-btn sc-btn-sm" data-history-action="csv">CSV</button>
        </div>
      </div>`
    )
    .join('');
}

function updateHeaderCount(total) {
  els.urlCount.textContent = formatUrlCount(total);
}

function updateRestoreButtonState(total) {
  const canRestore = total < URL_LIMIT && undoCount > 0;
  els.restoreBtn.disabled = !canRestore;
}

async function reload() {
  records = await loadUrlRecords();
  syncSelectionWithRecords();
  const urls = await loadUrls();
  const undo = await loadUndoSnapshot();
  undoCount = undo?.urls?.length || 0;
  updateHeaderCount(urls.length);
  renderTagFilterOptions();
  updateRestoreButtonState(urls.length);
  if (activeView === 'change-log') {
    historyEntries = await refreshHistoryEntries();
    renderChangeLog();
    renderBulkActions();
  } else {
    renderUrls();
  }
}

function reportError(err, fallback) {
  console.error('[URL Library]', err);
  showToast(fallback);
}

function updateNoteCounter(row) {
  const input = row.querySelector('textarea[data-action="note-input"]');
  const counter = row.querySelector('[data-action="note-count"]');
  if (!input || !counter) return;
  const next = String(input.value || '').slice(0, URL_NOTE_MAX);
  if (next !== input.value) input.value = next;
  counter.textContent = `${next.length}/${URL_NOTE_MAX}`;
}

els.urlList.addEventListener('click', async (event) => {
  const rawTarget = event.target instanceof Element ? event.target : null;
  if (!rawTarget) return;
  const rowForExpand = rawTarget.closest('.url-row');
  if (
    tagsEnabled &&
    rowForExpand &&
    !rawTarget.closest('button[data-action]') &&
    !rawTarget.closest('input[data-action]')
  ) {
    const controls = rowForExpand.querySelector('.url-tag-controls');
    const toggleBtn = rowForExpand.querySelector('button[data-action="toggle-tags"]');
    if (controls && toggleBtn) {
      const nextExpanded = controls.classList.contains('hidden');
      controls.classList.toggle('hidden', !nextExpanded);
      toggleBtn.setAttribute('aria-expanded', nextExpanded ? 'true' : 'false');
    }
    return;
  }
  const target =
    event.target instanceof Element ? event.target.closest('button[data-action]') : null;
  if (!target) return;
  const row = target.closest('[data-url]');
  if (!row) return;
  const url = row.getAttribute('data-url') || '';
  const action = target.getAttribute('data-action');
  if (!action || !url) return;

  if (action === 'open') {
    openUrl(url, reportError, showToast);
    return;
  }

  if (action === 'row-select') {
    return;
  }

  if (action === 'toggle-tags') {
    const controls = row.querySelector('.url-tag-controls');
    if (!controls) return;
    const nextExpanded = controls.classList.contains('hidden');
    controls.classList.toggle('hidden', !nextExpanded);
    target.setAttribute('aria-expanded', nextExpanded ? 'true' : 'false');
    if (nextExpanded) {
      const input = controls.querySelector('input[data-action="tag-input"]');
      input?.focus();
    }
    return;
  }

  if (action === 'toggle-note') {
    const controls = row.querySelector('.url-note-controls');
    if (!controls) return;
    const nextExpanded = controls.classList.contains('hidden');
    controls.classList.toggle('hidden', !nextExpanded);
    target.setAttribute('aria-expanded', nextExpanded ? 'true' : 'false');
    if (nextExpanded) {
      const input = controls.querySelector('textarea[data-action="note-input"]');
      input?.focus();
      updateNoteCounter(row);
    }
    return;
  }

  if (action === 'tag-suggest' || action === 'tag-add' || action === 'tag-remove') {
    try {
      const record = getRecordByUrl(url);
      const existingTags = Array.isArray(record?.tags)
        ? record.tags.map(normalizeTag).filter(Boolean)
        : [];
      let nextTags = [...existingTags];

      if (action === 'tag-suggest') {
        const tag = normalizeTag(target.getAttribute('data-tag'));
        if (!tag) return;
        if (nextTags.includes(tag)) {
          showToast('Tag already added');
          return;
        }
        if (nextTags.length >= 10) {
          showToast('Tag limit reached (max 10)');
          return;
        }
        nextTags.push(tag);
      }

      if (action === 'tag-add') {
        const input = row.querySelector('input[data-action="tag-input"]');
        const tag = normalizeTag(input?.value);
        if (!tag) {
          showToast('Enter a tag');
          return;
        }
        if (nextTags.includes(tag)) {
          showToast('Tag already added');
          return;
        }
        if (nextTags.length >= 10) {
          showToast('Tag limit reached (max 10)');
          return;
        }
        nextTags.push(tag);
      }

      if (action === 'tag-remove') {
        const tagToRemove = normalizeTag(target.getAttribute('data-tag'));
        nextTags = nextTags.filter((tag) => tag !== tagToRemove);
      }

      await setUrlTags(url, nextTags);
      await reload();
      showToast('Tags updated');
    } catch (err) {
      reportError(err, 'Could not update tags');
    }
    return;
  }

  if (action === 'note-save' || action === 'note-clear') {
    try {
      const input = row.querySelector('textarea[data-action="note-input"]');
      if (!input) return;
      const nextNote = action === 'note-clear' ? '' : String(input.value || '').trim();
      await setUrlNote(url, nextNote);
      await reload();
      showToast(action === 'note-clear' ? 'Note cleared' : 'Note saved');
    } catch (err) {
      reportError(err, 'Could not update note');
    }
    return;
  }

  if (action === 'star') {
    try {
      const next = target.getAttribute('aria-pressed') !== 'true';
      await setUrlStar(url, next);
      await reload();
      showToast(next ? 'Added to Starred' : 'Removed from Starred');
    } catch (err) {
      reportError(err, 'Could not update starred state');
    }
    return;
  }

  if (action === 'remove') {
    try {
      const before = await loadUrls();
      const urls = await mutations.mutateUrls(
        (current) => {
          const idx = current.indexOf(url);
          if (idx !== -1) current.splice(idx, 1);
          return current;
        },
        URL_HISTORY_ACTION.REMOVE_ONE,
        { source: 'url-library', operation: 'remove', removedUrl: url }
      );
      if (urls.length < before.length) await removeUrlMetadata(url);
      await reload();
      showToast('URL removed');
    } catch (err) {
      reportError(err, 'Could not remove URL');
    }
  }
});

els.urlList.addEventListener('change', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target || target.getAttribute('data-action') !== 'row-select') return;
  const row = target.closest('.url-row');
  if (!row) return;
  const url = row.getAttribute('data-url') || '';
  const key = normalizeSelectionKey(url);
  if (!key) return;
  const checked = target instanceof HTMLInputElement && target.checked;
  if (checked) selectedUrls.add(key);
  else selectedUrls.delete(key);
  renderBulkActions();
});

els.urlList.addEventListener('keydown', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target || target.getAttribute('data-action') !== 'tag-input') return;
  if (event.key !== 'Enter') return;
  event.preventDefault();
  const row = target.closest('.url-row');
  if (!row) return;
  const addButton = row.querySelector('button[data-action="tag-add"]');
  addButton?.click();
});

els.urlList.addEventListener('input', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target || target.getAttribute('data-action') !== 'note-input') return;
  const row = target.closest('.url-row');
  if (!row) return;
  updateNoteCounter(row);
});

els.changeLogList.addEventListener('click', async (event) => {
  const target =
    event.target instanceof Element ? event.target.closest('button[data-history-action]') : null;
  if (!target) return;
  const row = target.closest('[data-history-id]');
  if (!row) return;
  const historyId = row.getAttribute('data-history-id') || '';
  const action = target.getAttribute('data-history-action');
  const entry = historyEntries.find((item) => item.id === historyId);
  if (!entry) return;

  try {
    if (action === 'restore') {
      const result = await mutations.restoreUrlsFromHistory(historyId);
      if (result?.restored) {
        await reload();
        showToast(`Restored ${formatUrlCount(result.restoredCount || 0)}`);
      }
      return;
    }
    if (action === 'copy') {
      await copyUrlsToClipboard(entry.urls || []);
      showToast(`Copied ${formatUrlCount((entry.urls || []).length)}`);
      return;
    }
    if (action === 'txt') {
      await exportUrlsAsTxt(entry.urls || []);
      showToast('Saved snapshot as TXT');
      return;
    }
    if (action === 'csv') {
      await exportUrlsAsCsv(entry.urls || []);
      showToast('Saved snapshot as CSV');
    }
  } catch (err) {
    reportError(err, 'Could not complete Change Log action');
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (activeView !== 'change-log') return;
  setActiveView('all');
  els.viewChangeLog.blur();
  els.viewAll.focus();
});

els.viewAll.addEventListener('click', () => setActiveView('all'));
els.viewStarred.addEventListener('click', () => setActiveView('starred'));
els.viewToday.addEventListener('click', () => setActiveView('today'));
els.viewDomain.addEventListener('click', () => setActiveView('domain'));
els.viewChangeLog.addEventListener('click', async () => {
  historyEntries = await refreshHistoryEntries();
  setActiveView('change-log');
});

for (const input of [els.filterDomain, els.filterTag, els.filterFrom, els.filterTo]) {
  input.addEventListener('input', () => renderUrls());
  input.addEventListener('change', () => renderUrls());
}

async function initFeatureVisibility() {
  try {
    const settings = await getUserSettings();
    tagsEnabled = canUseFeature('url_tags', settings);
    notesEnabled = canUseFeature('url_notes', settings);
    bulkActionsEnabled = canUseFeature('url_bulk_actions', settings);
  } catch {
    tagsEnabled = false;
    notesEnabled = false;
    bulkActionsEnabled = false;
  }
}

els.bulkSelectVisibleBtn?.addEventListener('click', () => {
  for (const record of getFilteredRecords()) {
    const key = normalizeSelectionKey(record.url);
    if (key) selectedUrls.add(key);
  }
  renderUrls();
});

els.bulkClearBtn?.addEventListener('click', () => {
  selectedUrls.clear();
  renderUrls();
});

els.bulkCopyBtn?.addEventListener('click', async () => {
  try {
    const urls = getSelectedUrlList();
    if (!urls.length) {
      showToast('Nothing selected');
      return;
    }
    await copyUrlsToClipboard(urls);
    showToast(`Copied ${formatUrlCount(urls.length)}`);
  } catch (err) {
    reportError(err, 'Could not copy selected URLs');
  }
});

els.bulkOpenBtn?.addEventListener('click', () => {
  const urls = getSelectedUrlList();
  if (!urls.length) {
    showToast('Nothing selected');
    return;
  }
  for (const url of urls) openUrl(url, reportError, showToast);
  showToast(`Opened ${formatUrlCount(urls.length)}`);
});

els.bulkExportTxtBtn?.addEventListener('click', async () => {
  try {
    const urls = getSelectedUrlList();
    if (!urls.length) {
      showToast('Nothing selected');
      return;
    }
    await exportUrlsAsTxt(urls, 'selected-urls.txt');
    showToast(`Saved ${formatUrlCount(urls.length)} as TXT`);
  } catch (err) {
    reportError(err, 'Could not export selected URLs');
  }
});

els.bulkExportCsvBtn?.addEventListener('click', async () => {
  try {
    const urls = getSelectedUrlList();
    if (!urls.length) {
      showToast('Nothing selected');
      return;
    }
    await exportUrlsAsCsv(urls, 'selected-urls.csv');
    showToast(`Saved ${formatUrlCount(urls.length)} as CSV`);
  } catch (err) {
    reportError(err, 'Could not export selected URLs');
  }
});

els.bulkDeleteBtn?.addEventListener('click', async () => {
  try {
    const urlsToRemove = getSelectedUrlList();
    if (!urlsToRemove.length) {
      showToast('Nothing selected');
      return;
    }
    const keys = new Set(urlsToRemove.map((url) => normalizeSelectionKey(url)).filter(Boolean));
    await mutations.mutateUrls(
      (current) =>
        current.filter((url) => {
          const key = normalizeSelectionKey(url);
          return !keys.has(key);
        }),
      URL_HISTORY_ACTION.UNKNOWN,
      { source: 'url-library', operation: 'remove_bulk', removedCount: urlsToRemove.length }
    );
    for (const url of urlsToRemove) {
      await removeUrlMetadata(url);
      selectedUrls.delete(normalizeSelectionKey(url));
    }
    await reload();
    showToast(`Removed ${formatUrlCount(urlsToRemove.length)}`);
  } catch (err) {
    reportError(err, 'Could not remove selected URLs');
  }
});

els.addBtn.addEventListener('click', async () => {
  try {
    const raw = await getCurrentTabUrl();
    if (!isCollectibleUrl(raw)) {
      showToast('Cannot collect this page');
      return;
    }
    const clean = cleanUrl(raw);
    let added = false;
    const urls = await mutations.mutateUrls(
      (current) => {
        if (current.length >= URL_LIMIT) return current;
        const known = buildNormalizedSet(current);
        const normalized = normalizeUrlForCompare(clean);
        if (known.has(normalized)) return current;
        current.push(clean);
        added = true;
        return current;
      },
      URL_HISTORY_ACTION.ADD_CURRENT,
      { source: 'url-library', mode: 'current_tab' }
    );
    if (!added) {
      showToast(urls.length >= URL_LIMIT ? `List full (max ${URL_LIMIT} URLs)` : 'Already in list');
      return;
    }
    await reload();
    showToast('URL added');
  } catch (err) {
    reportError(err, 'Could not add current tab URL');
  }
});

els.addAllBtn.addEventListener('click', async () => {
  try {
    const rawUrls = await getAllTabUrls();
    const validUrls = rawUrls.filter(isCollectibleUrl);
    if (!validUrls.length) {
      showToast('No collectible tabs found');
      return;
    }
    let added = 0;
    await mutations.mutateUrls(
      (current) => {
        const known = buildNormalizedSet(current);
        for (const raw of validUrls) {
          if (current.length >= URL_LIMIT) break;
          const clean = cleanUrl(raw);
          const normalized = normalizeUrlForCompare(clean);
          if (!known.has(normalized)) {
            current.push(clean);
            known.add(normalized);
            added += 1;
          }
        }
        return current;
      },
      URL_HISTORY_ACTION.ADD_ALL_TABS,
      { source: 'url-library', mode: 'window_tabs', requestedCount: validUrls.length }
    );
    await reload();
    showToast(added === 0 ? 'All tabs already in list' : `Added ${formatUrlCount(added)}`);
  } catch (err) {
    reportError(err, 'Could not add tab URLs');
  }
});

els.copyBtn.addEventListener('click', async () => {
  try {
    const urls = await loadUrls();
    if (!urls.length) {
      showToast('Nothing to copy');
      return;
    }
    await copyUrlsToClipboard(urls);
    showToast('Copied');
  } catch (err) {
    reportError(err, 'Clipboard access denied');
  }
});

els.exportBtn.addEventListener('click', async () => {
  try {
    const urls = await loadUrls();
    if (!urls.length) {
      showToast('Nothing to export');
      return;
    }
    await exportUrlsAsTxt(urls);
    showToast(`Saved ${formatUrlCount(urls.length)} as TXT`);
  } catch (err) {
    reportError(err, 'Could not export TXT');
  }
});

els.exportCsvBtn.addEventListener('click', async () => {
  try {
    const urls = await loadUrls();
    if (!urls.length) {
      showToast('Nothing to export');
      return;
    }
    await exportUrlsAsCsv(urls);
    showToast(`Saved ${formatUrlCount(urls.length)} as CSV`);
  } catch (err) {
    reportError(err, 'Could not export CSV');
  }
});

els.emailBtn.addEventListener('click', async () => {
  try {
    const urls = await loadUrls();
    if (!urls.length) {
      showToast('Nothing to email');
      return;
    }
    const body = encodeURIComponent(urls.join('\n'));
    window.location.href = `mailto:?subject=Collected URLs&body=${body}`;
  } catch (err) {
    reportError(err, 'Could not open email client');
  }
});

els.clearBtn.addEventListener('click', async () => {
  try {
    if (clearConfirmTimer) {
      clearTimeout(clearConfirmTimer);
      clearConfirmTimer = null;
      const { snapshotCount } = await mutations.clearUrlsWithUndoSnapshot();
      await reload();
      showToast(
        snapshotCount > 0
          ? `Cleared ${formatUrlCount(snapshotCount)} (undo available)`
          : 'List already empty'
      );
      els.clearBtn.textContent = 'Clear All';
      els.clearBtn.classList.remove('confirming');
      return;
    }
    els.clearBtn.textContent = 'Confirm Clear';
    els.clearBtn.classList.add('confirming');
    clearConfirmTimer = setTimeout(() => {
      clearConfirmTimer = null;
      els.clearBtn.textContent = 'Clear All';
      els.clearBtn.classList.remove('confirming');
    }, 2000);
  } catch (err) {
    reportError(err, 'Could not clear URLs');
  }
});

els.restoreBtn.addEventListener('click', async () => {
  try {
    const result = await mutations.restoreUrlsFromSnapshot();
    if (!result?.restored) {
      showToast('Nothing to restore');
      return;
    }
    await reload();
    showToast(`Restored ${formatUrlCount(result.restoredCount || 0)}`);
  } catch (err) {
    reportError(err, 'Could not restore URLs');
  }
});

void (async () => {
  await initFeatureVisibility();
  await reload();
})().catch((err) => reportError(err, 'Could not load URL Library'));
