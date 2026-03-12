import assert from 'node:assert/strict';
import {
  cleanUrl,
  normalizeUrlForCompare,
  isCollectibleUrl,
  escapeCsvCell,
  getRegisteredDomain,
} from '../src/shared/url-utils.js';

function test(name, fn) {
  try {
    fn();
    process.stdout.write(`PASS ${name}\n`);
  } catch (err) {
    process.stderr.write(`FAIL ${name}\n${err.stack}\n`);
    process.exitCode = 1;
  }
}

test('cleanUrl strips tracking params and keeps business params', () => {
  const input = 'https://example.com/path?utm_source=x&foo=1&gclid=abc';
  const output = cleanUrl(input);
  assert.equal(output, 'https://example.com/path?foo=1');
});

test('normalizeUrlForCompare normalizes host, default port, root slash, and query order', () => {
  const a = normalizeUrlForCompare('HTTPS://EXAMPLE.COM:443/?b=2&a=1');
  const b = normalizeUrlForCompare('https://example.com?a=1&b=2');
  assert.equal(a, b);
});

test('isCollectibleUrl only allows http/https', () => {
  assert.equal(isCollectibleUrl('https://example.com'), true);
  assert.equal(isCollectibleUrl('http://example.com'), true);
  assert.equal(isCollectibleUrl('chrome://settings'), false);
  assert.equal(isCollectibleUrl('javascript:alert(1)'), false);
  assert.equal(isCollectibleUrl('data:text/html,abc'), false);
});

test('escapeCsvCell quotes content and mitigates formula injection', () => {
  assert.equal(escapeCsvCell('https://example.com'), '"https://example.com"');
  assert.equal(escapeCsvCell('=HYPERLINK("https://evil")'), '"\'=HYPERLINK(""https://evil"")"');
  assert.equal(escapeCsvCell('hello "world"'), '"hello ""world"""');
});

test('getRegisteredDomain resolves base domain for saved views grouping', () => {
  assert.equal(getRegisteredDomain('https://www.docs.example.com/path'), 'example.com');
  assert.equal(getRegisteredDomain('https://a.b.c.gov.uk/info'), 'c.gov.uk');
  assert.equal(getRegisteredDomain('https://example.com'), 'example.com');
  assert.equal(getRegisteredDomain('notaurl'), '');
});
