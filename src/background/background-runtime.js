/**
 * Creates shared service-worker runtime helpers.
 *
 * @param {{ chromeApi?: typeof chrome, debugFlag?: string }} [options]
 * @returns {{ logNonFatal: (context: string, err: unknown) => void, broadcast: (type: string, payload: unknown) => void, sleep: (ms: number) => Promise<void> }}
 */
export function createBackgroundRuntime(options = {}) {
  const chromeApi = options.chromeApi || chrome;
  const debugFlag = options.debugFlag || 'THE_COLLECTOR_DEBUG_NON_FATAL';

  function logNonFatal(context, err) {
    if (globalThis?.[debugFlag] !== true) return;
    console.debug('[THE Collector][non-fatal]', context, err);
  }

  function broadcast(type, payload) {
    chromeApi.runtime.sendMessage({ type, payload }).catch((err) => logNonFatal('broadcast', err));
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  return {
    logNonFatal,
    broadcast,
    sleep,
  };
}
