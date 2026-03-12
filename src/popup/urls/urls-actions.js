import { showToast } from '../../shared/toast.js';
import { cleanUrl, normalizeUrlForCompare, isCollectibleUrl } from '../../shared/url-utils.js';
import { URL_HISTORY_ACTION, saveUrlHistory } from '../../shared/url-history.js';
import { canRestoreUrls } from '../../shared/url-list-state.js';
import { URL_LIMIT, formatUrlCount, buildNormalizedSet } from './urls-state.js';

export function wireUrlsPanelEvents({
  els,
  getCurrentUrlCount,
  getUndoUrlCount,
  setUndoUrlCount,
  renderList,
  reportError,
  state,
  changeLogView,
  historyView,
  setClearConfirmTimer,
  getClearConfirmTimer,
}) {
  const {
    urlListEl,
    addBtn,
    addAllBtn,
    copyBtn,
    exportBtn,
    exportCsvBtn,
    emailBtn,
    restoreBtn,
    clearBtn,
    urlChangeLogBtn,
    urlChangeLogBackBtn,
    urlChangeLogClearBtn,
    urlChangeLogListEl,
    urlChangeLogMoreBtn,
    urlHistoryBtn,
    urlHistoryBackBtn,
    urlHistoryClearBtn,
    urlHistoryListEl,
    urlHistoryMoreBtn,
  } = els;
  const activeChangeLogView = changeLogView || historyView;
  const activeChangeLogBtn = urlChangeLogBtn || urlHistoryBtn;
  const activeChangeLogBackBtn = urlChangeLogBackBtn || urlHistoryBackBtn;
  const activeChangeLogClearBtn = urlChangeLogClearBtn || urlHistoryClearBtn;
  const activeChangeLogListEl = urlChangeLogListEl || urlHistoryListEl;
  const activeChangeLogMoreBtn = urlChangeLogMoreBtn || urlHistoryMoreBtn;

  function updateRestoreButtonState() {
    const canRestore = canRestoreUrls(getCurrentUrlCount(), getUndoUrlCount());
    restoreBtn.disabled = !canRestore;
    restoreBtn.title = canRestore
      ? `Restore ${formatUrlCount(getUndoUrlCount())} from last clear`
      : 'Restore is available after clearing URLs';
  }

  function resetClearButton() {
    clearBtn.classList.remove('confirming');
    clearBtn.textContent = 'Clear All';
  }

  async function refreshUndoState() {
    const snapshot = await state.loadUndoSnapshot();
    setUndoUrlCount(snapshot?.urls?.length || 0);
    updateRestoreButtonState();
  }

  async function openChangeLogView() {
    activeChangeLogView.resetPage();
    const entries = await state.refreshHistoryEntries();
    activeChangeLogView.setEntries(entries);
    activeChangeLogView.renderChangeLogList();
    activeChangeLogView.showChangeLogView(true);
  }

  urlListEl.addEventListener('click', async (e) => {
    const target = e.target instanceof Element ? e.target : e.target?.parentElement;
    if (!target) return;
    const rowEl = target.closest('.url-item');
    if (rowEl && !target.closest('button[data-action]') && !target.closest('input[data-action]')) {
      const editor = rowEl.querySelector('.url-tags-editor');
      const toggle = rowEl.querySelector('button[data-action="toggle-tags"]');
      if (editor && toggle) {
        const nextExpanded = editor.classList.contains('hidden');
        editor.classList.toggle('hidden', !nextExpanded);
        rowEl.classList.toggle('url-item-expanded', nextExpanded);
        toggle.setAttribute('aria-expanded', nextExpanded ? 'true' : 'false');
      }
      return;
    }
    const actionEl = target.closest('button[data-action]');
    if (!actionEl) return;
    const itemEl = actionEl.closest('.url-item');
    if (!itemEl) return;
    const url = itemEl.dataset.url || '';

    if (actionEl.dataset.action === 'open') {
      state.openUrl(url, reportError, showToast);
      return;
    }

    if (actionEl.dataset.action === 'star') {
      try {
        const nextStarred = actionEl.getAttribute('aria-pressed') !== 'true';
        await state.setUrlStar(url, nextStarred);
        const urls = await state.loadUrls();
        renderList(urls);
        showToast(nextStarred ? 'Added to Starred' : 'Removed from Starred');
      } catch (err) {
        reportError(err, 'Could not update starred state');
      }
      return;
    }

    if (actionEl.dataset.action === 'toggle-tags') {
      const editor = itemEl.querySelector('.url-tags-editor');
      if (!editor) return;
      const nextExpanded = editor.classList.contains('hidden');
      editor.classList.toggle('hidden', !nextExpanded);
      itemEl.classList.toggle('url-item-expanded', nextExpanded);
      actionEl.setAttribute('aria-expanded', nextExpanded ? 'true' : 'false');
      if (nextExpanded) {
        const input = itemEl.querySelector('input[data-action="tag-input"]');
        input?.focus();
      }
      return;
    }

    async function updateTags(nextTags, successMessage) {
      await state.setUrlTags(url, nextTags);
      const urls = await state.loadUrls();
      renderList(urls);
      showToast(successMessage);
    }

    if (actionEl.dataset.action === 'tag-suggest') {
      try {
        const tag = String(actionEl.dataset.tag || '')
          .trim()
          .slice(0, 24);
        if (!tag) return;
        const existingTags = Array.from(
          itemEl.querySelectorAll('.url-tag-chip [data-action="tag-remove"]')
        )
          .map((btn) => String(btn.getAttribute('data-tag') || '').trim())
          .filter(Boolean);
        if (existingTags.includes(tag)) {
          showToast('Tag already added');
          return;
        }
        if (existingTags.length >= 10) {
          showToast('Tag limit reached (max 10)');
          return;
        }
        await updateTags([...existingTags, tag], `Tag "${tag}" added`);
      } catch (err) {
        reportError(err, 'Could not add tag');
      }
      return;
    }

    if (actionEl.dataset.action === 'tag-add') {
      try {
        const input = itemEl.querySelector('input[data-action="tag-input"]');
        const tag = String(input?.value || '')
          .trim()
          .slice(0, 24);
        if (!tag) {
          showToast('Enter a tag');
          return;
        }
        const existingTags = Array.from(
          itemEl.querySelectorAll('.url-tag-chip [data-action="tag-remove"]')
        )
          .map((btn) => String(btn.getAttribute('data-tag') || '').trim())
          .filter(Boolean);
        if (existingTags.includes(tag)) {
          showToast('Tag already added');
          return;
        }
        if (existingTags.length >= 10) {
          showToast('Tag limit reached (max 10)');
          return;
        }
        await updateTags([...existingTags, tag], `Tag "${tag}" added`);
      } catch (err) {
        reportError(err, 'Could not add tag');
      }
      return;
    }

    if (actionEl.dataset.action === 'tag-remove') {
      try {
        const tagToRemove = String(actionEl.dataset.tag || '').trim();
        const existingTags = Array.from(
          itemEl.querySelectorAll('.url-tag-chip [data-action="tag-remove"]')
        )
          .map((btn) => String(btn.getAttribute('data-tag') || '').trim())
          .filter(Boolean);
        const nextTags = existingTags.filter((tag) => tag !== tagToRemove);
        await updateTags(nextTags, `Tag "${tagToRemove}" removed`);
      } catch (err) {
        reportError(err, 'Could not remove tag');
      }
      return;
    }

    if (actionEl.dataset.action === 'remove') {
      try {
        const urls = await state.mutations.mutateUrls(
          (current) => {
            const idx = current.indexOf(url);
            if (idx !== -1) current.splice(idx, 1);
            return current;
          },
          URL_HISTORY_ACTION.REMOVE_ONE,
          { source: 'popup', operation: 'remove', removedUrl: url }
        );
        renderList(urls);
        showToast('URL removed');
      } catch (err) {
        reportError(err, 'Could not remove URL');
      }
    }
  });

  urlListEl.addEventListener('keydown', async (e) => {
    const target = e.target instanceof Element ? e.target : null;
    if (!target || target.getAttribute('data-action') !== 'tag-input') return;
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const itemEl = target.closest('.url-item');
    if (!itemEl) return;
    const addBtn = itemEl.querySelector('button[data-action="tag-add"]');
    addBtn?.click();
  });

  addBtn.addEventListener('click', async () => {
    try {
      const raw = await state.getCurrentTabUrl();
      if (!isCollectibleUrl(raw)) {
        showToast('Cannot collect this page');
        return;
      }

      const clean = cleanUrl(raw);
      let added = false;
      const urls = await state.mutations.mutateUrls(
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
        showToast(
          urls.length >= URL_LIMIT ? `List full (max ${URL_LIMIT} URLs)` : 'Already in list'
        );
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
      const rawUrls = await state.getAllTabUrls();
      const validUrls = rawUrls.filter(isCollectibleUrl);
      if (validUrls.length === 0) {
        showToast('No collectible tabs found');
        return;
      }

      let added = 0;
      const urls = await state.mutations.mutateUrls(
        (current) => {
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
        },
        URL_HISTORY_ACTION.ADD_ALL_TABS,
        {
          source: 'popup',
          mode: 'window_tabs',
          requestedCount: validUrls.length,
        }
      );

      renderList(urls);
      showToast(added === 0 ? 'All tabs already in list' : `Added ${formatUrlCount(added)}`);
    } catch (err) {
      reportError(err, 'Could not add tab URLs');
    }
  });

  copyBtn.addEventListener('click', async () => {
    try {
      const urls = await state.loadUrls();
      if (urls.length === 0) {
        showToast('Nothing to copy');
        return;
      }
      await state.copyUrlsToClipboard(urls);
      showToast('Copied');
    } catch (err) {
      reportError(err, 'Clipboard access denied');
    }
  });

  exportBtn.addEventListener('click', async () => {
    try {
      const urls = await state.loadUrls();
      if (urls.length === 0) {
        showToast('Nothing to export');
        return;
      }
      await state.exportUrlsAsTxt(urls);
      showToast(`Saved ${formatUrlCount(urls.length)} as TXT`);
    } catch (err) {
      reportError(err, 'Could not export TXT');
    }
  });

  exportCsvBtn.addEventListener('click', async () => {
    try {
      const urls = await state.loadUrls();
      if (urls.length === 0) {
        showToast('Nothing to export');
        return;
      }
      await state.exportUrlsAsCsv(urls);
      showToast(`Saved ${formatUrlCount(urls.length)} as CSV`);
    } catch (err) {
      reportError(err, 'Could not export CSV');
    }
  });

  emailBtn.addEventListener('click', async () => {
    try {
      const urls = await state.loadUrls();
      if (urls.length === 0) {
        showToast('Nothing to email');
        return;
      }
      const subject = `URL List (${formatUrlCount(urls.length)})`;
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
      const result = await state.mutations.restoreUrlsFromSnapshot();
      if (!result.restored) {
        showToast('Nothing to restore');
        await refreshUndoState();
        return;
      }
      renderList(result.urls);
      await refreshUndoState();
      showToast(`Restored ${formatUrlCount(result.restoredCount)}`);
    } catch (err) {
      reportError(err, 'Could not restore URLs');
    }
  });

  clearBtn.addEventListener('click', async () => {
    try {
      if (!clearBtn.classList.contains('confirming')) {
        const urls = await state.loadUrls();
        if (urls.length === 0) {
          showToast('List is already empty');
          return;
        }
        clearBtn.classList.add('confirming');
        clearBtn.textContent = 'Confirm Clear';
        clearTimeout(getClearConfirmTimer());
        setClearConfirmTimer(setTimeout(resetClearButton, 3000));
        return;
      }

      clearTimeout(getClearConfirmTimer());
      resetClearButton();
      const result = await state.mutations.clearUrlsWithUndoSnapshot();
      renderList(result.urls);
      await refreshUndoState();
      showToast(
        result.snapshotCount > 0
          ? `List cleared (can restore ${formatUrlCount(result.snapshotCount)})`
          : 'List cleared'
      );
    } catch (err) {
      reportError(err, 'Could not clear list');
    }
  });

  activeChangeLogBtn.addEventListener('click', async () => {
    try {
      await openChangeLogView();
    } catch (err) {
      reportError(err, 'Could not load URL change log');
    }
  });

  activeChangeLogBackBtn.addEventListener('click', () => {
    activeChangeLogView.showChangeLogView(false);
  });

  activeChangeLogClearBtn.addEventListener('click', async () => {
    try {
      await saveUrlHistory([]);
      activeChangeLogView.setEntries([]);
      activeChangeLogView.resetPage();
      activeChangeLogView.renderChangeLogList();
      showToast('Change log cleared');
    } catch (err) {
      reportError(err, 'Could not clear URL change log');
    }
  });

  activeChangeLogListEl.addEventListener('click', async (e) => {
    const target = e.target instanceof Element ? e.target : e.target?.parentElement;
    if (!target) return;
    const actionEl = target.closest('button[data-change-log-action], button[data-history-action]');
    if (!actionEl) return;
    const itemEl = actionEl.closest('.change-log-item, .history-item');
    if (!itemEl) return;

    const changeLogId = itemEl.dataset.changeLogId || itemEl.dataset.historyId || '';
    const action = actionEl.dataset.changeLogAction || actionEl.dataset.historyAction;
    const entry = activeChangeLogView.getEntries().find((it) => it.id === changeLogId);
    if (!entry) {
      showToast('Change log entry no longer available');
      await openChangeLogView();
      return;
    }

    try {
      if (action === 'copy') {
        await state.copyUrlsToClipboard(entry.urls);
        showToast(`Copied ${formatUrlCount(entry.urls.length)}`);
        return;
      }

      if (action === 'txt') {
        await state.exportUrlsAsTxt(entry.urls, 'urls-change-log.txt');
        showToast(`Saved ${formatUrlCount(entry.urls.length)} as TXT`);
        return;
      }

      if (action === 'csv') {
        await state.exportUrlsAsCsv(entry.urls, 'urls-change-log.csv');
        showToast(`Saved ${formatUrlCount(entry.urls.length)} as CSV`);
        return;
      }

      if (action === 'restore') {
        const result = await state.mutations.restoreUrlsFromHistory(changeLogId);
        if (!result.restored) {
          showToast('Could not restore this snapshot');
          await openChangeLogView();
          return;
        }
        renderList(result.urls);
        await refreshUndoState();
        activeChangeLogView.showChangeLogView(false);
        showToast(`Restored ${formatUrlCount(result.restoredCount)}`);
      }
    } catch (err) {
      reportError(err, 'Could not run change log action');
    }
  });

  activeChangeLogMoreBtn.addEventListener('click', () => {
    activeChangeLogView.incrementPage();
    activeChangeLogView.renderChangeLogList();
  });

  return {
    refreshUndoState,
    updateRestoreButtonState,
    showChangeLogView: activeChangeLogView.showChangeLogView,
    showHistoryView: activeChangeLogView.showHistoryView,
  };
}
