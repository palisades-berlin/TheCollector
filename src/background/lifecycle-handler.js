/**
 * Creates install/startup lifecycle handlers.
 *
 * @param {{
 *  chromeApi?: typeof chrome,
 *  createOrRefreshContextMenus: () => void,
 *  scheduleNudgeAlarm: () => void,
 *  checkAndUpdateNudgeBadge: () => Promise<void>
 * }} deps
 * @returns {{
 *  initLifecycleHandlers: () => void,
 *  disposeLifecycleHandlers: () => void
 * }}
 */
export function createLifecycleHandler(deps) {
  const chromeApi = deps.chromeApi || chrome;
  const { createOrRefreshContextMenus, scheduleNudgeAlarm, checkAndUpdateNudgeBadge } = deps;

  /** @type {(details: chrome.runtime.InstalledDetails) => void} */
  const onInstalled = (details) => {
    createOrRefreshContextMenus();
    scheduleNudgeAlarm();
    if (details.reason === 'install') {
      const url = chromeApi.runtime.getURL('src/options/options.html?onboarding=1');
      chromeApi.tabs.create({ url });
    }
  };

  /** @type {() => void} */
  const onStartup = () => {
    createOrRefreshContextMenus();
    scheduleNudgeAlarm();
    void checkAndUpdateNudgeBadge();
  };

  function initLifecycleHandlers() {
    chromeApi.runtime.onInstalled.addListener(onInstalled);
    chromeApi.runtime.onStartup?.addListener(onStartup);
  }

  function disposeLifecycleHandlers() {
    chromeApi.runtime.onInstalled.removeListener?.(onInstalled);
    chromeApi.runtime.onStartup?.removeListener?.(onStartup);
  }

  return {
    initLifecycleHandlers,
    disposeLifecycleHandlers,
  };
}
