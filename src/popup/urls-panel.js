import { showToast } from '../shared/toast.js';
import { cleanUrl, normalizeUrlForCompare, isCollectibleUrl } from '../shared/url-utils.js';
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
  createUrlMutations,
  formatUrlCount,
  buildNormalizedSet,
  URL_LIMIT,
} from './urls/urls-state.js';

let initialized = false;
let currentUrlCount = 0;
let undoUrlCount = 0;
let clearConfirmTimer = null;

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
const openLibraryBtn = document.getElementById('btn-open-url-library');

const mutations = createUrlMutations({
  isHistoryViewOpen: () => false,
  onHistoryChange: () => {},
});

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

function updateRestoreButtonState() {
  const canRestore = currentUrlCount < URL_LIMIT && undoUrlCount > 0;
  restoreBtn.disabled = !canRestore;
  restoreBtn.title = canRestore
    ? `Restore ${formatUrlCount(undoUrlCount)} from last clear`
    : 'Restore is available after clearing URLs';
}

async function refreshUndoState() {
  const snapshot = await loadUndoSnapshot();
  undoUrlCount = snapshot?.urls?.length || 0;
  updateRestoreButtonState();
}

function createRecentUrlItemEl(record) {
  const url = typeof record?.url === 'string' ? record.url : String(record || '');
  const starred = record?.starred === true;
  const item = document.createElement('div');
  item.className = 'url-item compact-url-item';
  item.dataset.url = url;
  item.innerHTML = `
    <span class="url-index"></span>
    <div class="url-main">
      <span class="url-text" title="${esc(url)}">${esc(url)}</span>
    </div>
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
  `;
  return item;
}

async function renderList() {
  const [urls, records] = await Promise.all([loadUrls(), loadUrlRecords()]);
  currentUrlCount = urls.length;
  updateBadge(currentUrlCount);

  const byNormalized = new Map(records.map((record) => [normalizeUrlForCompare(record.url), record]));
  const recent = urls
    .slice()
    .reverse()
    .map((url) => byNormalized.get(normalizeUrlForCompare(url)) || { url, starred: false })
    .slice(0, 5);

  urlListEl.innerHTML = '';
  if (!recent.length) {
    urlListEl.style.display = 'none';
    emptyStateEl.style.display = 'flex';
  } else {
    urlListEl.style.display = 'block';
    emptyStateEl.style.display = 'none';
    const fragment = document.createDocumentFragment();
    recent.forEach((record, index) => {
      const item = createRecentUrlItemEl(record);
      item.querySelector('.url-index').textContent = String(index + 1);
      fragment.appendChild(item);
    });
    urlListEl.appendChild(fragment);
  }

  await refreshUndoState();
}

function resetClearButton() {
  clearBtn.classList.remove('confirming');
  clearBtn.textContent = 'Clear All';
}

function wireListEvents() {
  urlListEl.addEventListener('click', async (event) => {
    const target = event.target instanceof Element ? event.target.closest('button[data-action]') : null;
    if (!target) return;
    const row = target.closest('.url-item');
    if (!row) return;
    const url = row.dataset.url || '';
    const action = target.dataset.action;

    if (action === 'open') {
      openUrl(url, reportError, showToast);
      return;
    }

    if (action === 'star') {
      try {
        const nextStarred = target.getAttribute('aria-pressed') !== 'true';
        await setUrlStar(url, nextStarred);
        await renderList();
        showToast(nextStarred ? 'Added to Starred' : 'Removed from Starred');
      } catch (err) {
        reportError(err, 'Could not update starred state');
      }
    }
  });
}

function wirePrimaryEvents() {
  addBtn.addEventListener('click', async () => {
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
        { source: 'popup', mode: 'current_tab' }
      );

      if (!added) {
        showToast(urls.length >= URL_LIMIT ? `List full (max ${URL_LIMIT} URLs)` : 'Already in list');
        return;
      }
      await renderList();
      showToast('URL added');
    } catch (err) {
      reportError(err, 'Could not add current tab URL');
    }
  });

  addAllBtn.addEventListener('click', async () => {
    try {
      const rawUrls = await getAllTabUrls();
      const validUrls = rawUrls.filter(isCollectibleUrl);
      if (validUrls.length === 0) {
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
        { source: 'popup', mode: 'window_tabs', requestedCount: validUrls.length }
      );

      await renderList();
      showToast(added === 0 ? 'All tabs already in list' : `Added ${formatUrlCount(added)}`);
    } catch (err) {
      reportError(err, 'Could not add tab URLs');
    }
  });

  copyBtn.addEventListener('click', async () => {
    try {
      const urls = await loadUrls();
      if (urls.length === 0) {
        showToast('Nothing to copy');
        return;
      }
      await copyUrlsToClipboard(urls);
      showToast('Copied');
    } catch (err) {
      reportError(err, 'Clipboard access denied');
    }
  });

  exportBtn.addEventListener('click', async () => {
    try {
      const urls = await loadUrls();
      if (urls.length === 0) {
        showToast('Nothing to export');
        return;
      }
      await exportUrlsAsTxt(urls);
      showToast(`Saved ${formatUrlCount(urls.length)} as TXT`);
    } catch (err) {
      reportError(err, 'Could not export TXT');
    }
  });

  exportCsvBtn.addEventListener('click', async () => {
    try {
      const urls = await loadUrls();
      if (urls.length === 0) {
        showToast('Nothing to export');
        return;
      }
      await exportUrlsAsCsv(urls);
      showToast(`Saved ${formatUrlCount(urls.length)} as CSV`);
    } catch (err) {
      reportError(err, 'Could not export CSV');
    }
  });

  emailBtn.addEventListener('click', async () => {
    try {
      const urls = await loadUrls();
      if (urls.length === 0) {
        showToast('Nothing to email');
        return;
      }
      const body = encodeURIComponent(urls.join('\n'));
      window.location.href = `mailto:?subject=Collected URLs&body=${body}`;
    } catch (err) {
      reportError(err, 'Could not open email client');
    }
  });

  clearBtn.addEventListener('click', async () => {
    try {
      if (clearConfirmTimer) {
        clearTimeout(clearConfirmTimer);
        clearConfirmTimer = null;
        const result = await mutations.clearUrlsWithUndoSnapshot();
        await renderList();
        showToast(
          result.snapshotCount > 0
            ? `Cleared ${formatUrlCount(result.snapshotCount)} (undo available)`
            : 'List already empty'
        );
        resetClearButton();
        return;
      }

      clearBtn.classList.add('confirming');
      clearBtn.textContent = 'Confirm Clear';
      clearConfirmTimer = setTimeout(() => {
        clearConfirmTimer = null;
        resetClearButton();
      }, 2000);
    } catch (err) {
      reportError(err, 'Could not clear URLs');
      resetClearButton();
    }
  });

  restoreBtn.addEventListener('click', async () => {
    try {
      const result = await mutations.restoreUrlsFromSnapshot();
      if (!result?.restored) {
        showToast('Nothing to restore');
        return;
      }
      await renderList();
      showToast(`Restored ${formatUrlCount(result.restoredCount || 0)}`);
    } catch (err) {
      reportError(err, 'Could not restore URLs');
    }
  });

  openLibraryBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/urls/urls.html') });
    window.close();
  });
}

export async function initUrlsPanel() {
  if (initialized) return;
  initialized = true;
  wireListEvents();
  wirePrimaryEvents();
  await renderList();
}
