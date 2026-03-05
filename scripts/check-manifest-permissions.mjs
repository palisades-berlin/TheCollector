import fs from 'node:fs/promises';

const APPROVED_REQUIRED = [
  'activeTab',
  'contextMenus',
  'offscreen',
  'scripting',
  'storage',
  'tabs',
  'unlimitedStorage',
].sort();

const APPROVED_OPTIONAL = ['downloads'].sort();

async function main() {
  const manifest = JSON.parse(await fs.readFile('manifest.json', 'utf8'));
  const required = [...(manifest.permissions || [])].sort();
  const optional = [...(manifest.optional_permissions || [])].sort();

  if (JSON.stringify(required) !== JSON.stringify(APPROVED_REQUIRED)) {
    console.error('Manifest required permissions drift detected.');
    console.error('Expected:', APPROVED_REQUIRED.join(', '));
    console.error('Actual:  ', required.join(', '));
    process.exit(1);
  }

  if (JSON.stringify(optional) !== JSON.stringify(APPROVED_OPTIONAL)) {
    console.error('Manifest optional permissions drift detected.');
    console.error('Expected:', APPROVED_OPTIONAL.join(', '));
    console.error('Actual:  ', optional.join(', '));
    process.exit(1);
  }

  console.log('PASS manifest permission policy.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
