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
      return 'Restored from change log';
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

function createChangeLogItemEl(entry) {
  const item = document.createElement('div');
  item.className = 'change-log-item';
  item.dataset.changeLogId = entry.id;

  const title = document.createElement('div');
  title.className = 'change-log-item-title';
  const firstUrl = entry.urls[0] || '(no URL)';
  title.textContent =
    entry.urls.length > 1 ? `${firstUrl} (+${entry.urls.length - 1} more)` : firstUrl;
  title.title = firstUrl;

  const meta = document.createElement('div');
  meta.className = 'change-log-item-meta';
  meta.textContent = `${formatSnapshotTime(entry.createdAt)} - ${getActionLabel(entry.actionType)}`;

  const actions = document.createElement('div');
  actions.className = 'change-log-item-actions';
  actions.innerHTML = `
    <button class="btn-footer" data-change-log-action="restore">Restore</button>
    <button class="btn-footer" data-change-log-action="copy">Copy</button>
    <button class="btn-footer" data-change-log-action="txt">TXT</button>
    <button class="btn-footer" data-change-log-action="csv">CSV</button>
  `;

  item.appendChild(title);
  item.appendChild(meta);
  item.appendChild(actions);
  return item;
}

export function createUrlsChangeLogView({
  urlsMainViewEl,
  urlsChangeLogViewEl,
  urlChangeLogListEl,
  urlChangeLogEmptyEl,
  urlChangeLogMoreBtn,
  // Backward-compatible argument aliases for legacy wiring.
  urlsHistoryViewEl,
  urlHistoryListEl,
  urlHistoryEmptyEl,
  urlHistoryMoreBtn,
}) {
  let entries = [];
  let changeLogPage = 0;

  const changeLogViewEl = urlsChangeLogViewEl || urlsHistoryViewEl;
  const changeLogListEl = urlChangeLogListEl || urlHistoryListEl;
  const changeLogEmptyEl = urlChangeLogEmptyEl || urlHistoryEmptyEl;
  const changeLogMoreBtn = urlChangeLogMoreBtn || urlHistoryMoreBtn;

  function setEntries(nextEntries) {
    entries = Array.isArray(nextEntries) ? nextEntries : [];
  }

  function getEntries() {
    return entries;
  }

  function setPage(page) {
    changeLogPage = Math.max(0, Number(page) || 0);
  }

  function incrementPage() {
    changeLogPage += 1;
  }

  function resetPage() {
    changeLogPage = 0;
  }

  function renderChangeLogList() {
    changeLogListEl.innerHTML = '';
    if (!entries.length) {
      changeLogListEl.style.display = 'none';
      changeLogEmptyEl.style.display = 'flex';
      changeLogMoreBtn.classList.add('hidden');
      return;
    }

    const visibleCount = Math.min(entries.length, (changeLogPage + 1) * URL_HISTORY_PAGE_SIZE);
    const visibleEntries = entries.slice(0, visibleCount);
    changeLogListEl.style.display = 'block';
    changeLogEmptyEl.style.display = 'none';
    const fragment = document.createDocumentFragment();
    visibleEntries.forEach((entry) => {
      fragment.appendChild(createChangeLogItemEl(entry));
    });
    changeLogListEl.appendChild(fragment);
    changeLogMoreBtn.classList.toggle('hidden', visibleCount >= entries.length);
  }

  function showChangeLogView(show) {
    urlsMainViewEl.classList.toggle('hidden', show);
    changeLogViewEl.classList.toggle('hidden', !show);
  }

  return {
    setEntries,
    getEntries,
    setPage,
    incrementPage,
    resetPage,
    renderChangeLogList,
    showChangeLogView,
    // Backward-compatible method aliases for legacy call sites.
    renderHistoryList: renderChangeLogList,
    showHistoryView: showChangeLogView,
  };
}

export const createUrlsHistoryView = createUrlsChangeLogView;
