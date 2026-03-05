export function createEnsureOffscreen() {
  let offscreenReady = false;
  let offscreenInitPromise = null;

  async function hasOffscreenDocument() {
    try {
      const contexts = await chrome.offscreen.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
      });
      return contexts.length > 0;
    } catch (_) {
      return false;
    }
  }

  return async function ensureOffscreen() {
    if (offscreenReady) return;
    if (offscreenInitPromise) {
      await offscreenInitPromise;
      return;
    }

    offscreenInitPromise = (async () => {
      if (await hasOffscreenDocument()) {
        offscreenReady = true;
        return;
      }

      try {
        await chrome.offscreen.createDocument({
          url: chrome.runtime.getURL('src/offscreen/offscreen.html'),
          reasons: ['BLOBS'],
          justification: 'Stitch captured screenshot tiles into a full-page image',
        });
        offscreenReady = true;
      } catch (err) {
        if (await hasOffscreenDocument()) {
          offscreenReady = true;
          return;
        }
        const msg = err?.message || String(err || '');
        if (msg.includes('Only a single offscreen document may be created')) {
          offscreenReady = true;
          return;
        }
        throw err;
      }
    })();

    try {
      await offscreenInitPromise;
    } finally {
      offscreenInitPromise = null;
    }
  };
}
