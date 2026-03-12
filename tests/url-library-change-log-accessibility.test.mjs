import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

async function main() {
  const [html, js] = await Promise.all([
    fs.readFile('src/urls/urls.html', 'utf8'),
    fs.readFile('src/urls/urls.js', 'utf8'),
  ]);

  assert.equal(
    /id="changeLogBackBtn"/.test(html),
    true,
    'url library: change-log back button is required'
  );
  assert.equal(
    /Press Esc to return to the previous control/.test(html),
    true,
    'url library: change-log escape hint text is required'
  );

  assert.equal(
    /document\.addEventListener\('keydown',[\s\S]*event\.key !== 'Escape'[\s\S]*closeChangeLogWithFocusReturn\(\)/.test(
      js
    ),
    true,
    'url library: Escape dismiss must call closeChangeLogWithFocusReturn'
  );

  assert.equal(
    /els\.viewChangeLog\.addEventListener\('click', async \(event\) =>[\s\S]*openChangeLog\(event\.currentTarget\)/.test(
      js
    ),
    true,
    'url library: opening change-log must capture focus origin'
  );

  assert.equal(
    /els\.changeLogBackBtn\?\.addEventListener\('click', \(\) =>[\s\S]*closeChangeLogWithFocusReturn\(\)/.test(
      js
    ),
    true,
    'url library: back button must close change-log with focus return'
  );

  process.stdout.write('PASS url library change-log accessibility contract\n');
}

main().catch((err) => {
  process.stderr.write(`FAIL url library change-log accessibility contract\n${err.stack}\n`);
  process.exitCode = 1;
});
