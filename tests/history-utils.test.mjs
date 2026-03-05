import assert from 'node:assert/strict';
import {
  getRecordDomain,
  getRecordExportType,
  buildGroups,
  buildRecordHints,
  formatDuration,
  buildCardDiagnosticText,
  formatBytes,
  runWithConcurrency,
} from '../src/history/history-utils.js';

function test(name, fn) {
  try {
    fn();
    process.stdout.write(`PASS ${name}\n`);
  } catch (err) {
    process.stderr.write(`FAIL ${name}\n${err.stack}\n`);
    process.exitCode = 1;
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    process.stdout.write(`PASS ${name}\n`);
  } catch (err) {
    process.stderr.write(`FAIL ${name}\n${err.stack}\n`);
    process.exitCode = 1;
  }
}

test('getRecordDomain normalizes host and handles invalid URLs', () => {
  assert.equal(getRecordDomain({ url: 'https://EXAMPLE.com/path' }), 'example.com');
  assert.equal(getRecordDomain({ url: 'not-a-url' }), 'not-a-url');
});

test('getRecordExportType detects pdf/jpg and defaults to png', () => {
  assert.equal(getRecordExportType({ blobType: 'application/pdf' }), 'pdf');
  assert.equal(getRecordExportType({ blobType: 'image/jpeg' }), 'jpg');
  assert.equal(getRecordExportType({ blobType: 'image/png' }), 'png');
});

test('buildGroups returns timestamp-descending one-record groups', () => {
  const groups = buildGroups([
    { id: 'a', timestamp: 10, url: 'https://a.com', byteSize: 100 },
    { id: 'b', timestamp: 20, url: 'https://b.com', byteSize: 200 },
  ]);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].baseId, 'b');
  assert.equal(groups[0].records.length, 1);
  assert.equal(groups[0].totalBytes, 200);
});

test('buildRecordHints includes split and stitched hints', () => {
  const hints = buildRecordHints({
    splitCount: 3,
    splitPart: 2,
    stitchedFrom: 'part-1',
  });
  assert.deepEqual(hints, ['Part 2/3', 'Stitched']);
});

test('duration and byte formatters return readable units', () => {
  assert.equal(formatDuration(950), '0.9s');
  assert.equal(formatDuration(12_100), '12s');
  assert.equal(formatBytes(1000), '1000 B');
  assert.equal(formatBytes(2048), '2.00 KB');
});

test('buildCardDiagnosticText composes fallback, slow, and retry notes', () => {
  const text = buildCardDiagnosticText({
    captureFallbackUsed: 'oversized_autoscale',
    captureDurationMs: 15_000,
    captureTotalTiles: 9,
    captureRetries: 2,
    captureQuotaBackoffs: 1,
  });
  assert.equal(
    text,
    'Auto-scaled oversized page · Slow capture (15s, 9 tiles) · Capture retries: 2 (quota backoffs: 1)'
  );
});

await testAsync('runWithConcurrency processes all items and honors limit', async () => {
  const items = [1, 2, 3, 4, 5, 6];
  const seen = [];
  let active = 0;
  let maxActive = 0;

  await runWithConcurrency(items, 2, async (item) => {
    active++;
    maxActive = Math.max(maxActive, active);
    await new Promise((resolve) => setTimeout(resolve, 5));
    seen.push(item);
    active--;
  });

  assert.equal(maxActive <= 2, true);
  assert.deepEqual(seen.sort((a, b) => a - b), items);
});
