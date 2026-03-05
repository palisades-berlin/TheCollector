export function createPreviewExportController({
  MSG,
  showToast,
  anchorDownloadBlob,
  buildPdfFromCanvas,
  sanitizeHttpUrl,
  buttons,
  pdfPageSizeEl,
  canvasToBlob,
  buildEditedCanvas,
  getCurrentBlob,
  getSettings,
  getSourceUrl,
  getCaptureTimestamp,
  showError,
}) {
  const GOOGLE_DOCS_PIXEL_LIMIT = 25_000_000;
  let hasAutoDownloaded = false;
  let presetRunning = false;

  async function runPreset(kind) {
    if (presetRunning) return;
    presetRunning = true;
    setPresetButtonsDisabled(true);
    try {
      if (kind === 'email') {
        await runExport('jpg');
        openEmailDraft();
        showToast('Email preset ready: JPG exported + draft opened.', 'success');
        return;
      }
      if (kind === 'docs') {
        await copyToClipboard({ forceDocsFit: true });
        showToast('Docs preset ready: image copied with Docs-safe sizing.', 'success');
        return;
      }
      if (kind === 'pdf_auto') {
        const previousSize = pdfPageSizeEl.value;
        pdfPageSizeEl.value = 'auto';
        try {
          await runExport('pdf');
        } finally {
          pdfPageSizeEl.value = previousSize;
        }
        showToast('PDF Auto preset ready.', 'success');
        return;
      }
      throw new Error(`Unknown preset: ${kind}`);
    } finally {
      setPresetButtonsDisabled(false);
      presetRunning = false;
    }
  }

  function setPresetButtonsDisabled(disabled) {
    if (buttons.presetEmailBtn) buttons.presetEmailBtn.disabled = disabled;
    if (buttons.presetDocsBtn) buttons.presetDocsBtn.disabled = disabled;
    if (buttons.presetPdfAutoBtn) buttons.presetPdfAutoBtn.disabled = disabled;
  }

  function openEmailDraft() {
    const subject = 'Screenshot from THE Collector';
    const source = sanitizeHttpUrl(getSourceUrl());
    const bodyLines = ['I exported a screenshot from THE Collector.'];
    if (source) bodyLines.push(`Source: ${source}`);
    bodyLines.push(`Captured: ${new Date(getCaptureTimestamp()).toLocaleString()}`);
    bodyLines.push('', 'Please attach the exported JPG file.');
    const href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
    const a = document.createElement('a');
    a.href = href;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function runExport(format) {
    const currentBlob = getCurrentBlob();
    if (!currentBlob) {
      throw new Error('Export is unavailable before image load.');
    }

    if (format === 'png') {
      const canvas = await buildEditedCanvas();
      const blob = await canvasToBlob(canvas, 'image/png');
      await triggerDownloadBlob(blob, 'png');
      showToast('PNG download started.', 'success');
      return;
    }

    if (format === 'jpg') {
      const canvas = await buildEditedCanvas();
      const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
      await triggerDownloadBlob(blob, 'jpg');
      showToast('JPG download started.', 'success');
      return;
    }

    if (format === 'pdf') {
      const originalHtml = buttons.downloadPdfBtn.innerHTML;
      buttons.downloadPdfBtn.disabled = true;
      buttons.downloadPdfBtn.innerHTML = 'Building PDF…';
      try {
        const edited = await buildEditedCanvas();
        const pageSize = pdfPageSizeEl.value;
        const pdfBlob = await buildPdfFromCanvas(edited, pageSize, canvasToBlob);
        await triggerDownloadBlob(pdfBlob, 'pdf');
        showToast('PDF download started.', 'success');
      } finally {
        buttons.downloadPdfBtn.disabled = false;
        buttons.downloadPdfBtn.innerHTML = originalHtml;
      }
      return;
    }

    throw new Error(`Unsupported export format: ${format}`);
  }

  async function copyToClipboard(options = {}) {
    const currentBlob = getCurrentBlob();
    if (!currentBlob) {
      throw new Error('Copy is unavailable before image load.');
    }
    if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
      throw new Error('Clipboard image copy is not supported in this browser context.');
    }

    const base = await buildEditedCanvas();
    const settings = getSettings();
    const shouldFit = Boolean(options.forceDocsFit) || Boolean(settings.fitClipboardToDocsLimit);
    const fitted = maybeFitForDocsLimit(base, shouldFit);
    const blob = await canvasToBlob(fitted, 'image/png');
    const item = new ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([item]);

    if (fitted !== base) {
      showToast('Copied (resized to Docs-safe limit).', 'info');
    } else {
      showToast('Copied image to clipboard.', 'success');
    }
  }

  function maybeFitForDocsLimit(canvas, shouldFit) {
    if (!shouldFit) return canvas;
    const pixels = canvas.width * canvas.height;
    if (pixels <= GOOGLE_DOCS_PIXEL_LIMIT) return canvas;

    const scale = Math.sqrt(GOOGLE_DOCS_PIXEL_LIMIT / pixels);
    const out = document.createElement('canvas');
    out.width = Math.max(1, Math.floor(canvas.width * scale));
    out.height = Math.max(1, Math.floor(canvas.height * scale));
    const ctx = out.getContext('2d');
    if (!ctx) return canvas;
    ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, out.width, out.height);
    return out;
  }

  async function triggerDownloadBlob(blob, ext) {
    const hasDownloads = await chrome.permissions.contains({
      permissions: ['downloads'],
    });
    const titleText = document.title.replace(/^THE Collector\s*·\s*/i, '').trim() || 'screenshot';

    if (hasDownloads) {
      try {
        const result = await chrome.runtime.sendMessage({
          type: MSG.PT_DOWNLOAD,
          payload: {
            blob,
            ext,
            title: titleText,
          },
        });
        if (!result?.ok) {
          throw new Error(result?.error || 'downloads.download failed');
        }
        return;
      } catch (_) {
        // Fallback to anchor download if runtime messaging fails.
      }
    }

    const fallbackName = `screenshot-${Date.now()}.${ext}`;
    await anchorDownloadBlob({ blob, filename: fallbackName });
  }

  async function maybeAutoDownload() {
    const settings = getSettings();
    if (settings.autoDownloadMode !== 'after_preview' || hasAutoDownloaded) return;
    hasAutoDownloaded = true;
    setTimeout(() => {
      runExport(settings.defaultExportFormat).catch((err) => {
        showError(`Auto-download failed: ${err.message}`);
      });
    }, 250);
  }

  function bindEvents() {
    buttons.downloadPngBtn.addEventListener('click', async () => {
      await runExport('png').catch((err) => showError(`PNG export failed: ${err.message}`));
    });

    buttons.downloadJpgBtn.addEventListener('click', async () => {
      await runExport('jpg').catch((err) => showError(`JPG export failed: ${err.message}`));
    });

    buttons.downloadPdfBtn.addEventListener('click', async () => {
      await runExport('pdf').catch((err) => showError(`PDF export failed: ${err.message}`));
    });

    buttons.copyImageBtn.addEventListener('click', async () => {
      await copyToClipboard().catch((err) => showError(`Copy failed: ${err.message}`));
    });

    if (buttons.presetEmailBtn) {
      buttons.presetEmailBtn.addEventListener('click', async () => {
        await runPreset('email').catch((err) => showError(`Email preset failed: ${err.message}`));
      });
    }
    if (buttons.presetDocsBtn) {
      buttons.presetDocsBtn.addEventListener('click', async () => {
        await runPreset('docs').catch((err) => showError(`Docs preset failed: ${err.message}`));
      });
    }
    if (buttons.presetPdfAutoBtn) {
      buttons.presetPdfAutoBtn.addEventListener('click', async () => {
        await runPreset('pdf_auto').catch((err) => showError(`PDF Auto preset failed: ${err.message}`));
      });
    }
  }

  return {
    bindEvents,
    maybeAutoDownload,
  };
}
