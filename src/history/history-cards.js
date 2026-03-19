import { buildRecordHints, buildCardDiagnosticText, getRecordExportType } from './history-utils.js';

export function createHistoryCards({
  cardTpl,
  enqueueThumbLoad,
  openPreview,
  deleteScreenshots,
  refreshAll,
  compareSelection,
  toggleCompareSelection,
}) {
  function buildCard(record, options = {}) {
    const node = cardTpl.content.cloneNode(true);
    const card = node.querySelector('.card');
    const canvas = node.querySelector('.thumb-canvas');
    const urlEl = node.querySelector('.card-url');
    const pillsEl = node.querySelector('.card-pills');
    const metaEl = node.querySelector('.card-meta');
    const diagnosticEl = node.querySelector('.card-diagnostic');
    const compareCardBtn = node.querySelector('.btn-compare');
    const compareLabelEl = node.querySelector('.btn-compare-label');
    const openBtn = node.querySelector('.btn-open');
    const deleteBtn = node.querySelector('.btn-delete');
    const ariaLabelDomain = (() => {
      try {
        return new URL(record.url).hostname;
      } catch {
        return String(record.url || 'this page');
      }
    })();

    canvas.classList.remove('thumb-broken');
    enqueueThumbLoad(record.id, canvas, options);

    try {
      urlEl.textContent = new URL(record.url).hostname;
      urlEl.title = record.url;
    } catch {
      urlEl.textContent = record.url;
    }
    const pills = [];
    const exportType = getRecordExportType(record);
    if (exportType) pills.push(`<span class="sc-pill">${exportType.toUpperCase()}</span>`);
    if (record.captureProfileId) {
      pills.push(
        `<span class="sc-pill">${String(record.captureProfileId).replace(/_/g, ' ')}</span>`
      );
    }
    const hints = buildRecordHints(record);
    if (hints.length) {
      for (const hint of hints) pills.push(`<span class="sc-pill">${hint}</span>`);
    }
    if (pillsEl) {
      pillsEl.innerHTML = pills.join('');
      pillsEl.classList.toggle('hidden', pills.length === 0);
    }
    const suffix = hints.length ? ` · ${hints.join(' · ')}` : '';
    metaEl.textContent = `${new Date(record.timestamp).toLocaleDateString()} · ${record.width}×${record.height}px${suffix}`;
    const diagnosticText = buildCardDiagnosticText(record);
    if (diagnosticText) {
      diagnosticEl.textContent = diagnosticText;
      diagnosticEl.classList.remove('is-empty');
    } else {
      diagnosticEl.textContent = '';
      diagnosticEl.classList.add('is-empty');
    }

    card.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      openPreview(record.id);
    });

    const selectedIdx = compareSelection.indexOf(record.id);
    const selected = selectedIdx !== -1;
    card.classList.toggle('compare-selected', selected);
    compareCardBtn.classList.toggle('active', selected);
    if (compareLabelEl) {
      compareLabelEl.textContent = selected ? `Selected ${selectedIdx + 1}` : 'Compare';
    }
    compareCardBtn.setAttribute(
      'aria-label',
      selected
        ? `Selected ${selectedIdx + 1} for compare: ${ariaLabelDomain}`
        : `Compare screenshot from ${ariaLabelDomain}`
    );
    compareCardBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCompareSelection(record.id);
    });

    openBtn.setAttribute('aria-label', `Open screenshot from ${ariaLabelDomain}`);
    deleteBtn.setAttribute('aria-label', `Delete screenshot from ${ariaLabelDomain}`);
    openBtn.addEventListener('click', () => openPreview(record.id));
    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm('Delete screenshot file? This cannot be undone.')) return;
      await deleteScreenshots([record.id]);
      await refreshAll();
    });

    return node;
  }

  return {
    buildCard,
  };
}
