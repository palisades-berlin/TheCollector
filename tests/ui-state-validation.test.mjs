import assert from 'node:assert/strict';
import { canRestoreUrls } from '../src/shared/url-list-state.js';
import { toPositiveInt } from '../src/shared/validation.js';

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
