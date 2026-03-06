import { isCollectibleUrl } from '../shared/url-utils.js';

function toTitle(tab) {
  const raw = String(tab?.title || '').trim();
  if (raw) return raw;
  try {
    return new URL(String(tab?.url || '')).hostname;
  } catch {
    return 'Untitled tab';
  }
}

export function canQueueTab(tab) {
  if (!tab || Number(tab.id) <= 0) return false;
  return isCollectibleUrl(tab.url);
}

export function toQueueEntry(tab) {
  return {
    tabId: Number(tab.id),
    title: toTitle(tab),
    url: String(tab.url || ''),
  };
}

export function addTabsToQueue(currentQueue, tabs) {
  const queue = Array.isArray(currentQueue) ? [...currentQueue] : [];
  const existing = new Set(queue.map((item) => Number(item.tabId)));
  for (const tab of Array.isArray(tabs) ? tabs : []) {
    if (!canQueueTab(tab)) continue;
    const tabId = Number(tab.id);
    if (existing.has(tabId)) continue;
    queue.push(toQueueEntry(tab));
    existing.add(tabId);
  }
  return queue;
}

export function removeFromQueue(currentQueue, tabId) {
  const id = Number(tabId);
  return (Array.isArray(currentQueue) ? currentQueue : []).filter(
    (item) => Number(item.tabId) !== id
  );
}

export function normalizeQueueEntries(raw) {
  const list = Array.isArray(raw) ? raw : [];
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const tabId = Number(item?.tabId);
    const title = String(item?.title || '').trim();
    const url = String(item?.url || '');
    if (tabId <= 0 || !title || !isCollectibleUrl(url)) continue;
    if (seen.has(tabId)) continue;
    seen.add(tabId);
    out.push({ tabId, title, url });
  }
  return out;
}
