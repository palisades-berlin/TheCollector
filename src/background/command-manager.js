/**
 * Creates keyboard command handlers for background capture actions.
 *
 * @param {{
 *  chromeApi?: typeof chrome,
 *  captureService: { captureTab: (tabId: number, options?: unknown) => Promise<unknown> }
 * }} deps
 * @returns {{
 *  initCommandManager: () => void,
 *  disposeCommandManager: () => void
 * }}
 */
export function createCommandManager(deps) {
  const chromeApi = deps.chromeApi || chrome;
  const { captureService } = deps;

  /** @type {(command: string) => Promise<void>} */
  const onCommand = async (command) => {
    if (command !== 'capture-fullpage') return;
    const [tab] = await chromeApi.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    captureService
      .captureTab(tab.id)
      .catch((err) => console.error('[THE Collector] Capture error:', err));
  };

  function initCommandManager() {
    chromeApi.commands.onCommand.addListener(onCommand);
  }

  function disposeCommandManager() {
    chromeApi.commands.onCommand.removeListener?.(onCommand);
  }

  return {
    initCommandManager,
    disposeCommandManager,
  };
}
