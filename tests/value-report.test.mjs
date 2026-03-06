import assert from 'node:assert/strict';
import { buildWeeklyValueReport } from '../src/shared/value-report.js';

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

test('buildWeeklyValueReport counts recent captures and unique domains', () => {
  const now = Date.parse('2026-03-06T12:00:00.000Z');
  const eightDaysAgo = now - 8 * 24 * 60 * 60 * 1000;
  const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;
  const oneDayAgo = now - 1 * 24 * 60 * 60 * 1000;

  const report = buildWeeklyValueReport({
    now,
    screenshotRecords: [
      { timestamp: twoDaysAgo, url: 'https://figma.com/file/x' },
      { timestamp: oneDayAgo, url: 'https://example.com/a' },
      { timestamp: oneDayAgo, url: 'https://example.com/b' },
      { timestamp: eightDaysAgo, url: 'https://old.com' },
    ],
    urlList: ['https://a.com', 'https://b.com', 'not-a-url'],
  });

  assert.equal(report.periodDays, 7);
  assert.equal(report.capturesSaved, 3);
  assert.equal(report.uniqueDomains, 2);
  assert.equal(report.urlsCollected, 2);
  assert.equal(report.estimatedMinutesSaved, 9);
});

test('buildWeeklyValueReport handles empty inputs', () => {
  const report = buildWeeklyValueReport();
  assert.equal(report.capturesSaved, 0);
  assert.equal(report.uniqueDomains, 0);
  assert.equal(report.urlsCollected, 0);
  assert.equal(report.estimatedMinutesSaved, 0);
});
