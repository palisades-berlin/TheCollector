import assert from 'node:assert/strict';
import {
  parseVersion,
  isDocsTestsOnlyPath,
  classifyChangeScope,
  validateBumpRule,
} from '../scripts/check-version-policy.mjs';

function test(name, fn) {
  try {
    fn();
    process.stdout.write(`PASS ${name}\n`);
  } catch (err) {
    process.stderr.write(`FAIL ${name}\n${err.stack}\n`);
    process.exitCode = 1;
  }
}

test('parseVersion accepts four-part format', () => {
  const parsed = parseVersion('1.9.92.0');
  assert.deepEqual(parsed.parts, [1, 9, 92, 0]);
  assert.equal(parsed.originalSegments, 4);
});

test('parseVersion can read three-part base version when allowed', () => {
  const parsed = parseVersion('1.9.92', { allowThreePart: true });
  assert.deepEqual(parsed.parts, [1, 9, 92, 0]);
  assert.equal(parsed.originalSegments, 3);
});

test('docs/tests-only classifier allows docs, tests, and help html', () => {
  assert.equal(isDocsTestsOnlyPath('docs/dev-workflow.md'), true);
  assert.equal(isDocsTestsOnlyPath('tests/url-repo.test.mjs'), true);
  assert.equal(isDocsTestsOnlyPath('src/options/options.html'), true);
  assert.equal(isDocsTestsOnlyPath('src/background/service-worker.js'), false);
});

test('classifyChangeScope marks docs-only sets correctly', () => {
  const docsOnly = classifyChangeScope([
    'README.md',
    'docs/help-user-guide.md',
    'tests/x.test.mjs',
  ]);
  assert.equal(docsOnly.docsOnly, true);
  const mixed = classifyChangeScope(['README.md', 'src/shared/repos/url-repo.js']);
  assert.equal(mixed.docsOnly, false);
});

test('validateBumpRule accepts three-to-four migration baseline', () => {
  const result = validateBumpRule({
    baseVersion: '1.9.92',
    currentVersion: '1.9.92.0',
    docsOnly: false,
  });
  assert.equal(result.ok, true);
  assert.equal(result.reason, 'three_to_four_part_migration');
});

test('validateBumpRule enforces docs-only W increment', () => {
  const ok = validateBumpRule({
    baseVersion: '1.9.92.0',
    currentVersion: '1.9.92.1',
    docsOnly: true,
  });
  assert.equal(ok.ok, true);
  const bad = validateBumpRule({
    baseVersion: '1.9.92.0',
    currentVersion: '1.9.93.0',
    docsOnly: true,
  });
  assert.equal(bad.ok, false);
});

test('validateBumpRule enforces code-change Z increment and W reset', () => {
  const ok = validateBumpRule({
    baseVersion: '1.9.92.4',
    currentVersion: '1.9.93.0',
    docsOnly: false,
  });
  assert.equal(ok.ok, true);
  const bad = validateBumpRule({
    baseVersion: '1.9.92.4',
    currentVersion: '1.9.92.5',
    docsOnly: false,
  });
  assert.equal(bad.ok, false);
});
