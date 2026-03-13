export function createThumbLoader({
  getScreenshotThumb = async (_id) => null,
  getScreenshot,
  saveScreenshotThumb = async (_id, _thumbBlob, _timestamp) => {},
  deleteScreenshots,
  logNonFatal,
  debugEnabled = false,
  concurrency = 4,
  maxPending = 48,
  eagerVisibleCount = 4,
}) {
  const queue = [];
  let workers = 0;
  let generation = 0;
  let observer = null;
  const pendingByCanvas = new Map();

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
    generation++;
    queue.length = 0;
    pendingByCanvas.clear();
    observer?.disconnect();
    observer = null;
    debug('reset');
  }

  function enqueue(id, canvasEl, options = {}) {
    if (!canvasEl) return;
    if (options.eager === true) {
      const task = { id, canvasEl, generation, observedAt: Date.now() };
      if (queue.length >= maxPending) queue.shift();
      queue.push(task);
      debug('enqueue-eager', { id });
      drain();
      return;
    }
    ensureObserver();
    pendingByCanvas.set(canvasEl, {
      id,
      canvasEl,
      generation,
      observedAt: Date.now(),
    });
    observer.observe(canvasEl);
    debug('observe', { id });
  }

  function drain() {
    while (workers < concurrency && queue.length > 0) {
      const next = queue.shift();
      if (!next || next.generation !== generation || !next.canvasEl?.isConnected) continue;
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

  function ensureObserver() {
    if (observer) return observer;
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const task = pendingByCanvas.get(entry.target);
          if (!task) continue;
          if (!entry.isIntersecting) continue;
          pendingByCanvas.delete(entry.target);
          observer.unobserve(entry.target);
          if (task.generation !== generation) continue;
          if (queue.length >= maxPending) {
            // Drop oldest queued thumbnail requests to keep memory predictable.
            queue.shift();
          }
          queue.push(task);
          debug('enqueue-visible', { id: task.id });
        }
        drain();
      },
      { root: null, rootMargin: '420px 0px', threshold: 0.01 }
    );
    return observer;
  }

  async function loadCardThumb(id, canvasEl) {
    if (!canvasEl?.isConnected) return;
    const sourceBlobs = [];
    let usedLowResThumb = false;
    const thumbEntry = await getScreenshotThumb(id).catch((err) => {
      logNonFatal('getScreenshotThumb', err);
      return null;
    });
    if (thumbEntry?.thumbBlob instanceof Blob && thumbEntry.thumbBlob.size > 0) {
      sourceBlobs.push(thumbEntry.thumbBlob);
    }

    const shouldFetchRecordFallback = sourceBlobs.length === 0 || thumbEntry?.thumbBlob;
    const record = shouldFetchRecordFallback ? await getScreenshot(id) : null;
    if (sourceBlobs.length === 0) {
      sourceBlobs.push(...buildThumbSourceBlobs({ thumbEntry: null, record }));
    } else if (record?.blob instanceof Blob && record.blob.size > 0) {
      sourceBlobs.push(record.blob);
    }
    if (
      sourceBlobs.length > 0 &&
      record?.thumbBlob instanceof Blob &&
      record.thumbBlob.size > 0 &&
      !thumbEntry?.thumbBlob
    ) {
      saveScreenshotThumb(id, record.thumbBlob, record.timestamp).catch((err) =>
        logNonFatal('saveScreenshotThumb', err)
      );
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
        if (sourceBlob === thumbEntry?.thumbBlob && isBitmapTooSmallForCanvas(bitmap, canvasEl)) {
          usedLowResThumb = true;
          continue;
        }
        drawThumbBitmapWidthPriority(canvasEl, bitmap);
        if (usedLowResThumb && record?.blob instanceof Blob && sourceBlob === record.blob) {
          const regenerated = await createDisplayThumbBlob(bitmap).catch((err) => {
            logNonFatal('createDisplayThumbBlob', err);
            return null;
          });
          if (regenerated) {
            saveScreenshotThumb(id, regenerated, record.timestamp).catch((err) =>
              logNonFatal('saveScreenshotThumb.regenerated', err)
            );
          }
        }
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
    eagerVisibleCount,
  };
}

export function buildThumbSourceBlobs({ thumbEntry, record }) {
  const sourceBlobs = [];
  if (thumbEntry?.thumbBlob instanceof Blob && thumbEntry.thumbBlob.size > 0) {
    sourceBlobs.push(thumbEntry.thumbBlob);
  }
  if (record?.thumbBlob instanceof Blob && record.thumbBlob.size > 0) {
    sourceBlobs.push(record.thumbBlob);
  }
  if (record?.blob instanceof Blob && record.blob.size > 0) {
    sourceBlobs.push(record.blob);
  }
  return sourceBlobs;
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

function isBitmapTooSmallForCanvas(bitmap, canvas) {
  const targetW = Math.max(1, canvas.clientWidth || 320);
  return Number(bitmap?.width || 0) < Math.max(160, targetW * 0.55);
}

async function createDisplayThumbBlob(bitmap) {
  const outW = 960;
  const outH = 720;
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const scale = outW / Math.max(1, bitmap.width || 1);
  const drawH = Math.max(1, Math.round((bitmap.height || 1) * scale));
  ctx.fillStyle = '#e9eef5';
  ctx.fillRect(0, 0, outW, outH);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, outW, drawH);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('thumb regeneration blob failed'));
      },
      'image/jpeg',
      0.9
    );
  });
}
