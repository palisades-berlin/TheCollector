import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

async function read(file) {
  return fs.readFile(file, 'utf8');
}

async function main() {
  const security = await read('SECURITY.md');
  assert.match(
    security,
    /## Reporting a Vulnerability/,
    'SECURITY.md: reporting section is required'
  );

  const readme = await read('README.md');
  assert.match(
    readme,
    /\[!\[CI\]\(https:\/\/github\.com\/palisades-berlin\/TheCollector\/actions\/workflows\/ci\.yml\/badge\.svg\?branch=main\)\]/,
    'README.md: CI badge is required'
  );
  assert.match(
    readme,
    /\[!\[Coverage Gate\]\(https:\/\/img\.shields\.io\/badge\/Coverage%20Gate-90%25%20lines-brightgreen\)\]/,
    'README.md: coverage badge is required'
  );
  assert.match(
    readme,
    /\[!\[License: MIT\]\(https:\/\/img\.shields\.io\/badge\/License-MIT-yellow\.svg\)\]/,
    'README.md: license badge is required'
  );
  assert.match(
    readme,
    /Security policy and vulnerability disclosure: \[SECURITY\.md\]\(\.\/SECURITY\.md\)/,
    'README.md: SECURITY.md link is required'
  );
  assert.match(
    readme,
    /- Required: `contextMenus`/,
    'README.md: contextMenus permission rationale is required'
  );
  assert.match(
    readme,
    /- Required: `alarms`/,
    'README.md: alarms permission rationale is required'
  );

  const sharedTypes = await read('src/shared/types.js');
  assert.match(
    sharedTypes,
    /@typedef \{object\} UserSettings/,
    'types.js: UserSettings typedef missing'
  );
  assert.match(
    sharedTypes,
    /@typedef \{object\} UrlMetaRecord/,
    'types.js: UrlMetaRecord typedef missing'
  );

  const serviceWorker = await read('src/background/service-worker.js');
  assert.match(
    serviceWorker,
    /import\('\.\.\/shared\/types\.js'\)\.UserSettings/,
    'service-worker.js: shared UserSettings typedef reference is required'
  );

  const urlRepo = await read('src/shared/repos/url-repo.js');
  assert.match(
    urlRepo,
    /import\('\.\.\/types\.js'\)\.UrlMetaRecord/,
    'url-repo.js: shared UrlMetaRecord typedef reference is required'
  );

  const urlsState = await read('src/popup/urls/urls-state.js');
  assert.match(
    urlsState,
    /import\('\.\.\/\.\.\/shared\/types\.js'\)\.UrlMutationContext/,
    'urls-state.js: shared UrlMutationContext typedef reference is required'
  );

  process.stdout.write('PASS gap remediation contract\n');
}

main().catch((err) => {
  process.stderr.write(`FAIL gap remediation contract\n${err.stack}\n`);
  process.exitCode = 1;
});
