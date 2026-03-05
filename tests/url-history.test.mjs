import assert from 'node:assert/strict';
import {
  URL_HISTORY_ACTION,
  normalizeUrlArray,
  buildUrlHistoryEntry,
  normalizeUrlHistoryEntries,
  urlsEqual,
} from '../src/shared/url-history.js';

function test(name, fn) {
  try {
    fn();
    process.stdout.write(`PASS ${name}\n`);
  } catch (err) {
    process.stderr.write(`FAIL ${name}\n${err.stack}\n`);
    process.exitCode = 1;
  }
}

test('normalizeUrlArray keeps string URLs only', () => {
  const out = normalizeUrlArray(['https://a.com', null, 7, 'https://b.com']);
  assert.deepEqual(out, ['https://a.com', 'https://b.com']);
});

test('buildUrlHistoryEntry creates model with meta sanitization', () => {
  const entry = buildUrlHistoryEntry({
    id: 'entry-1',
    createdAt: 123,
    actionType: URL_HISTORY_ACTION.ADD_CURRENT,
    urls: ['https://example.com'],
    meta: {
      source: 'popup',
      requestedCount: 5,
      dryRun: false,
      nested: { ignore: true },
    },
  });
  assert.equal(entry.id, 'entry-1');
  assert.equal(entry.createdAt, 123);
  assert.equal(entry.actionType, URL_HISTORY_ACTION.ADD_CURRENT);
  assert.equal(entry.count, 1);
  assert.deepEqual(entry.meta, {
    source: 'popup',
    requestedCount: 5,
    dryRun: false,
  });
});

test('normalizeUrlHistoryEntries sorts, filters empty, and caps limit', () => {
  const entries = normalizeUrlHistoryEntries(
    [
      {
        id: 'a',
        createdAt: 100,
        actionType: URL_HISTORY_ACTION.ADD_CURRENT,
        urls: ['https://one.com'],
      },
      {
        id: 'empty',
        createdAt: 200,
        actionType: URL_HISTORY_ACTION.UNKNOWN,
        urls: [],
      },
      {
        id: 'b',
        createdAt: 300,
        actionType: URL_HISTORY_ACTION.ADD_ALL_TABS,
        urls: ['https://two.com'],
      },
    ],
    1
  );
  assert.equal(entries.length, 1);
  assert.equal(entries[0].id, 'b');
});

test('urlsEqual compares ordered URL arrays', () => {
  assert.equal(urlsEqual(['a', 'b'], ['a', 'b']), true);
  assert.equal(urlsEqual(['a', 'b'], ['b', 'a']), false);
});
