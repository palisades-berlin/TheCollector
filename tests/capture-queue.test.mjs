import assert from 'node:assert/strict';
import {
  addTabsToQueue,
  canQueueTab,
  normalizeQueueEntries,
  removeFromQueue,
  toQueueEntry,
} from '../src/popup/capture-queue.js';

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

test('canQueueTab allows only collectible tabs with numeric id', () => {
  assert.equal(canQueueTab({ id: 1, url: 'https://example.com' }), true);
  assert.equal(canQueueTab({ id: 1, url: 'chrome://extensions' }), false);
  assert.equal(canQueueTab({ id: 0, url: 'https://example.com' }), false);
});

test('toQueueEntry falls back to hostname when title is missing', () => {
  const entry = toQueueEntry({ id: 4, url: 'https://docs.example.com/path' });
  assert.equal(entry.tabId, 4);
  assert.equal(entry.title, 'docs.example.com');
});

test('addTabsToQueue deduplicates by tab id and skips invalid tabs', () => {
  const next = addTabsToQueue(
    [{ tabId: 1, title: 'A', url: 'https://a.com' }],
    [
      { id: 1, title: 'Duplicate', url: 'https://a.com' },
      { id: 2, title: 'B', url: 'https://b.com' },
      { id: 3, title: 'Blocked', url: 'chrome://settings' },
    ]
  );
  assert.equal(next.length, 2);
  assert.equal(next[1].tabId, 2);
});

test('removeFromQueue removes selected tab id', () => {
  const next = removeFromQueue(
    [
      { tabId: 1, title: 'A', url: 'https://a.com' },
      { tabId: 2, title: 'B', url: 'https://b.com' },
    ],
    1
  );
  assert.deepEqual(
    next.map((item) => item.tabId),
    [2]
  );
});

test('normalizeQueueEntries sanitizes and deduplicates persisted queue state', () => {
  const normalized = normalizeQueueEntries([
    { tabId: 1, title: 'A', url: 'https://a.com' },
    { tabId: 1, title: 'A duplicate', url: 'https://a.com' },
    { tabId: 2, title: '', url: 'https://b.com' },
    { tabId: 3, title: 'Blocked', url: 'chrome://settings' },
  ]);
  assert.deepEqual(normalized, [{ tabId: 1, title: 'A', url: 'https://a.com' }]);
});
