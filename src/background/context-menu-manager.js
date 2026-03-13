/**
 * Creates context menu handlers for capture and URL collection actions.
 *
 * @param {{
 *  chromeApi?: typeof chrome,
 *  captureService: { captureTab: (tabId: number, options?: unknown) => Promise<unknown> },
 *  loadUrlList: () => Promise<string[]>,
 *  saveUrlList: (urls: string[]) => Promise<unknown>,
 *  appendUrlHistoryEntry: (entry: unknown) => Promise<unknown>,
 *  cleanUrl: (rawUrl: string) => string,
 *  isCollectibleUrl: (rawUrl: string) => boolean,
 *  normalizeUrlForCompare: (rawUrl: string) => string,
 *  URL_HISTORY_ACTION: { ADD_CURRENT: string },
 *  MSG: { SW_ERROR: string },
 *  broadcast: (type: string, payload: unknown) => void
 * }} deps
 * @returns {{
 *  collectUrl: (rawUrl: string, meta?: Record<string, unknown>) => Promise<{ ok: boolean, reason?: string, duplicate?: boolean, url?: string }>,
 *  createOrRefreshContextMenus: () => void,
 *  initContextMenuManager: () => void,
 *  disposeContextMenuManager: () => void
 * }}
 */
export function createContextMenuManager(deps) {
  const chromeApi = deps.chromeApi || chrome;
  const {
    captureService,
    loadUrlList,
    saveUrlList,
    appendUrlHistoryEntry,
    cleanUrl,
    isCollectibleUrl,
    normalizeUrlForCompare,
    URL_HISTORY_ACTION,
    MSG,
    broadcast,
  } = deps;

  const MENU_CAPTURE_PAGE = 'tc_capture_page';
  const MENU_COLLECT_PAGE = 'tc_collect_page_url';
  const MENU_COLLECT_LINK = 'tc_collect_link_url';

  async function collectUrl(rawUrl, meta = {}) {
    if (!isCollectibleUrl(rawUrl)) return { ok: false, reason: 'non_collectible' };
    const cleaned = cleanUrl(rawUrl);
    const normalized = normalizeUrlForCompare(cleaned);
    const urls = await loadUrlList();
    const alreadyExists = urls.some((existing) => normalizeUrlForCompare(existing) === normalized);
    if (alreadyExists) return { ok: true, duplicate: true, url: cleaned };
    const next = [cleaned, ...urls];
    await saveUrlList(next);
    await appendUrlHistoryEntry({
      actionType: URL_HISTORY_ACTION.ADD_CURRENT,
      urls: next,
      meta: { source: 'context_menu', ...meta },
    });
    return { ok: true, duplicate: false, url: cleaned };
  }

  function createOrRefreshContextMenus() {
    if (!chromeApi.contextMenus?.removeAll) return;
    chromeApi.contextMenus.removeAll(() => {
      chromeApi.contextMenus.create({
        id: MENU_CAPTURE_PAGE,
        title: 'Capture this page',
        contexts: ['page', 'selection'],
      });
      chromeApi.contextMenus.create({
        id: MENU_COLLECT_PAGE,
        title: 'Collect this page URL',
        contexts: ['page', 'selection'],
      });
      chromeApi.contextMenus.create({
        id: MENU_COLLECT_LINK,
        title: 'Collect this link URL',
        contexts: ['link'],
      });
    });
  }

  /** @type {(info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => Promise<void>} */
  const onContextMenuClicked = async (info, tab) => {
    try {
      if (info.menuItemId === MENU_CAPTURE_PAGE) {
        if (!tab?.id) return;
        await captureService.captureTab(tab.id);
        return;
      }

      if (info.menuItemId === MENU_COLLECT_PAGE) {
        const raw = tab?.url || info.pageUrl;
        const result = await collectUrl(raw || '', { via: 'page' });
        if (!result.ok) {
          broadcast(MSG.SW_ERROR, { error: 'This URL cannot be collected.' });
        }
        return;
      }

      if (info.menuItemId === MENU_COLLECT_LINK) {
        const result = await collectUrl(info.linkUrl || '', { via: 'link' });
        if (!result.ok) {
          broadcast(MSG.SW_ERROR, { error: 'This link URL cannot be collected.' });
        }
      }
    } catch (err) {
      const message = /** @type {any} */ (err)?.message || 'Action failed';
      broadcast(MSG.SW_ERROR, { error: message });
    }
  };

  function initContextMenuManager() {
    chromeApi.contextMenus?.onClicked?.addListener(onContextMenuClicked);
  }

  function disposeContextMenuManager() {
    chromeApi.contextMenus?.onClicked?.removeListener?.(onContextMenuClicked);
  }

  return {
    collectUrl,
    createOrRefreshContextMenus,
    initContextMenuManager,
    disposeContextMenuManager,
  };
}
