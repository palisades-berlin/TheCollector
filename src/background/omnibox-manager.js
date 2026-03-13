/**
 * Creates omnibox handlers for Ultra actions.
 *
 * @param {{
 *  chromeApi?: typeof chrome,
 *  getUserSettings: () => Promise<unknown>,
 *  canUseFeature: (featureKey: string, settings: unknown) => boolean,
 *  enqueueTabForCapture: (tab: chrome.tabs.Tab | undefined, profileId?: string | null) => Promise<unknown>,
 *  collectUrl: (rawUrl: string, meta?: Record<string, unknown>) => Promise<unknown>,
 *  CAPTURE_PROFILE: { RESEARCH: string },
 *  MSG: { SW_ERROR: string },
 *  broadcast: (type: string, payload: unknown) => void
 * }} deps
 * @returns {{
 *  initOmniboxManager: () => void,
 *  disposeOmniboxManager: () => void
 * }}
 */
export function createOmniboxManager(deps) {
  const chromeApi = deps.chromeApi || chrome;
  const {
    getUserSettings,
    canUseFeature,
    enqueueTabForCapture,
    collectUrl,
    CAPTURE_PROFILE,
    MSG,
    broadcast,
  } = deps;

  function resolveOmniboxAction(input) {
    const query = String(input || '')
      .trim()
      .toLowerCase();
    if (query === 'tc research' || query === 'research') return 'research';
    if (query === 'tc star' || query === 'star') return 'star';
    if (query === 'tc queue' || query === 'queue') return 'queue';
    return '';
  }

  /** @type {(text: string, suggest: (results: chrome.omnibox.SuggestResult[]) => void) => void} */
  const onInputChanged = (_text, suggest) => {
    suggest([
      { content: 'tc research', description: 'Queue current tab with Research profile (Ultra)' },
      { content: 'tc star', description: 'Save current page URL to URL list (Ultra)' },
      { content: 'tc queue', description: 'Queue current tab for batch capture (Ultra)' },
    ]);
  };

  /** @type {(text: string) => Promise<void>} */
  const onInputEntered = async (text) => {
    const action = resolveOmniboxAction(text);
    const [tab] = await chromeApi.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    try {
      const settings = /** @type {any} */ (await getUserSettings());
      if (!canUseFeature('omnibox_actions', settings)) {
        await chromeApi.tabs.create({ url: chromeApi.runtime.getURL('src/options/options.html') });
        return;
      }
      if (action === 'research') {
        await enqueueTabForCapture(tab, CAPTURE_PROFILE.RESEARCH);
        return;
      }
      if (action === 'star') {
        await collectUrl(tab.url || '', { via: 'omnibox_star', intent: 'star' });
        return;
      }
      if (action === 'queue') {
        await enqueueTabForCapture(tab, null);
        return;
      }
      await chromeApi.tabs.create({ url: chromeApi.runtime.getURL('src/history/history.html') });
    } catch (err) {
      const message = /** @type {any} */ (err)?.message || 'Omnibox action failed';
      broadcast(MSG.SW_ERROR, { error: message });
    }
  };

  function initOmniboxManager() {
    chromeApi.omnibox?.onInputChanged?.addListener(onInputChanged);
    chromeApi.omnibox?.onInputEntered?.addListener(onInputEntered);
  }

  function disposeOmniboxManager() {
    chromeApi.omnibox?.onInputChanged?.removeListener?.(onInputChanged);
    chromeApi.omnibox?.onInputEntered?.removeListener?.(onInputEntered);
  }

  return {
    initOmniboxManager,
    disposeOmniboxManager,
  };
}
