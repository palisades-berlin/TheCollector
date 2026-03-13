import assert from 'node:assert/strict';
import { canRestoreUrls } from '../src/shared/url-list-state.js';
import { isEmail, isNonEmptyString, isValidUrl, toPositiveInt } from '../src/shared/validation.js';

function test(name, fn) {
  try {
    fn();
    process.stdout.write(`PASS ${name}\n`);
  } catch (err) {
    process.stderr.write(`FAIL ${name}\n${err.stack}\n`);
    process.exitCode = 1;
  }
}

test('canRestoreUrls is true only when current list is empty and undo exists', () => {
  assert.equal(canRestoreUrls(0, 1), true);
  assert.equal(canRestoreUrls(0, 3), true);
  assert.equal(canRestoreUrls(1, 3), false);
  assert.equal(canRestoreUrls(0, 0), false);
});

test('toPositiveInt accepts valid positive integers only', () => {
  assert.equal(toPositiveInt(5), 5);
  assert.equal(toPositiveInt('6'), 6);
  assert.equal(toPositiveInt(0), null);
  assert.equal(toPositiveInt(-3), null);
  assert.equal(toPositiveInt(2.4), null);
  assert.equal(toPositiveInt('abc'), null);
});

test('isNonEmptyString accepts trimmed non-empty strings only', () => {
  assert.equal(isNonEmptyString('hello'), true);
  assert.equal(isNonEmptyString('  hello  '), true);
  assert.equal(isNonEmptyString('   '), false);
  assert.equal(isNonEmptyString(''), false);
  assert.equal(isNonEmptyString(null), false);
  assert.equal(isNonEmptyString(42), false);
});

test('isValidUrl allows http/https by default and rejects other schemes', () => {
  assert.equal(isValidUrl('https://example.com/path?a=1'), true);
  assert.equal(isValidUrl('http://example.com'), true);
  assert.equal(isValidUrl('chrome://extensions'), false);
  assert.equal(isValidUrl('data:text/plain,hello'), false);
  assert.equal(isValidUrl('not-a-url'), false);
  assert.equal(isValidUrl('   '), false);
});

test('isValidUrl supports custom protocol allowlist', () => {
  assert.equal(isValidUrl('mailto:test@example.com'), false);
  assert.equal(isValidUrl('mailto:test@example.com', { allowedProtocols: ['mailto:'] }), true);
});

test('isEmail validates pragmatic email format', () => {
  assert.equal(isEmail('name@example.com'), true);
  assert.equal(isEmail(' Name+tag@example.co.uk '), true);
  assert.equal(isEmail('not-an-email'), false);
  assert.equal(isEmail('name@localhost'), false);
  assert.equal(isEmail('name@@example.com'), false);
  assert.equal(isEmail('  '), false);
});
