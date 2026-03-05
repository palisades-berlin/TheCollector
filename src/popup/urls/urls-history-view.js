import { URL_HISTORY_ACTION } from '../../shared/url-history.js';

const URL_HISTORY_PAGE_SIZE = 20;

function getActionLabel(actionType) {
  switch (actionType) {
    case URL_HISTORY_ACTION.ADD_CURRENT:
      return 'Added current tab';
    case URL_HISTORY_ACTION.ADD_ALL_TABS:
      return 'Added all tabs';
    case URL_HISTORY_ACTION.REMOVE_ONE:
      return 'Removed one URL';
    case URL_HISTORY_ACTION.CLEAR_BEFORE:
      return 'Before clear all';
    case URL_HISTORY_ACTION.RESTORE_LAST_CLEAR:
      return 'Restored last clear';
    case URL_HISTORY_ACTION.RESTORE_HISTORY:
      return 'Restored from history';
    default:
      return 'Updated list';
  }
}

function formatSnapshotTime(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return 'Unknown time';
  }
}

function createHistoryItemEl(entry) {
  const item = document.createElement('div');
  item.className = 'history-item';
  item.dataset.historyId = entry.id;

  const title = document.createElement('div');
  title.className = 'history-item-title';
  const firstUrl = entry.urls[0] || '(no URL)';
  title.textContent =
    entry.urls.length > 1 ? `${firstUrl} (+${entry.urls.length - 1} more)` : firstUrl;
  title.title = firstUrl;

  const meta = document.createElement('div');
  meta.className = 'history-item-meta';
  meta.textContent = `${formatSnapshotTime(entry.createdAt)} - ${getActionLabel(entry.actionType)}`;

  const actions = document.createElement('div');
  actions.className = 'history-item-actions';
  actions.innerHTML = `
    <button class="btn-footer" data-history-action="restore">Restore</button>
    <button class="btn-footer" data-history-action="copy">Copy</button>
    <button class="btn-footer" data-history-action="txt">TXT</button>
    <button class="btn-footer" data-history-action="csv">CSV</button>
  `;

  item.appendChild(title);
  item.appendChild(meta);
  item.appendChild(actions);
  return item;
}

export function createUrlsHistoryView({
  urlsMainViewEl,
  urlsHistoryViewEl,
  urlHistoryListEl,
  urlHistoryEmptyEl,
  urlHistoryMoreBtn,
}) {
  let entries = [];
  let historyPage = 0;

  function setEntries(nextEntries) {
    entries = Array.isArray(nextEntries) ? nextEntries : [];
  }

  function getEntries() {
    return entries;
  }

  function setPage(page) {
    historyPage = Math.max(0, Number(page) || 0);
  }

  function incrementPage() {
    historyPage += 1;
  }

  function resetPage() {
    historyPage = 0;
  }

  function renderHistoryList() {
    urlHistoryListEl.innerHTML = '';
    if (!entries.length) {
      urlHistoryListEl.style.display = 'none';
      urlHistoryEmptyEl.style.display = 'flex';
      urlHistoryMoreBtn.classList.add('hidden');
      return;
    }

    const visibleCount = Math.min(entries.length, (historyPage + 1) * URL_HISTORY_PAGE_SIZE);
    const visibleEntries = entries.slice(0, visibleCount);
    urlHistoryListEl.style.display = 'block';
    urlHistoryEmptyEl.style.display = 'none';
    const fragment = document.createDocumentFragment();
    visibleEntries.forEach((entry) => {
      fragment.appendChild(createHistoryItemEl(entry));
    });
    urlHistoryListEl.appendChild(fragment);
    urlHistoryMoreBtn.classList.toggle('hidden', visibleCount >= entries.length);
  }

  function showHistoryView(show) {
    urlsMainViewEl.classList.toggle('hidden', show);
    urlsHistoryViewEl.classList.toggle('hidden', !show);
  }

  return {
    setEntries,
    getEntries,
    setPage,
    incrementPage,
    resetPage,
    renderHistoryList,
    showHistoryView,
  };
}
