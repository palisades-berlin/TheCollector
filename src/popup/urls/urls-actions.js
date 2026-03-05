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
    urlHistoryBtn,
    urlHistoryBackBtn,
    urlHistoryClearBtn,
    urlHistoryListEl,
    urlHistoryMoreBtn,
  } = els;

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

  async function openHistoryView() {
    historyView.resetPage();
    const entries = await state.refreshHistoryEntries();
    historyView.setEntries(entries);
    historyView.renderHistoryList();
    historyView.showHistoryView(true);
  }

  urlListEl.addEventListener('click', async (e) => {
    const target = e.target instanceof Element ? e.target : e.target?.parentElement;
    if (!target) return;
    const actionEl = target.closest('button[data-action]');
    if (!actionEl) return;
    const itemEl = actionEl.closest('.url-item');
    if (!itemEl) return;
    const url = itemEl.dataset.url || '';

    if (actionEl.dataset.action === 'open') {
      state.openUrl(url, reportError, showToast);
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

  urlHistoryBtn.addEventListener('click', async () => {
    try {
      await openHistoryView();
    } catch (err) {
      reportError(err, 'Could not load URL history');
    }
  });

  urlHistoryBackBtn.addEventListener('click', () => {
    historyView.showHistoryView(false);
  });

  urlHistoryClearBtn.addEventListener('click', async () => {
    try {
      await saveUrlHistory([]);
      historyView.setEntries([]);
      historyView.resetPage();
      historyView.renderHistoryList();
      showToast('URL history cleared');
    } catch (err) {
      reportError(err, 'Could not clear URL history');
    }
  });

  urlHistoryListEl.addEventListener('click', async (e) => {
    const target = e.target instanceof Element ? e.target : e.target?.parentElement;
    if (!target) return;
    const actionEl = target.closest('button[data-history-action]');
    if (!actionEl) return;
    const itemEl = actionEl.closest('.history-item');
    if (!itemEl) return;

    const historyId = itemEl.dataset.historyId || '';
    const entry = historyView.getEntries().find((it) => it.id === historyId);
    if (!entry) {
      showToast('History entry no longer available');
      await openHistoryView();
      return;
    }

    try {
      if (actionEl.dataset.historyAction === 'copy') {
        await state.copyUrlsToClipboard(entry.urls);
        showToast(`Copied ${formatUrlCount(entry.urls.length)}`);
        return;
      }

      if (actionEl.dataset.historyAction === 'txt') {
        await state.exportUrlsAsTxt(entry.urls, 'urls-history.txt');
        showToast(`Saved ${formatUrlCount(entry.urls.length)} as TXT`);
        return;
      }

      if (actionEl.dataset.historyAction === 'csv') {
        await state.exportUrlsAsCsv(entry.urls, 'urls-history.csv');
        showToast(`Saved ${formatUrlCount(entry.urls.length)} as CSV`);
        return;
      }

      if (actionEl.dataset.historyAction === 'restore') {
        const result = await state.mutations.restoreUrlsFromHistory(historyId);
        if (!result.restored) {
          showToast('Could not restore this snapshot');
          await openHistoryView();
          return;
        }
        renderList(result.urls);
        await refreshUndoState();
        historyView.showHistoryView(false);
        showToast(`Restored ${formatUrlCount(result.restoredCount)}`);
      }
    } catch (err) {
      reportError(err, 'Could not run history action');
    }
  });

  urlHistoryMoreBtn.addEventListener('click', () => {
    historyView.incrementPage();
    historyView.renderHistoryList();
  });

  return {
    refreshUndoState,
    updateRestoreButtonState,
    showHistoryView: historyView.showHistoryView,
  };
}
