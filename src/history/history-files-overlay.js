import { getUserSettings } from '../shared/repos/settings-repo.js';
import { showToast } from '../shared/toast.js';
import { formatBytes, buildRecordHints, runWithConcurrency } from './history-utils.js';
import { downloadRecord } from './history-downloads.js';

export function createHistoryFilesOverlay({
  els,
  getGroups,
  getScreenshot,
  deleteScreenshots,
  openPreview,
  refreshAll,
}) {
  const {
    filesOverlayEl,
    openFilesBtn,
    closeFilesBtn,
    filesListEl,
    filesStatusEl,
    selectAllEl,
    selectedCountEl,
    downloadSelectedBtn,
    deleteSelectedBtn,
    fileRowTpl,
  } = els;

  const selectedBaseIds = new Set();
  let filesOverlayClosing = false;
  let openerEl = null;

  function getFocusableInOverlay() {
    return filesOverlayEl
      ? Array.from(
          filesOverlayEl.querySelectorAll(
            'button:not([disabled]), input:not([disabled]), [href], select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el instanceof HTMLElement && el.offsetParent !== null)
      : [];
  }

  function focusFirstOverlayControl() {
    const focusables = getFocusableInOverlay();
    const first = focusables[0] || closeFilesBtn;
    first?.focus();
  }

  function renderFilesOverlay(resetSelection = false) {
    const groups = getGroups();
    filesListEl.innerHTML = '';
    if (resetSelection) selectedBaseIds.clear();

    const fragment = document.createDocumentFragment();
    for (const group of groups) {
      const node = fileRowTpl.content.cloneNode(true);
      const row = node.querySelector('.file-row');
      const check = node.querySelector('.file-check');
      const link = node.querySelector('.file-link');
      const sizeEl = node.querySelector('.file-size');
      const dateEl = node.querySelector('.file-date');

      row.dataset.baseId = group.baseId;
      check.checked = selectedBaseIds.has(group.baseId);
      check.addEventListener('change', () => {
        if (check.checked) selectedBaseIds.add(group.baseId);
        else selectedBaseIds.delete(group.baseId);
        updateSelectionUi();
      });

      const record = group.records[0];
      const hints = buildRecordHints(record);
      const suffix = hints.length ? ` (${hints.join(', ')})` : '';
      link.textContent = `${group.url || '(no source URL)'}${suffix}`;
      link.title = group.url;
      link.addEventListener('click', () => openPreview(group.previewId));

      sizeEl.textContent = formatBytes(group.totalBytes);
      dateEl.textContent = new Date(group.timestamp).toLocaleString();

      fragment.appendChild(node);
    }
    filesListEl.appendChild(fragment);

    filesStatusEl.textContent = '';
    updateSelectionUi();
  }

  function updateSelectionUi() {
    const groups = getGroups();
    const selected = selectedBaseIds.size;
    selectedCountEl.textContent = `(${selected} Selected)`;
    downloadSelectedBtn.disabled = selected === 0;
    deleteSelectedBtn.disabled = selected === 0;
    selectAllEl.checked = groups.length > 0 && selected === groups.length;
    selectAllEl.indeterminate = selected > 0 && selected < groups.length;
  }

  function closeFilesOverlay() {
    if (filesOverlayEl.classList.contains('hidden')) return;
    if (filesOverlayClosing) return;
    filesOverlayClosing = true;
    filesOverlayEl.classList.remove('entering');
    filesOverlayEl.classList.add('leaving');
    setTimeout(() => {
      filesOverlayEl.classList.add('hidden');
      filesOverlayEl.classList.remove('leaving');
      filesOverlayClosing = false;
      if (openerEl?.isConnected) openerEl.focus();
      openerEl = null;
    }, 190);
  }

  function wireEvents() {
    openFilesBtn.addEventListener('click', () => {
      if (!filesOverlayEl.classList.contains('hidden')) return;
      openerEl =
        document.activeElement instanceof HTMLElement ? document.activeElement : openFilesBtn;
      filesOverlayEl.classList.remove('hidden');
      filesOverlayEl.classList.remove('leaving');
      filesOverlayEl.classList.add('entering');
      focusFirstOverlayControl();
      setTimeout(() => filesOverlayEl.classList.remove('entering'), 230);
    });

    closeFilesBtn.addEventListener('click', () => {
      closeFilesOverlay();
    });

    filesOverlayEl.addEventListener('click', (e) => {
      if (e.target === filesOverlayEl) closeFilesOverlay();
    });

    window.addEventListener('keydown', (e) => {
      if (filesOverlayEl.classList.contains('hidden')) return;
      if (e.key === 'Escape') {
        closeFilesOverlay();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = getFocusableInOverlay();
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
        return;
      }
      if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    });

    selectAllEl.addEventListener('change', () => {
      selectedBaseIds.clear();
      if (selectAllEl.checked) {
        for (const g of getGroups()) selectedBaseIds.add(g.baseId);
      }
      renderFilesOverlay(false);
    });

    downloadSelectedBtn.addEventListener('click', async () => {
      const groups = getGroups();
      const selectedGroups = groups.filter((g) => selectedBaseIds.has(g.baseId));
      if (selectedGroups.length === 0) return;
      const totalSelectedFiles = selectedGroups.reduce(
        (sum, group) => sum + group.records.length,
        0
      );
      const allowSaveAs = totalSelectedFiles === 1;

      downloadSelectedBtn.disabled = true;
      filesStatusEl.textContent = `Downloading ${selectedGroups.length} selected item(s)…`;
      try {
        const settings = await getUserSettings();
        const jobs = [];
        for (const group of selectedGroups) {
          for (let idx = 0; idx < group.records.length; idx++) {
            jobs.push({
              id: group.records[idx].id,
              partIndex: idx,
              partTotal: group.records.length,
              titleHint: group.url || group.records[idx].title || 'screenshot',
            });
          }
        }
        await runWithConcurrency(jobs, 2, async (job) => {
          const fullRecord = await getScreenshot(job.id);
          if (!fullRecord?.blob) throw new Error(`Missing screenshot data: ${job.id}`);
          await downloadRecord({
            record: fullRecord,
            settings,
            partIndex: job.partIndex,
            partTotal: job.partTotal,
            titleHint: job.titleHint,
            allowSaveAs,
          });
        });
        filesStatusEl.textContent = 'Download completed.';
        showToast('Download completed.', 'success');
      } catch (err) {
        filesStatusEl.textContent = `Download failed: ${err.message}`;
        showToast(`Download failed: ${err.message}`, 'error', 3200);
      } finally {
        updateSelectionUi();
      }
    });

    deleteSelectedBtn.addEventListener('click', async () => {
      const groups = getGroups();
      const selectedGroups = groups.filter((g) => selectedBaseIds.has(g.baseId));
      if (selectedGroups.length === 0) return;
      const total = selectedGroups.reduce((sum, g) => sum + g.records.length, 0);
      if (!confirm(`Delete ${total} screenshot file(s)? This cannot be undone.`)) return;

      try {
        const ids = selectedGroups.flatMap((group) => group.records.map((record) => record.id));
        await deleteScreenshots(ids);
        filesStatusEl.textContent = 'Selected files deleted.';
        showToast('Selected files deleted.', 'success');
        await refreshAll();
      } catch (err) {
        filesStatusEl.textContent = `Delete failed: ${err.message}`;
        showToast(`Delete failed: ${err.message}`, 'error', 3200);
        updateSelectionUi();
      }
    });
  }

  return {
    wireEvents,
    renderFilesOverlay,
  };
}
