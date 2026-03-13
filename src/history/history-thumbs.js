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
    const sourceBlobs = [];
    if (record?.blob instanceof Blob && record.blob.size > 0) {
      sourceBlobs.push(record.blob);
    }
    if (record?.thumbBlob instanceof Blob && record.thumbBlob.size > 0) {
      sourceBlobs.push(record.thumbBlob);
    }
    if (sourceBlobs.length === 0) {
      await deleteScreenshots([id]).catch((err) => logNonFatal('deleteScreenshots', err));
      return;
    }
    for (const sourceBlob of sourceBlobs) {
      let bitmap;
      try {
        bitmap = await createImageBitmap(sourceBlob);
        if (!canvasEl.isConnected) return;
        drawThumbBitmapWidthPriority(canvasEl, bitmap);
        return;
      } catch (err) {
        logNonFatal('createImageBitmap', err);
      } finally {
        if (typeof bitmap?.close === 'function') bitmap.close();
      }
    }
    throw new Error('Failed to decode thumbnail source');
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

function drawThumbBitmapWidthPriority(canvas, bitmap) {
  const targetW = Math.max(1, canvas.clientWidth || 320);
  const targetH = Math.max(1, canvas.clientHeight || 240);
  const dpr = Math.max(1, globalThis.devicePixelRatio || 1);
  const scale = targetW / Math.max(1, bitmap.width);
  const drawW = targetW;
  const drawH = Math.max(1, Math.round(bitmap.height * scale));
  const dx = 0;
  const dy = 0;

  canvas.width = Math.max(1, Math.round(targetW * dpr));
  canvas.height = Math.max(1, Math.round(targetH * dpr));
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const bgSource = canvas.parentElement || canvas;
  const bgColor = getComputedStyle(bgSource).backgroundColor || '#e9eef5';
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, targetW, targetH);
  ctx.drawImage(bitmap, dx, dy, drawW, drawH);
}
