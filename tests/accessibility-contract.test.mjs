import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const HTML_FILES = [
  'src/popup/popup.html',
  'src/history/history.html',
  'src/options/options.html',
  'src/preview/preview.html',
  'src/onboarding/onboarding.html',
];

async function read(file) {
  return fs.readFile(file, 'utf8');
}

function hasStatusSemantics(html) {
  return /role="status"/.test(html) || /role="alert"/.test(html) || /aria-live=/.test(html);
}

async function main() {
  for (const file of HTML_FILES) {
    const html = await read(file);

    assert.equal(
      /<script[^>]+src="https?:\/\//.test(html),
      false,
      `${file}: remote script sources are not allowed`
    );
    assert.equal(
      /<link[^>]+href="https?:\/\//.test(html),
      false,
      `${file}: remote stylesheet sources are not allowed`
    );
    assert.equal(
      /<script(?![^>]*\bsrc=)[^>]*>/.test(html),
      false,
      `${file}: inline script blocks are not allowed`
    );
    assert.equal(hasStatusSemantics(html), true, `${file}: must expose live status semantics`);
  }

  const popupHtml = await read('src/popup/popup.html');
  assert.equal(/role="tablist"/.test(popupHtml), true, 'popup: tablist role is required');
  assert.equal(/role="tab"/.test(popupHtml), true, 'popup: tab role is required');

  process.stdout.write('PASS accessibility and isolation contracts\n');
}

main().catch((err) => {
  process.stderr.write(`FAIL accessibility and isolation contracts\n${err.stack}\n`);
  process.exitCode = 1;
});
