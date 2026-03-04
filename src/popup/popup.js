import { MSG } from '../shared/messages.js';

const captureBtn = document.getElementById('captureBtn');
const progressEl = document.getElementById('progress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const doneMsgEl = document.getElementById('doneMsg');
const errorMsgEl = document.getElementById('errorMsg');
const historyBtn = document.getElementById('historyBtn');

let capturing = false;

// ─── Capture trigger ──────────────────────────────────────────────────────────

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
  errorMsgEl.classList.add('hidden');
  doneMsgEl.classList.add('hidden');
  progressEl.classList.remove('hidden');
  setProgress(0, 'Starting…');

  // Fire-and-forget — progress comes back via onMessage
  chrome.runtime
    .sendMessage({ type: MSG.CAPTURE_START, payload: { tabId } })
    .catch((err) => showError(err.message));
}

// ─── Progress / done / error ──────────────────────────────────────────────────

function setProgress(percent, text) {
  progressFill.style.width = `${percent}%`;
  progressText.textContent = text || `${percent}%`;
}

function showError(msg) {
  capturing = false;
  captureBtn.disabled = false;
  progressEl.classList.add('hidden');
  errorMsgEl.classList.remove('hidden');
  errorMsgEl.textContent = `Error: ${msg}`;
}

function showDone() {
  capturing = false;
  progressEl.classList.add('hidden');
  doneMsgEl.classList.remove('hidden');
  // Auto-close popup after showing "done"
  setTimeout(() => window.close(), 1500);
}

// ─── History button ───────────────────────────────────────────────────────────

historyBtn.addEventListener('click', () => {
  const url = chrome.runtime.getURL('src/history/history.html');
  chrome.tabs.create({ url });
  window.close();
});

// ─── Listen for SW broadcasts ─────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg) => {
  switch (msg.type) {
    case MSG.SW_PROGRESS: {
      const { percent } = msg.payload;
      const label =
        percent < 88 ? 'Capturing…' : percent < 100 ? 'Stitching…' : 'Done!';
      setProgress(percent, label);
      break;
    }
    case MSG.SW_DONE:
      showDone();
      break;
    case MSG.SW_ERROR:
      showError(msg.payload.error);
      break;
  }
});
