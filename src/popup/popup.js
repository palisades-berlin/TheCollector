import { MSG } from '../shared/messages.js';
import { showToast } from '../shared/toast.js';
import { loadUrlList } from '../shared/repos/url-repo.js';
import { applySavedTheme } from '../shared/theme.js';

const POPUP_DEBUG =
  new URLSearchParams(location.search).get('debugPopupPerf') === '1' ||
  window.localStorage.getItem('sc_debug_popup_perf') === '1';
const popupInitStartedAt = performance.now();

const captureTabBtn = document.getElementById('captureTabBtn');
const urlsTabBtn = document.getElementById('urlsTabBtn');
const capturePanel = document.getElementById('capturePanel');
const urlsPanel = document.getElementById('urlsPanel');

const captureBtn = document.getElementById('captureBtn');
const progressEl = document.getElementById('progress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const doneMsgEl = document.getElementById('doneMsg');
const doneMsgTextEl = document.getElementById('doneMsgText');
const errorMsgEl = document.getElementById('errorMsg');
const historyBtn = document.getElementById('historyBtn');
const optionsBtn = document.getElementById('optionsBtn');
const urlCount = document.getElementById('urlCount');

let capturing = false;
let urlsInitPromise = null;

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

captureBtn.addEventListener('click', async () => {
  if (capturing) return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    showError('No active tab found.');
    return;
  }
  startCapture(tab.id);
});

function startCapture(tabId) {
  capturing = true;
  captureBtn.disabled = true;
  capturePanel.setAttribute('aria-busy', 'true');
  errorMsgEl.classList.add('hidden');
  doneMsgEl.classList.add('hidden');
  progressEl.classList.remove('hidden');
  setProgress(0, 'Starting...');

  chrome.runtime
    .sendMessage({ type: MSG.CAPTURE_START, payload: { tabId } })
    .catch((err) => showError(err.message));
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

  return message || 'Capture failed. Please try again on a regular webpage tab.';
}

function showError(msg) {
  capturing = false;
  captureBtn.disabled = false;
  capturePanel.setAttribute('aria-busy', 'false');
  progressEl.classList.add('hidden');
  const friendly = toFriendlyCaptureError(msg);
  errorMsgEl.classList.remove('hidden');
  errorMsgEl.textContent = friendly;
  showToast(friendly);
}

function showDone(payload = {}) {
  capturing = false;
  captureBtn.disabled = false;
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
      showDone(msg.payload || {});
      break;
    case MSG.SW_ERROR:
      showError(msg?.payload?.error || 'Unknown error');
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

(async function init() {
  await applySavedTheme();
  perfLog('init.start');
  setActiveTab('capture');
  await preloadUrlCount();
  perfLog('init.done');
})();
