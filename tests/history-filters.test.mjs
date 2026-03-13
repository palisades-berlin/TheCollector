import assert from 'node:assert/strict';
import { filterRecords } from '../src/history/history-filters.js';
import { sanitizeCaptureProfileId } from '../src/shared/capture-profiles.js';

function test(name, fn) {
  try {
    fn();
    process.stdout.write(`PASS ${name}\n`);
  } catch (err) {
    process.stderr.write(`FAIL ${name}\n${err.stack}\n`);
    process.exitCode = 1;
  }
}

const sample = [
  {
    id: 'a',
    url: 'https://example.com/a',
    timestamp: new Date('2026-03-01T09:00:00Z').getTime(),
    blobType: 'image/png',
    captureProfileId: 'research',
  },
  {
    id: 'b',
    url: 'https://sub.example.com/b',
    timestamp: new Date('2026-03-02T10:00:00Z').getTime(),
    blobType: 'image/jpeg',
    captureProfileId: 'interest',
  },
  {
    id: 'c',
    url: 'https://other.com/c',
    timestamp: new Date('2026-03-03T11:00:00Z').getTime(),
    blobType: 'application/pdf',
    captureProfileId: 'private',
  },
];

const getDomain = (record) => new URL(record.url).hostname.toLowerCase();
const getType = (record) => {
  const type = String(record.blobType || '').toLowerCase();
  if (type.includes('pdf')) return 'pdf';
  if (type.includes('jpeg') || type.includes('jpg')) return 'jpg';
  return 'png';
};

test('filterRecords applies domain filter', () => {
  const out = filterRecords(
    sample,
    {
      domain: 'example.com',
      domainMode: 'domain',
      fromDate: '',
      toDate: '',
      type: 'all',
      profile: 'all',
    },
    getDomain,
    getType,
    (record) => record.captureProfileId || ''
  );
  assert.deepEqual(
    out.map((r) => r.id),
    ['a', 'b']
  );
});

test('filterRecords applies date range and type filters', () => {
  const out = filterRecords(
    sample,
    {
      domain: '',
      domainMode: 'domain',
      fromDate: '2026-03-02',
      toDate: '2026-03-03',
      type: 'pdf',
      profile: 'all',
    },
    getDomain,
    getType,
    (record) => record.captureProfileId || ''
  );
  assert.deepEqual(
    out.map((r) => r.id),
    ['c']
  );
});

test('filterRecords applies profile filter', () => {
  const out = filterRecords(
    sample,
    {
      domain: '',
      domainMode: 'domain',
      fromDate: '',
      toDate: '',
      type: 'all',
      profile: 'interest',
    },
    getDomain,
    getType,
    (record) => record.captureProfileId || ''
  );
  assert.deepEqual(
    out.map((r) => r.id),
    ['b']
  );
});

test('filterRecords ignores legacy/invalid profile ids when filtering', () => {
  const sampleWithInvalid = [
    ...sample,
    { id: 'd', url: 'https://legacy.com', captureProfileId: 'legacy' },
  ];
  const out = filterRecords(
    sampleWithInvalid,
    {
      domain: '',
      domainMode: 'domain',
      fromDate: '',
      toDate: '',
      type: 'all',
      profile: 'research',
    },
    getDomain,
    getType,
    (record) => sanitizeCaptureProfileId(record.captureProfileId || '')
  );
  assert.deepEqual(
    out.map((r) => r.id),
    ['a']
  );
});

test('filterRecords applies TLD suffix filter when domainMode is tld', () => {
  const out = filterRecords(
    sample,
    { domain: '.com', domainMode: 'tld', fromDate: '', toDate: '', type: 'all', profile: 'all' },
    getDomain,
    getType,
    (record) => record.captureProfileId || ''
  );
  assert.deepEqual(
    out.map((r) => r.id),
    ['a', 'b', 'c']
  );
});

test('filterRecords applies exact match when domainMode is domain_exact', () => {
  const out = filterRecords(
    sample,
    {
      domain: 'example.com',
      domainMode: 'domain_exact',
      fromDate: '',
      toDate: '',
      type: 'all',
      profile: 'all',
    },
    getDomain,
    getType,
    (record) => record.captureProfileId || ''
  );
  assert.deepEqual(
    out.map((r) => r.id),
    ['a']
  );
});

test('filterRecords normalizes TLD search without leading dot', () => {
  const out = filterRecords(
    sample,
    { domain: 'com', domainMode: 'tld', fromDate: '', toDate: '', type: 'all', profile: 'all' },
    getDomain,
    getType,
    (record) => record.captureProfileId || ''
  );
  assert.deepEqual(
    out.map((r) => r.id),
    ['a', 'b', 'c']
  );
});

test('filterRecords supports multi-label TLD filtering', () => {
  const out = filterRecords(
    [
      ...sample,
      {
        id: 'uk',
        url: 'https://news.bbc.co.uk/article',
        timestamp: new Date('2026-03-04T11:00:00Z').getTime(),
        blobType: 'image/png',
        captureProfileId: 'research',
      },
    ],
    {
      domain: '.co.uk',
      domainMode: 'tld',
      fromDate: '',
      toDate: '',
      type: 'all',
      profile: 'all',
    },
    getDomain,
    getType,
    (record) => record.captureProfileId || ''
  );
  assert.deepEqual(
    out.map((r) => r.id),
    ['uk']
  );
});
