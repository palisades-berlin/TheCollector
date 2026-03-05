import { showToast } from '../shared/toast.js';
import {
  cleanUrl,
  normalizeUrlForCompare,
  isCollectibleUrl,
  escapeCsvCell,
} from '../shared/url-utils.js';
import { canRestoreUrls } from '../shared/url-list-state.js';

const URL_LIMIT = 500;
const URL_UNDO_KEY = 'urlsUndoSnapshot';
const POPUP_DEBUG =
  new URLSearchParams(location.search).get('debugPopupPerf') === '1' ||
  window.localStorage.getItem('sc_debug_popup_perf') === '1';

let initialized = false;
let clearConfirmTimer = null;
let urlMutationQueue = Promise.resolve();
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

function perfLog(label, extra = {}) {
  if (!POPUP_DEBUG) return;
  const sinceUrlsInitMs = initStartedAt
    ? Number((performance.now() - initStartedAt).toFixed(1))
    : null;
  console.debug('[THE Collector][PopupPerf]', { label, sinceUrlsInitMs, ...extra });
}

function chromeCall(invoke) {
  return new Promise((resolve, reject) => {
    invoke((result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(result);
    });
  });
}

function reportError(err, userMessage) {
  console.error(err);
  showToast(userMessage);
}

function loadUrls() {
  return chromeCall((done) => chrome.storage.local.get({ urls: [] }, done)).then(
    (result) =>
      Array.isArray(result.urls)
        ? result.urls.filter((u) => typeof u === 'string')
        : []
  );
}

function loadUndoSnapshot() {
  return chromeCall((done) => chrome.storage.local.get({ [URL_UNDO_KEY]: null }, done)).then(
    (result) => {
      const snapshot = result[URL_UNDO_KEY];
      if (!snapshot || !Array.isArray(snapshot.urls)) return null;
      const urls = snapshot.urls.filter((u) => typeof u === 'string');
      if (urls.length === 0) return null;
      return { urls };
    }
  );
}

function saveUrls(urls) {
  return chromeCall((done) => chrome.storage.local.set({ urls }, done));
}

function mutateUrls(mutator) {
  const run = urlMutationQueue.then(async () => {
    const urls = await loadUrls();
    const nextUrls = await mutator([...urls]);
    await saveUrls(nextUrls);
    return nextUrls;
  });
  urlMutationQueue = run.catch(() => {});
  return run;
}

function getCurrentTabUrl() {
  return chromeCall((done) =>
    chrome.tabs.query({ active: true, currentWindow: true }, done)
  ).then((tabs) => tabs[0]?.url || '');
}

function getAllTabUrls() {
  return chromeCall((done) => chrome.tabs.query({ currentWindow: true }, done)).then(
    (tabs) => tabs.map((t) => t.url || '').filter(Boolean)
  );
}

function buildNormalizedSet(urls) {
  return new Set(urls.map(normalizeUrlForCompare));
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function openUrl(url) {
  if (!isCollectibleUrl(url)) {
    showToast('Cannot open this URL');
    return;
  }
  chrome.tabs.create({ url }, () => {
    if (chrome.runtime.lastError) {
      reportError(new Error(chrome.runtime.lastError.message), 'Could not open URL');
    }
  });
}

function updateBadge(count) {
  urlCount.textContent = `${count} URL${count === 1 ? '' : 's'}`;
}

function updateRestoreButtonState() {
  const canRestore = canRestoreUrls(currentUrlCount, undoUrlCount);
  restoreBtn.disabled = !canRestore;
  restoreBtn.title = canRestore
    ? `Restore ${undoUrlCount} URL${undoUrlCount === 1 ? '' : 's'} from last clear`
    : 'Restore is available after clearing URLs';
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

function renderList(urls) {
  const startedAt = performance.now();
  currentUrlCount = urls.length;
  updateBadge(urls.length);

  if (urls.length === 0) {
    urlListEl.style.display = 'none';
    emptyStateEl.style.display = 'flex';
    updateRestoreButtonState();
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
  updateRestoreButtonState();
  perfLog('urls.renderList', {
    count: urls.length,
    durationMs: Number((performance.now() - startedAt).toFixed(1)),
  });
}

function resetClearButton() {
  clearBtn.classList.remove('confirming');
  clearBtn.textContent = 'Clear All';
}

async function refreshUndoState() {
  const snapshot = await loadUndoSnapshot();
  undoUrlCount = snapshot?.urls?.length || 0;
  updateRestoreButtonState();
}

function clearUrlsWithUndoSnapshot() {
  const run = urlMutationQueue.then(async () => {
    const state = await chromeCall((done) =>
      chrome.storage.local.get({ urls: [] }, done)
    );
    const current = Array.isArray(state.urls)
      ? state.urls.filter((u) => typeof u === 'string')
      : [];

    const payload = { urls: [] };
    if (current.length > 0) {
      payload[URL_UNDO_KEY] = { urls: current, savedAt: Date.now() };
    }

    await chromeCall((done) => chrome.storage.local.set(payload, done));
    return { urls: [], snapshotCount: current.length };
  });
  urlMutationQueue = run.catch(() => {});
  return run;
}

function restoreUrlsFromSnapshot() {
  const run = urlMutationQueue.then(async () => {
    const state = await chromeCall((done) =>
      chrome.storage.local.get({ urls: [], [URL_UNDO_KEY]: null }, done)
    );
    const snapshot = state[URL_UNDO_KEY];
    const restoredUrls =
      snapshot && Array.isArray(snapshot.urls)
        ? snapshot.urls.filter((u) => typeof u === 'string')
        : [];

    if (restoredUrls.length === 0) {
      return { restored: false, urls: Array.isArray(state.urls) ? state.urls : [] };
    }

    await chromeCall((done) =>
      chrome.storage.local.set({ urls: restoredUrls, [URL_UNDO_KEY]: null }, done)
    );
    return { restored: true, urls: restoredUrls, restoredCount: restoredUrls.length };
  });
  urlMutationQueue = run.catch(() => {});
  return run;
}

function wireEvents() {
  urlListEl.addEventListener('click', async (e) => {
    const target = e.target instanceof Element ? e.target : e.target?.parentElement;
    if (!target) return;
    const actionEl = target.closest('button[data-action]');
    if (!actionEl) return;
    const itemEl = actionEl.closest('.url-item');
    if (!itemEl) return;
    const url = itemEl.dataset.url || '';

    if (actionEl.dataset.action === 'open') {
      openUrl(url);
      return;
    }

    if (actionEl.dataset.action === 'remove') {
      try {
        const urls = await mutateUrls((current) => {
          const idx = current.indexOf(url);
          if (idx !== -1) current.splice(idx, 1);
          return current;
        });
        renderList(urls);
        showToast('URL removed');
      } catch (err) {
        reportError(err, 'Could not remove URL');
      }
    }
  });

  addBtn.addEventListener('click', async () => {
    try {
      const raw = await getCurrentTabUrl();
      if (!isCollectibleUrl(raw)) {
        showToast('Cannot collect this page');
        return;
      }

      const clean = cleanUrl(raw);
      let added = false;
      const urls = await mutateUrls((current) => {
        if (current.length >= URL_LIMIT) return current;
        const known = buildNormalizedSet(current);
        const normalized = normalizeUrlForCompare(clean);
        if (known.has(normalized)) return current;
        current.push(clean);
        added = true;
        return current;
      });

      if (!added) {
        showToast(urls.length >= URL_LIMIT ? `List full (max ${URL_LIMIT} URLs)` : 'Already in list');
        return;
      }

      renderList(urls);
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
      const urls = await mutateUrls((current) => {
        const known = buildNormalizedSet(current);
        for (const raw of validUrls) {
          if (current.length >= URL_LIMIT) break;
          const clean = cleanUrl(raw);
          const normalized = normalizeUrlForCompare(clean);
          if (!known.has(normalized)) {
            current.push(clean);
            known.add(normalized);
            added++;
          }
        }
        return current;
      });

      renderList(urls);
      showToast(added === 0 ? 'All tabs already in list' : `Added ${added} URL${added === 1 ? '' : 's'}`);
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
      await navigator.clipboard.writeText(urls.join('\n'));
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
      const blob = new Blob([urls.join('\n')], { type: 'text/plain' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'urls.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      showToast(`Saved ${urls.length} URL${urls.length === 1 ? '' : 's'} as TXT`);
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
      const csv = `url\n${urls.map(escapeCsvCell).join('\n')}`;
      const blob = new Blob([csv], { type: 'text/csv' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'urls.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      showToast(`Saved ${urls.length} URL${urls.length === 1 ? '' : 's'} as CSV`);
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
      const subject = `URL List (${urls.length} URL${urls.length === 1 ? '' : 's'})`;
      const body = urls.join('\n');
      const a = document.createElement('a');
      a.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      reportError(err, 'Could not prepare email');
    }
  });

  restoreBtn.addEventListener('click', async () => {
    try {
      if (restoreBtn.disabled) {
        showToast('Nothing to restore');
        return;
      }
      const result = await restoreUrlsFromSnapshot();
      if (!result.restored) {
        showToast('Nothing to restore');
        await refreshUndoState();
        return;
      }
      renderList(result.urls);
      await refreshUndoState();
      showToast(`Restored ${result.restoredCount} URL${result.restoredCount === 1 ? '' : 's'}`);
    } catch (err) {
      reportError(err, 'Could not restore URLs');
    }
  });

  clearBtn.addEventListener('click', async () => {
    try {
      if (!clearBtn.classList.contains('confirming')) {
        const urls = await loadUrls();
        if (urls.length === 0) {
          showToast('List is already empty');
          return;
        }
        clearBtn.classList.add('confirming');
        clearBtn.textContent = 'Confirm Clear';
        clearTimeout(clearConfirmTimer);
        clearConfirmTimer = setTimeout(resetClearButton, 3000);
        return;
      }

      clearTimeout(clearConfirmTimer);
      resetClearButton();
      const result = await clearUrlsWithUndoSnapshot();
      renderList(result.urls);
      await refreshUndoState();
      showToast(
        result.snapshotCount > 0
          ? `List cleared (can restore ${result.snapshotCount} URL${result.snapshotCount === 1 ? '' : 's'})`
          : 'List cleared'
      );
    } catch (err) {
      reportError(err, 'Could not clear list');
    }
  });
}

export async function initUrlsPanel() {
  if (initialized) return;
  initStartedAt = performance.now();
  perfLog('urls.init.start');
  initialized = true;
  wireEvents();
  const initialUrls = await loadUrls();
  renderList(initialUrls);
  await refreshUndoState();
  perfLog('urls.init.done', { count: initialUrls.length });
}
