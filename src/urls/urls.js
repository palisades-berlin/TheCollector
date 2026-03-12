import { showToast } from '../shared/toast.js';
import { getRegisteredDomain, cleanUrl, normalizeUrlForCompare, isCollectibleUrl } from '../shared/url-utils.js';
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
  removeUrlMetadata,
  createUrlMutations,
  formatUrlCount,
  buildNormalizedSet,
  URL_LIMIT,
  refreshHistoryEntries,
} from '../popup/urls/urls-state.js';

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
  filterTag: document.getElementById('filterTag'),
  filterFrom: document.getElementById('filterFrom'),
  filterTo: document.getElementById('filterTo'),
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
    out = out.filter((record) => (Array.isArray(record.tags) ? record.tags : []).includes(tagFilter));
  }

  if (fromTs) out = out.filter((record) => Number(record.createdAt || 0) >= fromTs);
  if (toTs) out = out.filter((record) => Number(record.createdAt || 0) <= toTs);

  return out;
}

function renderTagFilterOptions() {
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
  const tags = Array.isArray(record.tags) ? record.tags : [];
  const tagsHtml = tags.length
    ? `<div class="url-tags">${tags.map((tag) => `<span class="sc-pill">${esc(tag)}</span>`).join('')}</div>`
    : '';
  return `
    <div class="url-row" data-url="${esc(record.url)}">
      <div class="url-main">
        <div class="url-title" title="${esc(record.url)}">${esc(record.url)}</div>
        <div class="url-meta">
          <span>${esc(getRegisteredDomain(record.url) || 'unknown')}</span>
          <span>${new Date(record.createdAt || Date.now()).toLocaleString()}</span>
        </div>
        ${tagsHtml}
      </div>
      <div class="url-actions">
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
  if (filtered.length === 0) return;

  if (activeView === 'domain') {
    renderDomainView(filtered);
    return;
  }

  els.urlList.innerHTML = filtered.map((record) => renderUrlRow(record)).join('');
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
  const urls = await loadUrls();
  const undo = await loadUndoSnapshot();
  undoCount = undo?.urls?.length || 0;
  updateHeaderCount(urls.length);
  renderTagFilterOptions();
  updateRestoreButtonState(urls.length);
  if (activeView === 'change-log') {
    historyEntries = await refreshHistoryEntries();
    renderChangeLog();
  } else {
    renderUrls();
  }
}

function reportError(err, fallback) {
  console.error('[URL Library]', err);
  showToast(fallback);
}

els.urlList.addEventListener('click', async (event) => {
  const target = event.target instanceof Element ? event.target.closest('button[data-action]') : null;
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

els.changeLogList.addEventListener('click', async (event) => {
  const target = event.target instanceof Element ? event.target.closest('button[data-history-action]') : null;
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
      showToast(snapshotCount > 0 ? `Cleared ${formatUrlCount(snapshotCount)} (undo available)` : 'List already empty');
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

reload().catch((err) => reportError(err, 'Could not load URL Library'));
