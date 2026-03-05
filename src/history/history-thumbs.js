export function createThumbLoader({
  getScreenshot,
  deleteScreenshots,
  logNonFatal,
  debugEnabled = false,
  concurrency = 4,
}) {
  const queue = [];
  let workers = 0;

  function debug(event, extra = {}) {
    if (!debugEnabled) return;
    console.debug('[THE Collector][HistoryThumbQueue]', {
      event,
      queueDepth: queue.length,
      activeWorkers: workers,
      ...extra,
    });
  }

  function resetQueue() {
    queue.length = 0;
    debug('reset');
  }

  function enqueue(id, canvasEl) {
    queue.push({ id, canvasEl });
    debug('enqueue', { id });
    drain();
  }

  function drain() {
    while (workers < concurrency && queue.length > 0) {
      const next = queue.shift();
      workers++;
      debug('start', { id: next.id });
      loadCardThumbWhenReady(next.id, next.canvasEl)
        .catch(() => {
          const canvas = next.canvasEl;
          if (canvas?.isConnected) {
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvas.width || 1, canvas.height || 1);
            canvas.classList.add('thumb-broken');
          }
          debug('error', { id: next.id });
        })
        .finally(() => {
          workers--;
          debug('done', { id: next.id });
          drain();
        });
    }
  }

  async function loadCardThumb(id, canvasEl) {
    if (!canvasEl?.isConnected) return;
    const record = await getScreenshot(id);
    if (!record?.blob) {
      await deleteScreenshots([id]).catch((err) => logNonFatal('deleteScreenshots', err));
      return;
    }
    const thumbBlob =
      record.thumbBlob instanceof Blob && record.thumbBlob.size > 0
        ? record.thumbBlob
        : record.blob;
    const bitmap = await createImageBitmap(thumbBlob);
    try {
      if (!canvasEl.isConnected) return;
      drawThumbBitmapCover(canvasEl, bitmap);
    } finally {
      if (typeof bitmap.close === 'function') bitmap.close();
    }
  }

  async function loadCardThumbWhenReady(id, canvasEl) {
    if (!canvasEl) return;
    for (let i = 0; i < 10; i++) {
      if (canvasEl.isConnected && canvasEl.clientWidth > 0 && canvasEl.clientHeight > 0) {
        break;
      }
      await nextFrame();
    }
    await loadCardThumb(id, canvasEl);
  }

  return {
    resetQueue,
    enqueue,
  };
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function drawThumbBitmapCover(canvas, bitmap) {
  const targetW = Math.max(1, canvas.clientWidth || 320);
  const targetH = Math.max(1, canvas.clientHeight || 240);
  const ratio = Math.max(targetW / bitmap.width, targetH / bitmap.height);
  const drawW = Math.max(1, Math.round(bitmap.width * ratio));
  const drawH = Math.max(1, Math.round(bitmap.height * ratio));
  const dx = Math.round((targetW - drawW) / 2);
  const dy = Math.round((targetH - drawH) / 2);

  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, targetW, targetH);
  ctx.drawImage(bitmap, dx, dy, drawW, drawH);
}
