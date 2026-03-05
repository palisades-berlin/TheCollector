export function sanitizeHttpUrl(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
  } catch (_) {
    return '';
  }
  return '';
}

export function setSourceUrlLink(sourceUrlEl, url) {
  const safeUrl = sanitizeHttpUrl(url);
  sourceUrlEl.textContent = url || '';
  if (safeUrl) {
    sourceUrlEl.href = safeUrl;
    sourceUrlEl.target = '_blank';
    sourceUrlEl.rel = 'noopener noreferrer';
    sourceUrlEl.removeAttribute('aria-disabled');
    sourceUrlEl.style.pointerEvents = '';
    return;
  }
  sourceUrlEl.removeAttribute('href');
  sourceUrlEl.removeAttribute('target');
  sourceUrlEl.removeAttribute('rel');
  sourceUrlEl.setAttribute('aria-disabled', 'true');
  sourceUrlEl.style.pointerEvents = 'none';
}

export function setSourceUrlTextForDiff(sourceUrlEl, baseUrl, compareUrl) {
  const base = safeText(baseUrl) || '(unknown)';
  const next = safeText(compareUrl) || '(unknown)';
  sourceUrlEl.textContent = `Diff: ${base} vs ${next}`;
  sourceUrlEl.removeAttribute('href');
  sourceUrlEl.removeAttribute('target');
  sourceUrlEl.removeAttribute('rel');
  sourceUrlEl.setAttribute('aria-disabled', 'true');
  sourceUrlEl.style.pointerEvents = 'none';
}

export async function loadBlobIntoPreview({
  blob,
  screenshotImg,
  loadingEl,
  imageSkeletonEl,
  stageEl,
  onImageReady,
}) {
  const objectUrl = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      screenshotImg.onload = null;
      screenshotImg.onerror = null;
      URL.revokeObjectURL(objectUrl);
    };

    screenshotImg.onload = () => {
      const naturalW = screenshotImg.naturalWidth;
      const naturalH = screenshotImg.naturalHeight;
      loadingEl.classList.add('hidden');
      imageSkeletonEl.classList.add('hidden');
      stageEl.classList.remove('hidden');
      screenshotImg.classList.remove('hidden');
      onImageReady({ naturalW, naturalH });
      cleanup();
      resolve({ naturalW, naturalH });
    };

    screenshotImg.onerror = () => {
      cleanup();
      reject(new Error('Failed to render screenshot image.'));
    };

    screenshotImg.src = objectUrl;
  });
}

function safeText(s) {
  return String(s).replace(/\s+/g, ' ').trim();
}
