import { MSG } from '../shared/messages.js';
import { showToast } from '../shared/toast.js';
import { loadUrlList } from '../shared/repos/url-repo.js';
import { getUserSettings } from '../shared/repos/settings-repo.js';
import { listScreenshotMetaRecords } from '../shared/repos/screenshot-repo.js';
import {
  dismissRevisitNudge,
  loadRevisitNudgeState,
  snoozeRevisitNudges,
} from '../shared/repos/nudge-repo.js';
import { applySavedTheme } from '../shared/theme.js';
import { canUseFeature } from '../shared/capabilities.js';
import {
  DEFAULT_CAPTURE_PROFILE_ID,
  listCaptureProfiles,
  normalizeCaptureProfileId,
} from '../shared/capture-profiles.js';
import { buildCaptureQueuePayload, buildCaptureStartPayload } from './popup-profile-payload.js';
import { evaluateRevisitNudge } from '../shared/nudges.js';
import { addTabsToQueue, normalizeQueueEntries, removeFromQueue } from './capture-queue.js';
import { CAPTURE_QUEUE_STORAGE_KEY, SCREENSHOT_ITEM_LIMIT } from '../shared/constants.js';

const POPUP_DEBUG =
  new URLSearchParams(location.search).get('debugPopupPerf') === '1' ||
  window.localStorage.getItem('sc_debug_popup_perf') === '1';
const popupInitStartedAt = performance.now();

const captureTabBtn = document.getElementById('captureTabBtn');
const urlsTabBtn = document.getElementById('urlsTabBtn');
const libraryTabBtn = document.getElementById('libraryTabBtn');
const capturePanel = document.getElementById('capturePanel');
const urlsPanel = document.getElementById('urlsPanel');

const captureBtn = document.getElementById('captureBtn');
const captureProfilesRegion = document.getElementById('captureProfilesRegion');
const captureProfilesList = document.getElementById('captureProfilesList');
const captureQueueRegion = document.getElementById('captureQueueRegion');
const queueCurrentBtn = document.getElementById('queueCurrentBtn');
const queueWindowBtn = document.getElementById('queueWindowBtn');
const runQueueBtn = document.getElementById('runQueueBtn');
const clearQueueBtn = document.getElementById('clearQueueBtn');
const captureQueueMeta = document.getElementById('captureQueueMeta');
const captureQueueList = document.getElementById('captureQueueList');
const revisitNudgeRegion = document.getElementById('revisitNudgeRegion');
const revisitNudgeText = document.getElementById('revisitNudgeText');
const revisitNudgeOpenBtn = document.getElementById('revisitNudgeOpenBtn');
const revisitNudgeSnoozeBtn = document.getElementById('revisitNudgeSnoozeBtn');
const revisitNudgeDismissBtn = document.getElementById('revisitNudgeDismissBtn');
const progressEl = document.getElementById('progress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const doneMsgEl = document.getElementById('doneMsg');
const doneMsgTextEl = document.getElementById('doneMsgText');
const historyBtn = document.getElementById('historyBtn');
const optionsBtn = document.getElementById('optionsBtn');
const urlCount = document.getElementById('urlCount');

let capturing = false;
let urlsInitPromise = null;
let smartProfilesEnabled = false;
let defaultCaptureProfileId = DEFAULT_CAPTURE_PROFILE_ID;
let currentRevisitNudgeId = null;
let queueBatchEnabled = false;
let runningQueue = false;
let captureQueue = [];
const ERROR_TOAST_DEDUP_MS = 1200;
let lastErrorToastMessage = '';
let lastErrorToastAt = 0;

function reportNonFatal(context, err) {
  console.error('[THE Collector][non-fatal]', context, err);
}

function perfLog(label, extra = {}) {
  if (!POPUP_DEBUG) return;
  const sinceStartMs = Number((performance.now() - popupInitStartedAt).toFixed(1));
  console.debug('[THE Collector][PopupPerf]', { label, sinceStartMs, ...extra });
}

function setActiveTab(mode) {
  const showCapture = mode === 'capture';
  captureTabBtn.classList.toggle('active', showCapture);
  urlsTabBtn.classList.toggle('active', !showCapture);
  if (libraryTabBtn) libraryTabBtn.classList.remove('active');
  captureTabBtn.setAttribute('aria-selected', showCapture ? 'true' : 'false');
  urlsTabBtn.setAttribute('aria-selected', showCapture ? 'false' : 'true');
  capturePanel.classList.toggle('hidden', !showCapture);
  urlsPanel.classList.toggle('hidden', showCapture);
  if (showCapture) {
    captureTabBtn.focus();
  } else {
    urlsTabBtn.focus();
  }
}

async function loadPersistedCaptureQueue() {
  const store = chrome.storage?.session || chrome.storage?.local;
  if (!store?.get) return [];
  try {
    const state = await store.get({ [CAPTURE_QUEUE_STORAGE_KEY]: [] });
    return normalizeQueueEntries(state?.[CAPTURE_QUEUE_STORAGE_KEY]);
  } catch (err) {
    reportNonFatal('loadPersistedCaptureQueue', err);
    return [];
  }
}

async function persistCaptureQueue() {
  const store = chrome.storage?.session || chrome.storage?.local;
  if (!store?.set) return;
  try {
    await store.set({ [CAPTURE_QUEUE_STORAGE_KEY]: normalizeQueueEntries(captureQueue) });
  } catch (err) {
    reportNonFatal('persistCaptureQueue', err);
  }
}

async function ensureUrlsPanelReady() {
  const startedAt = performance.now();
  perfLog('urlsPanel.ensure.start');
  if (urlsInitPromise) {
    await urlsInitPromise;
    perfLog('urlsPanel.ensure.reuse', {
      durationMs: Number((performance.now() - startedAt).toFixed(1)),
    });
    return;
  }
  urlsInitPromise = (async () => {
    const mod = await import('./urls-panel.js');
    await mod.initUrlsPanel();
  })();
  try {
    await urlsInitPromise;
    perfLog('urlsPanel.ensure.done', {
      durationMs: Number((performance.now() - startedAt).toFixed(1)),
    });
  } catch (err) {
    urlsInitPromise = null;
    perfLog('urlsPanel.ensure.error', {
      durationMs: Number((performance.now() - startedAt).toFixed(1)),
      error: String(err?.message || err || 'unknown'),
    });
    throw err;
  }
}

captureTabBtn.addEventListener('click', () => setActiveTab('capture'));
urlsTabBtn.addEventListener('click', () => {
  setActiveTab('urls');
  perfLog('urlsTab.click');
  ensureUrlsPanelReady().catch((err) => {
    reportNonFatal('load URL panel', err);
    showToast('Could not load URL panel');
  });
});
libraryTabBtn?.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('src/urls/urls.html') });
  window.close();
});

for (const tabButton of [captureTabBtn, urlsTabBtn]) {
  tabButton.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    if (tabButton === captureTabBtn) {
      setActiveTab('urls');
      ensureUrlsPanelReady().catch((err) => {
        reportNonFatal('load URL panel', err);
        showToast('Could not load URL panel');
      });
    } else {
      setActiveTab('capture');
    }
  });
}

captureBtn.addEventListener('click', () =>
  triggerCapture(smartProfilesEnabled ? defaultCaptureProfileId : null)
);

async function triggerCapture(profileId = null) {
  if (capturing || runningQueue) return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    showError('No active tab found.');
    return;
  }
  await startCapture(tab.id, profileId).catch(() => {});
}

function setCaptureActionState() {
  captureBtn.disabled = capturing || runningQueue;
  if (queueCurrentBtn) queueCurrentBtn.disabled = capturing || runningQueue;
  if (queueWindowBtn) queueWindowBtn.disabled = capturing || runningQueue;
  if (runQueueBtn) runQueueBtn.disabled = capturing || runningQueue || captureQueue.length === 0;
  if (clearQueueBtn)
    clearQueueBtn.disabled = capturing || runningQueue || captureQueue.length === 0;
}

function startCapture(tabId, profileId = null, options = {}) {
  capturing = true;
  setCaptureActionState();
  capturePanel.setAttribute('aria-busy', 'true');
  if (!runningQueue) doneMsgEl.classList.add('hidden');
  progressEl.classList.remove('hidden');
  setProgress(0, 'Starting...');

  const payload = buildCaptureStartPayload(tabId, profileId, options);
  return chrome.runtime
    .sendMessage({ type: MSG.CAPTURE_START, payload })
    .then((res) => {
      if (res?.ok === false) throw new Error(res?.error || 'Capture failed');
      return res;
    })
    .catch((err) => {
      showError(err.message);
      throw err;
    });
}

function setProgress(percent, text) {
  progressFill.style.width = `${percent}%`;
  progressText.textContent = text || `${percent}%`;
}

function toFriendlyCaptureError(rawMessage) {
  const message = String(rawMessage || '').trim();
  const lower = message.toLowerCase();

  if (
    lower.includes('cannot access a chrome:// url') ||
    lower.includes('cannot access a edge:// url')
  ) {
    return 'Browser internal pages cannot be captured. Open a regular website tab and try again.';
  }

  if (lower.includes('cannot access contents of url') && lower.includes('chrome-extension://')) {
    return 'Extension pages cannot be captured. Switch to the webpage you want to capture and try again.';
  }

  if (
    lower.includes('extension manifest must request permission to access this host') ||
    lower.includes('cannot access contents of url')
  ) {
    return 'This page is restricted by browser permissions and cannot be captured. Try another tab.';
  }

  if (lower.includes('cannot access') && lower.includes('about:')) {
    return 'Special browser pages cannot be captured. Open a regular website tab and try again.';
  }

  if (lower.includes('no active tab found')) {
    return 'No active tab found. Click into a webpage tab and try again.';
  }

  if (lower.includes('storage limit reached')) {
    return `Storage limit reached (${SCREENSHOT_ITEM_LIMIT}). Delete screenshots or enable Auto-purge in Settings.`;
  }

  return message || 'Capture failed. Please try again on a regular webpage tab.';
}

function showError(msg) {
  capturing = false;
  setCaptureActionState();
  capturePanel.setAttribute('aria-busy', 'false');
  progressEl.classList.add('hidden');
  const friendly = toFriendlyCaptureError(msg);
  const now = Date.now();
  if (friendly === lastErrorToastMessage && now - lastErrorToastAt < ERROR_TOAST_DEDUP_MS) {
    return;
  }
  lastErrorToastMessage = friendly;
  lastErrorToastAt = now;
  showToast(friendly, 'error', 2600);
}

function showDone(payload = {}) {
  capturing = false;
  setCaptureActionState();
  capturePanel.setAttribute('aria-busy', 'false');
  progressEl.classList.add('hidden');
  doneMsgEl.classList.remove('hidden');

  if (payload.downloadedDirectly && payload.split && payload.partCount > 1) {
    doneMsgTextEl.textContent = `Done - downloaded ${payload.partCount} split images.`;
  } else if (payload.downloadedDirectly) {
    doneMsgTextEl.textContent = 'Done - downloaded screenshot.';
  } else if (payload.skippedPdfDirectDownload) {
    doneMsgTextEl.textContent = 'Done - PDF direct download not supported, opening preview...';
  } else if (payload.split && payload.partCount > 1) {
    doneMsgTextEl.textContent = `Done - split into ${payload.partCount} images. Opening part 1...`;
  } else if (payload.captureMode === 'iframe') {
    doneMsgTextEl.textContent = 'Done - iframe capture mode used. Opening preview...';
  } else if (payload.captureMode === 'element') {
    doneMsgTextEl.textContent = 'Done - inner scroll capture mode used. Opening preview...';
  } else {
    doneMsgTextEl.textContent = 'Done - opening preview...';
  }
}

historyBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('src/history/history.html') });
  window.close();
});

optionsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
  window.close();
});

chrome.runtime.onMessage.addListener((msg) => {
  switch (msg.type) {
    case MSG.SW_PROGRESS: {
      const percent = Number(msg?.payload?.percent ?? 0);
      const label = percent < 88 ? 'Capturing...' : percent < 100 ? 'Stitching...' : 'Done!';
      setProgress(percent, label);
      break;
    }
    case MSG.SW_DONE:
      if (!runningQueue) showDone(msg.payload || {});
      break;
    case MSG.SW_QUEUE_DONE: {
      const success = Number(msg?.payload?.success || 0);
      const failed = Number(msg?.payload?.failed || 0);
      doneMsgEl.classList.remove('hidden');
      doneMsgTextEl.textContent = `Queue finished: ${success} succeeded, ${failed} failed. Screenshots opened.`;
      loadPersistedCaptureQueue()
        .then((nextQueue) => {
          captureQueue = nextQueue;
          renderCaptureQueue();
        })
        .catch((err) => reportNonFatal('reload queue on SW_QUEUE_DONE', err));
      if (failed > 0) {
        showToast(`Queue finished: ${success} succeeded, ${failed} failed.`, 'info', 2600);
      }
      break;
    }
    case MSG.SW_ERROR:
      if (!runningQueue) showError(msg?.payload?.error || 'Unknown error');
      break;
    default:
      break;
  }
});

async function preloadUrlCount() {
  const startedAt = performance.now();
  perfLog('urlCount.preload.start');
  try {
    const urls = await loadUrlList();
    urlCount.textContent = `${urls.length} URL${urls.length === 1 ? '' : 's'}`;
    perfLog('urlCount.preload.done', {
      durationMs: Number((performance.now() - startedAt).toFixed(1)),
      count: urls.length,
    });
  } catch {
    // Keep default badge text if preload fails.
    perfLog('urlCount.preload.error', {
      durationMs: Number((performance.now() - startedAt).toFixed(1)),
    });
  }
}

async function initCaptureProfiles(settings) {
  smartProfilesEnabled = canUseFeature('smart_save_profiles', settings || {});
  defaultCaptureProfileId = normalizeCaptureProfileId(
    settings?.defaultCaptureProfileId || DEFAULT_CAPTURE_PROFILE_ID
  );

  if (!smartProfilesEnabled || !captureProfilesRegion || !captureProfilesList) {
    if (captureProfilesList) captureProfilesList.innerHTML = '';
    if (captureProfilesRegion) captureProfilesRegion.classList.add('hidden');
    return;
  }

  captureProfilesList.innerHTML = '';
  for (const profile of listCaptureProfiles()) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'capture-profile-btn sc-btn sc-btn-secondary';
    btn.textContent = profile.label;
    btn.dataset.profileId = profile.id;
    btn.setAttribute('aria-label', `Capture using ${profile.label} profile`);
    btn.addEventListener('click', () => triggerCapture(profile.id));
    captureProfilesList.appendChild(btn);
  }
  captureProfilesRegion.classList.remove('hidden');
}

function renderCaptureQueue() {
  if (!captureQueueMeta || !captureQueueList) return;
  captureQueueMeta.textContent =
    captureQueue.length === 0
      ? 'No tabs queued.'
      : `${captureQueue.length} tab${captureQueue.length === 1 ? '' : 's'} queued.`;
  captureQueueList.innerHTML = '';
  for (const item of captureQueue) {
    const row = document.createElement('div');
    row.className = 'capture-queue-item';

    const title = document.createElement('span');
    title.className = 'capture-queue-item-title';
    title.textContent = item.title;
    title.title = item.title;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'capture-queue-remove sc-btn sc-btn-ghost sc-btn-sm';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', async () => {
      if (runningQueue || capturing) return;
      captureQueue = removeFromQueue(captureQueue, item.tabId);
      await persistCaptureQueue();
      renderCaptureQueue();
      setCaptureActionState();
    });

    row.appendChild(title);
    row.appendChild(removeBtn);
    captureQueueList.appendChild(row);
  }
  setCaptureActionState();
}

async function addCurrentTabToQueue() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  captureQueue = addTabsToQueue(captureQueue, tab ? [tab] : []);
  await persistCaptureQueue();
  renderCaptureQueue();
}

async function addWindowTabsToQueue() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  captureQueue = addTabsToQueue(captureQueue, tabs || []);
  await persistCaptureQueue();
  renderCaptureQueue();
}

async function runCaptureQueue() {
  if (!queueBatchEnabled || runningQueue || capturing || captureQueue.length === 0) return;
  runningQueue = true;
  setCaptureActionState();
  doneMsgEl.classList.add('hidden');
  progressEl.classList.remove('hidden');
  setProgress(0, `Queue 0/${captureQueue.length}: starting…`);

  const tabIds = captureQueue
    .map((item) => Number(item.tabId))
    .filter((id) => Number.isInteger(id));
  const payload = buildCaptureQueuePayload(tabIds, smartProfilesEnabled, defaultCaptureProfileId);

  try {
    const res = await chrome.runtime.sendMessage({ type: MSG.CAPTURE_QUEUE_START, payload });
    if (res?.ok === false) throw new Error(res.error || 'Queue capture failed');
    captureQueue = await loadPersistedCaptureQueue();
    renderCaptureQueue();
  } catch (err) {
    showError(err?.message || 'Queue capture failed');
  } finally {
    runningQueue = false;
    setCaptureActionState();
  }
}

async function initCaptureQueue(settings) {
  queueBatchEnabled = canUseFeature('capture_queue_batch_mode', settings || {});
  if (!captureQueueRegion) return;
  captureQueue = queueBatchEnabled ? await loadPersistedCaptureQueue() : [];
  renderCaptureQueue();
  captureQueueRegion.classList.toggle('hidden', !queueBatchEnabled);
}

async function initRevisitNudge(settings) {
  currentRevisitNudgeId = null;
  if (!revisitNudgeRegion || !revisitNudgeText) return;

  const nudgesFeatureEnabled = canUseFeature('smart_revisit_nudges', settings || {});
  const nudgesEnabled = settings?.nudgesEnabled === true;
  if (!nudgesFeatureEnabled || !nudgesEnabled) {
    revisitNudgeRegion.classList.add('hidden');
    revisitNudgeText.textContent = '';
    return;
  }

  try {
    const [records, state] = await Promise.all([
      listScreenshotMetaRecords(),
      loadRevisitNudgeState(),
    ]);
    const nudge = evaluateRevisitNudge(records, {
      cadence: settings?.notificationCadence,
      state,
      now: Date.now(),
    });
    if (!nudge) {
      revisitNudgeRegion.classList.add('hidden');
      revisitNudgeText.textContent = '';
      return;
    }
    currentRevisitNudgeId = nudge.id;
    revisitNudgeText.textContent = nudge.message;
    revisitNudgeRegion.classList.remove('hidden');
  } catch (err) {
    reportNonFatal('initRevisitNudge', err);
    revisitNudgeRegion.classList.add('hidden');
    revisitNudgeText.textContent = '';
  }
}

revisitNudgeOpenBtn?.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('src/history/history.html') });
  window.close();
});

revisitNudgeDismissBtn?.addEventListener('click', async () => {
  if (!currentRevisitNudgeId) return;
  try {
    await dismissRevisitNudge(currentRevisitNudgeId);
    revisitNudgeRegion?.classList.add('hidden');
    showToast('Nudge dismissed.', 'info', 1800);
  } catch (err) {
    reportNonFatal('revisitNudgeDismiss', err);
  }
});

revisitNudgeSnoozeBtn?.addEventListener('click', async () => {
  try {
    await snoozeRevisitNudges(24 * 60 * 60 * 1000);
    revisitNudgeRegion?.classList.add('hidden');
    showToast('Nudges snoozed for 24 hours.', 'info', 1800);
  } catch (err) {
    reportNonFatal('revisitNudgeSnooze', err);
  }
});

queueCurrentBtn?.addEventListener('click', () => {
  addCurrentTabToQueue().catch((err) => reportNonFatal('addCurrentTabToQueue', err));
});

queueWindowBtn?.addEventListener('click', () => {
  addWindowTabsToQueue().catch((err) => reportNonFatal('addWindowTabsToQueue', err));
});

runQueueBtn?.addEventListener('click', () => {
  runCaptureQueue().catch((err) => reportNonFatal('runCaptureQueue', err));
});

clearQueueBtn?.addEventListener('click', async () => {
  if (runningQueue || capturing) return;
  captureQueue = [];
  await persistCaptureQueue();
  renderCaptureQueue();
  setCaptureActionState();
});

(async function init() {
  await applySavedTheme();
  perfLog('init.start');
  setActiveTab('capture');
  let settings = {};
  try {
    settings = await getUserSettings();
  } catch (err) {
    reportNonFatal('init.settings', err);
  }
  smartProfilesEnabled = canUseFeature('smart_save_profiles', settings || {});
  defaultCaptureProfileId = normalizeCaptureProfileId(
    settings?.defaultCaptureProfileId || DEFAULT_CAPTURE_PROFILE_ID
  );
  await initCaptureProfiles(settings);
  await initCaptureQueue(settings);
  await initRevisitNudge(settings);
  chrome.action?.setBadgeText?.({ text: '' });
  await preloadUrlCount();
  setCaptureActionState();
  perfLog('init.done');
})();
