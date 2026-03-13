const NUDGE_ALARM_NAME = 'tc_nudge_check';
const NUDGE_ALARM_PERIOD_MINUTES = 240; // every 4 hours
const NUDGE_BADGE_TEXT = '!';
const NUDGE_BADGE_COLOR = '#E53935';

/**
 * Creates nudge alarm and badge handlers.
 *
 * @param {{
 *  chromeApi?: typeof chrome,
 *  getUserSettings: () => Promise<unknown>,
 *  canUseFeature: (featureKey: string, settings: unknown) => boolean,
 *  listScreenshotMetaRecords: () => Promise<unknown[]>,
 *  loadRevisitNudgeState: () => Promise<unknown>,
 *  evaluateRevisitNudge: (records: unknown[], options: { cadence?: unknown, state: unknown, now: number }) => unknown,
 *  logNonFatal: (context: string, err: unknown) => void
 * }} deps
 * @returns {{
 *  checkAndUpdateNudgeBadge: () => Promise<void>,
 *  scheduleNudgeAlarm: () => void,
 *  initNudgeAlarmManager: () => void,
 *  disposeNudgeAlarmManager: () => void
 * }}
 */
export function createNudgeAlarmManager(deps) {
  const chromeApi = deps.chromeApi || chrome;
  const {
    getUserSettings,
    canUseFeature,
    listScreenshotMetaRecords,
    loadRevisitNudgeState,
    evaluateRevisitNudge,
    logNonFatal,
  } = deps;

  /** @type {(alarm: chrome.alarms.Alarm) => void} */
  const onAlarm = (alarm) => {
    if (alarm.name === NUDGE_ALARM_NAME) {
      void checkAndUpdateNudgeBadge();
    }
  };

  async function checkAndUpdateNudgeBadge() {
    try {
      const settings = /** @type {any} */ (await getUserSettings());
      const nudgesEnabled =
        settings?.nudgesEnabled === true && canUseFeature('smart_revisit_nudges', settings);
      if (!nudgesEnabled) {
        await chromeApi.action.setBadgeText({ text: '' });
        return;
      }
      const [records, state] = await Promise.all([
        listScreenshotMetaRecords(),
        loadRevisitNudgeState(),
      ]);
      const nudge = evaluateRevisitNudge(records, {
        cadence: settings?.notificationCadence,
        state,
        now: Date.now(),
      });
      if (nudge) {
        await chromeApi.action.setBadgeBackgroundColor({ color: NUDGE_BADGE_COLOR });
        await chromeApi.action.setBadgeText({ text: NUDGE_BADGE_TEXT });
      } else {
        await chromeApi.action.setBadgeText({ text: '' });
      }
    } catch (err) {
      logNonFatal('checkAndUpdateNudgeBadge', err);
    }
  }

  function scheduleNudgeAlarm() {
    chromeApi.alarms.get(NUDGE_ALARM_NAME, (existing) => {
      if (!existing) {
        chromeApi.alarms.create(NUDGE_ALARM_NAME, { periodInMinutes: NUDGE_ALARM_PERIOD_MINUTES });
      }
    });
  }

  function initNudgeAlarmManager() {
    chromeApi.alarms?.onAlarm?.addListener(onAlarm);
  }

  function disposeNudgeAlarmManager() {
    chromeApi.alarms?.onAlarm?.removeListener?.(onAlarm);
  }

  return {
    checkAndUpdateNudgeBadge,
    scheduleNudgeAlarm,
    initNudgeAlarmManager,
    disposeNudgeAlarmManager,
  };
}
