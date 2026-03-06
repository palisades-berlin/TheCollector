import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

async function main() {
  const manifest = JSON.parse(await fs.readFile('manifest.json', 'utf8'));

  // MV3 extension pages should avoid unsafe-eval / remote code in CSP overrides.
  const csp = manifest.content_security_policy;
  if (typeof csp === 'string') {
    assert.equal(csp.includes('unsafe-eval'), false, 'unsafe-eval must not be used in CSP');
    assert.equal(csp.includes('http://'), false, 'http origins are not allowed in CSP');
    assert.equal(csp.includes('https://'), false, 'https origins are not allowed in CSP');
  }
  if (csp && typeof csp === 'object') {
    const extensionPages = String(csp.extension_pages || '');
    assert.equal(
      extensionPages.includes('unsafe-eval'),
      false,
      'unsafe-eval must not be used in extension_pages CSP'
    );
    assert.equal(
      extensionPages.includes('http://') || extensionPages.includes('https://'),
      false,
      'remote origins are not allowed in extension_pages CSP'
    );
  }

  // Keep host access explicit and minimized.
  const hostPermissions = manifest.host_permissions || [];
  assert.deepEqual(hostPermissions, [], 'host_permissions should remain empty');

  process.stdout.write('PASS manifest security constraints\n');
}

main().catch((err) => {
  process.stderr.write(`FAIL manifest security constraints\n${err.stack}\n`);
  process.exitCode = 1;
});
