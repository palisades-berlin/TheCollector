import { execFileSync } from 'node:child_process';

const FORBIDDEN_TRACKED_PREFIXES = ['dist/', 'coverage/', 'output/', 'tmp/', 'test-results/'];
const FORBIDDEN_TRACKED_NAMES = ['.DS_Store'];

function trackedFiles() {
  const out = execFileSync('git', ['ls-files'], { encoding: 'utf8' });
  return out
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function isForbidden(file) {
  if (FORBIDDEN_TRACKED_NAMES.some((name) => file.endsWith(`/${name}`) || file === name)) {
    return true;
  }
  return FORBIDDEN_TRACKED_PREFIXES.some((prefix) => file.startsWith(prefix));
}

function main() {
  const files = trackedFiles();
  const violations = files.filter(isForbidden);
  if (violations.length > 0) {
    console.error('Repository hygiene violations found (tracked generated artifacts):');
    for (const file of violations) {
      console.error(`- ${file}`);
    }
    process.exit(1);
  }
  console.log('PASS repository hygiene: no tracked generated artifacts or .DS_Store files.');
}

main();
