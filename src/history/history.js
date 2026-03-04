import { listScreenshots, deleteScreenshot } from '../shared/db.js';

const gridEl = document.getElementById('grid');
const emptyEl = document.getElementById('empty');
const loadingEl = document.getElementById('loading');
const countEl = document.getElementById('count');
const clearAllBtn = document.getElementById('clearAllBtn');
const cardTpl = document.getElementById('cardTpl');

// Track object URLs so we can revoke them on delete
const objectUrls = new Map(); // id → objectUrl

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  const records = await listScreenshots();

  loadingEl.classList.add('hidden');

  if (records.length === 0) {
    emptyEl.classList.remove('hidden');
    return;
  }

  updateCount(records.length);
  clearAllBtn.classList.remove('hidden');
  gridEl.classList.remove('hidden');

  for (const record of records) {
    gridEl.appendChild(buildCard(record));
  }
}

// ─── Card builder ─────────────────────────────────────────────────────────────

function buildCard(record) {
  const node = cardTpl.content.cloneNode(true);
  const card = node.querySelector('.card');
  const img = node.querySelector('.thumb-img');
  const urlEl = node.querySelector('.card-url');
  const metaEl = node.querySelector('.card-meta');
  const openBtn = node.querySelector('.btn-open');
  const deleteBtn = node.querySelector('.btn-delete');

  // Thumbnail
  const objectUrl = URL.createObjectURL(record.blob);
  objectUrls.set(record.id, objectUrl);
  img.src = objectUrl;

  // Metadata
  try {
    urlEl.textContent = new URL(record.url).hostname;
    urlEl.title = record.url;
  } catch {
    urlEl.textContent = record.url;
  }
  metaEl.textContent =
    `${new Date(record.timestamp).toLocaleDateString()} · ` +
    `${record.width}×${record.height}px`;

  card.dataset.id = record.id;

  // Open preview on card click (but not on button clicks)
  card.addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    openPreview(record.id);
  });

  openBtn.addEventListener('click', () => openPreview(record.id));

  deleteBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    await handleDelete(record.id, card);
  });

  return node;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

function openPreview(id) {
  const url = chrome.runtime.getURL(`src/preview/preview.html?id=${id}`);
  chrome.tabs.create({ url });
}

async function handleDelete(id, cardEl) {
  await deleteScreenshot(id);

  // Revoke object URL to free memory
  const objectUrl = objectUrls.get(id);
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
    objectUrls.delete(id);
  }

  cardEl.remove();

  const remaining = gridEl.querySelectorAll('.card').length;
  if (remaining === 0) {
    gridEl.classList.add('hidden');
    clearAllBtn.classList.add('hidden');
    emptyEl.classList.remove('hidden');
    countEl.textContent = '';
  } else {
    updateCount(remaining);
  }
}

// ─── Clear all ────────────────────────────────────────────────────────────────

clearAllBtn.addEventListener('click', async () => {
  const total = gridEl.querySelectorAll('.card').length;
  if (!confirm(`Delete all ${total} screenshot${total !== 1 ? 's' : ''}? This cannot be undone.`)) return;

  const cards = [...gridEl.querySelectorAll('.card')];
  await Promise.all(cards.map((card) => deleteScreenshot(card.dataset.id)));

  // Revoke all object URLs
  for (const [, url] of objectUrls) URL.revokeObjectURL(url);
  objectUrls.clear();

  gridEl.innerHTML = '';
  gridEl.classList.add('hidden');
  clearAllBtn.classList.add('hidden');
  emptyEl.classList.remove('hidden');
  countEl.textContent = '';
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function updateCount(n) {
  countEl.textContent = `· ${n} screenshot${n !== 1 ? 's' : ''}`;
}

init();
