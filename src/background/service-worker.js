import { MSG } from '../shared/messages.js';
import { buildDownloadFilename } from '../shared/filename.js';
import {
  validateCaptureStartPayload,
  validateCaptureQueueStartPayload,
  validatePreviewDownloadPayload,
} from '../shared/protocol-validate.js';
import { getUserSettings } from '../shared/repos/settings-repo.js';
import { loadUrlList, saveUrlList, appendUrlHistoryEntry } from '../shared/repos/url-repo.js';
import { hasDownloadsPermission, downloadBlob } from './downloads.js';
import { createCaptureService } from './capture-service.js';
import { cleanUrl, isCollectibleUrl, normalizeUrlForCompare } from '../shared/url-utils.js';
import { URL_HISTORY_ACTION } from '../shared/url-history.js';
import { evaluateRevisitNudge } from '../shared/nudges.js';
import { loadRevisitNudgeState } from '../shared/repos/nudge-repo.js';
import { listScreenshotMetaRecords } from '../shared/repos/screenshot-repo.js';
import { canUseFeature } from '../shared/capabilities.js';
import { CAPTURE_QUEUE_SESSION_KEY, CAPTURE_QUEUE_STORAGE_KEY } from '../shared/constants.js';
import { CAPTURE_PROFILE } from '../shared/capture-profiles.js';
import { createBackgroundRuntime } from './background-runtime.js';
import { createQueueStateManager } from './queue-state.js';
import { createNudgeAlarmManager } from './nudge-alarm-manager.js';
import { createContextMenuManager } from './context-menu-manager.js';
import { createOmniboxManager } from './omnibox-manager.js';
import { createMessageRouter } from './message-router.js';
import { createLifecycleHandler } from './lifecycle-handler.js';
import { createCommandManager } from './command-manager.js';

/** @typedef {import('../shared/types.js').UserSettings} UserSettings */

const captureService = createCaptureService();
const { logNonFatal, broadcast, sleep } = createBackgroundRuntime({
  chromeApi: chrome,
  debugFlag: 'THE_COLLECTOR_DEBUG_NON_FATAL',
});

const queueState = createQueueStateManager({
  chromeApi: chrome,
  constants: {
    CAPTURE_QUEUE_STORAGE_KEY,
    CAPTURE_QUEUE_SESSION_KEY,
  },
  logNonFatal,
  isCollectibleUrl,
  sleep,
});

const nudgeAlarms = createNudgeAlarmManager({
  chromeApi: chrome,
  getUserSettings,
  canUseFeature,
  listScreenshotMetaRecords,
  loadRevisitNudgeState,
  evaluateRevisitNudge,
  logNonFatal,
});

const contextMenus = createContextMenuManager({
  chromeApi: chrome,
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
});

const omnibox = createOmniboxManager({
  chromeApi: chrome,
  getUserSettings,
  canUseFeature,
  enqueueTabForCapture: queueState.enqueueTabForCapture,
  collectUrl: contextMenus.collectUrl,
  CAPTURE_PROFILE,
  MSG,
  broadcast,
});

const messageRouter = createMessageRouter({
  chromeApi: chrome,
  MSG,
  validateCaptureStartPayload,
  validateCaptureQueueStartPayload,
  validatePreviewDownloadPayload,
  captureService,
  getUserSettings,
  hasDownloadsPermission,
  downloadBlob,
  buildDownloadFilename,
  readQueueState: queueState.readQueueState,
  writeQueueState: queueState.writeQueueState,
  markQueueTabProcessed: queueState.markQueueTabProcessed,
  activateTabForCapture: queueState.activateTabForCapture,
  buildHistoryQueueSummaryUrl: queueState.buildHistoryQueueSummaryUrl,
  logNonFatal,
  broadcast,
});

const lifecycle = createLifecycleHandler({
  chromeApi: chrome,
  createOrRefreshContextMenus: contextMenus.createOrRefreshContextMenus,
  scheduleNudgeAlarm: nudgeAlarms.scheduleNudgeAlarm,
  checkAndUpdateNudgeBadge: nudgeAlarms.checkAndUpdateNudgeBadge,
});

const commands = createCommandManager({
  chromeApi: chrome,
  captureService,
});

function initAll() {
  nudgeAlarms.initNudgeAlarmManager();
  contextMenus.initContextMenuManager();
  omnibox.initOmniboxManager();
  messageRouter.initMessageRouter();
  lifecycle.initLifecycleHandlers();
  commands.initCommandManager();
}

function disposeAll() {
  commands.disposeCommandManager();
  lifecycle.disposeLifecycleHandlers();
  messageRouter.disposeMessageRouter();
  omnibox.disposeOmniboxManager();
  contextMenus.disposeContextMenuManager();
  nudgeAlarms.disposeNudgeAlarmManager();
}

initAll();

export { disposeAll };
