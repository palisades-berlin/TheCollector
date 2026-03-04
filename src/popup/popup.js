import { MSG } from '../shared/messages.js';
import {
  cleanUrl,
  normalizeUrlForCompare,
  isCollectibleUrl,
  escapeCsvCell,
} from '../shared/url-utils.js';

const URL_LIMIT = 500;

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
const toastEl = document.getElementById('toast');

let capturing = false;
let toastTimer = null;
let clearConfirmTimer = null;
let urlMutationQueue = Promise.resolve();

function setActiveTab(mode) {
  const showCapture = mode === 'capture';
  captureTabBtn.classList.toggle('active', showCapture);
  urlsTabBtn.classList.toggle('active', !showCapture);
  captureTabBtn.setAttribute('aria-selected', showCapture ? 'true' : 'false');
  urlsTabBtn.setAttribute('aria-selected', showCapture ? 'false' : 'true');
  capturePanel.classList.toggle('hidden', !showCapture);
  urlsPanel.classList.toggle('hidden', showCapture);
}

captureTabBtn.addEventListener('click', () => setActiveTab('capture'));
urlsTabBtn.addEventListener('click', () => setActiveTab('urls'));

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1800);
}

function chromeCall(invoke) {
  return new Promise((resolve, reject) => {
    invoke((result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(result);
    });
  });
}

function reportError(err, userMessage) {
  console.error(err);
  showToast(userMessage);
}

function loadUrls() {
  return chromeCall((done) => chrome.storage.local.get({ urls: [] }, done)).then(
    (result) =>
      Array.isArray(result.urls)
        ? result.urls.filter((u) => typeof u === 'string')
        : []
  );
}

function saveUrls(urls) {
  return chromeCall((done) => chrome.storage.local.set({ urls }, done));
}

function mutateUrls(mutator) {
  const run = urlMutationQueue.then(async () => {
    const urls = await loadUrls();
    const nextUrls = await mutator([...urls]);
    await saveUrls(nextUrls);
    return nextUrls;
  });
  urlMutationQueue = run.catch(() => {});
  return run;
}

function getCurrentTabUrl() {
  return chromeCall((done) =>
    chrome.tabs.query({ active: true, currentWindow: true }, done)
  ).then((tabs) => tabs[0]?.url || '');
}

function getAllTabUrls() {
  return chromeCall((done) => chrome.tabs.query({ currentWindow: true }, done)).then(
    (tabs) => tabs.map((t) => t.url || '').filter(Boolean)
  );
}

function buildNormalizedSet(urls) {
  return new Set(urls.map(normalizeUrlForCompare));
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function openUrl(url) {
  if (!isCollectibleUrl(url)) {
    showToast('Cannot open this URL');
    return;
  }
  chrome.tabs.create({ url }, () => {
    if (chrome.runtime.lastError) {
      reportError(new Error(chrome.runtime.lastError.message), 'Could not open URL');
    }
  });
}

function updateBadge(count) {
  urlCount.textContent = `${count} URL${count === 1 ? '' : 's'}`;
}

function createUrlItemEl(url) {
  const item = document.createElement('div');
  item.className = 'url-item';
  item.dataset.url = url;
  item.innerHTML = `
    <span class="url-index"></span>
    <span class="url-text" title="${esc(url)}">${esc(url)}</span>
    <button class="btn-open" title="Open in new tab" aria-label="Open URL">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
      </svg>
    </button>
    <button class="btn-remove" title="Remove" aria-label="Remove URL">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    </button>
  `;
  item.querySelector('.btn-open').addEventListener('click', () => openUrl(url));
  item.querySelector('.btn-remove').addEventListener('click', async () => {
    try {
      const urls = await mutateUrls((current) => {
        const idx = current.indexOf(item.dataset.url);
        if (idx !== -1) current.splice(idx, 1);
        return current;
      });
      renderList(urls);
      showToast('URL removed');
    } catch (err) {
      reportError(err, 'Could not remove URL');
    }
  });
  return item;
}

function renderList(urls) {
  const list = document.getElementById('url-list');
  const empty = document.getElementById('empty-state');
  updateBadge(urls.length);

  if (urls.length === 0) {
    list.style.display = 'none';
    empty.style.display = 'flex';
    return;
  }

  list.style.display = 'block';
  empty.style.display = 'none';
  list.innerHTML = '';
  urls.forEach((url, i) => {
    const item = createUrlItemEl(url);
    item.querySelector('.url-index').textContent = String(i + 1);
    list.appendChild(item);
  });
}

function resetClearButton() {
  const btn = document.getElementById('btn-clear');
  btn.classList.remove('confirming');
  btn.textContent = 'Clear All';
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

function showError(msg) {
  capturing = false;
  captureBtn.disabled = false;
  progressEl.classList.add('hidden');
  errorMsgEl.classList.remove('hidden');
  errorMsgEl.textContent = `Error: ${msg}`;
}

function showDone(payload = {}) {
  capturing = false;
  captureBtn.disabled = false;
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
      const { percent } = msg.payload;
      const label = percent < 88 ? 'Capturing...' : percent < 100 ? 'Stitching...' : 'Done!';
      setProgress(percent, label);
      break;
    }
    case MSG.SW_DONE:
      showDone(msg.payload || {});
      break;
    case MSG.SW_ERROR:
      showError(msg.payload.error);
      break;
    default:
      break;
  }
});

document.getElementById('btn-add').addEventListener('click', async () => {
  try {
    const raw = await getCurrentTabUrl();
    if (!isCollectibleUrl(raw)) {
      showToast('Cannot collect this page');
      return;
    }

    const clean = cleanUrl(raw);
    let added = false;
    const urls = await mutateUrls((current) => {
      if (current.length >= URL_LIMIT) return current;
      const known = buildNormalizedSet(current);
      const normalized = normalizeUrlForCompare(clean);
      if (known.has(normalized)) return current;
      current.push(clean);
      added = true;
      return current;
    });

    if (!added) {
      showToast(urls.length >= URL_LIMIT ? `List full (max ${URL_LIMIT} URLs)` : 'Already in list');
      return;
    }

    renderList(urls);
    showToast('URL added');
  } catch (err) {
    reportError(err, 'Could not add current tab URL');
  }
});

document.getElementById('btn-add-all').addEventListener('click', async () => {
  try {
    const rawUrls = await getAllTabUrls();
    const validUrls = rawUrls.filter(isCollectibleUrl);
    if (validUrls.length === 0) {
      showToast('No collectible tabs found');
      return;
    }

    let added = 0;
    const urls = await mutateUrls((current) => {
      const known = buildNormalizedSet(current);
      for (const raw of validUrls) {
        if (current.length >= URL_LIMIT) break;
        const clean = cleanUrl(raw);
        const normalized = normalizeUrlForCompare(clean);
        if (!known.has(normalized)) {
          current.push(clean);
          known.add(normalized);
          added++;
        }
      }
      return current;
    });

    renderList(urls);
    showToast(added === 0 ? 'All tabs already in list' : `Added ${added} URL${added === 1 ? '' : 's'}`);
  } catch (err) {
    reportError(err, 'Could not add tab URLs');
  }
});

document.getElementById('btn-copy').addEventListener('click', async () => {
  try {
    const urls = await loadUrls();
    if (urls.length === 0) {
      showToast('Nothing to copy');
      return;
    }
    await navigator.clipboard.writeText(urls.join('\n'));
    showToast('Copied');
  } catch (err) {
    reportError(err, 'Clipboard access denied');
  }
});

document.getElementById('btn-export').addEventListener('click', async () => {
  try {
    const urls = await loadUrls();
    if (urls.length === 0) {
      showToast('Nothing to export');
      return;
    }
    const blob = new Blob([urls.join('\n')], { type: 'text/plain' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = 'urls.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
    showToast(`Saved ${urls.length} URL${urls.length === 1 ? '' : 's'} as TXT`);
  } catch (err) {
    reportError(err, 'Could not export TXT');
  }
});

document.getElementById('btn-export-csv').addEventListener('click', async () => {
  try {
    const urls = await loadUrls();
    if (urls.length === 0) {
      showToast('Nothing to export');
      return;
    }
    const csv = `url\n${urls.map(escapeCsvCell).join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = 'urls.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
    showToast(`Saved ${urls.length} URL${urls.length === 1 ? '' : 's'} as CSV`);
  } catch (err) {
    reportError(err, 'Could not export CSV');
  }
});

document.getElementById('btn-email').addEventListener('click', async () => {
  try {
    const urls = await loadUrls();
    if (urls.length === 0) {
      showToast('Nothing to email');
      return;
    }
    const subject = `URL List (${urls.length} URL${urls.length === 1 ? '' : 's'})`;
    const body = urls.join('\n');
    const a = document.createElement('a');
    a.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    reportError(err, 'Could not prepare email');
  }
});

document.getElementById('btn-clear').addEventListener('click', async () => {
  const btn = document.getElementById('btn-clear');

  try {
    if (!btn.classList.contains('confirming')) {
      const urls = await loadUrls();
      if (urls.length === 0) {
        showToast('List is already empty');
        return;
      }
      btn.classList.add('confirming');
      btn.textContent = 'Confirm Clear';
      clearTimeout(clearConfirmTimer);
      clearConfirmTimer = setTimeout(resetClearButton, 3000);
      return;
    }

    clearTimeout(clearConfirmTimer);
    resetClearButton();
    const urls = await mutateUrls(() => []);
    renderList(urls);
    showToast('List cleared');
  } catch (err) {
    reportError(err, 'Could not clear list');
  }
});

(async function init() {
  setActiveTab('capture');
  try {
    const initialUrls = await loadUrls();
    renderList(initialUrls);
  } catch (err) {
    reportError(err, 'Could not load stored URLs');
  }
})();
