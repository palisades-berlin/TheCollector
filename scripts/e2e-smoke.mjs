import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const HOST = '127.0.0.1';
const PAGES = ['/src/popup/popup.html', '/src/history/history.html', '/src/options/options.html'];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

function parseMode() {
  const args = new Set(process.argv.slice(2));
  if (args.has('--real-extension-manual')) return 'real-extension-manual';
  return 'stub';
}

function createChromeStubInitScript() {
  return () => {
    const createEvent = () => ({
      addListener: () => {},
      removeListener: () => {},
      hasListener: () => false,
    });

    const resolveStorageGet = (keys) => {
      if (keys == null) return {};
      if (Array.isArray(keys)) return Object.fromEntries(keys.map((k) => [k, undefined]));
      if (typeof keys === 'string') return { [keys]: undefined };
      if (typeof keys === 'object') return keys;
      return {};
    };

    const storageArea = {
      get: (keys, cb) => {
        const value = resolveStorageGet(keys);
        if (typeof cb === 'function') cb(value);
        return Promise.resolve(value);
      },
      set: (_value, cb) => {
        if (typeof cb === 'function') cb();
        return Promise.resolve();
      },
      remove: (_keys, cb) => {
        if (typeof cb === 'function') cb();
        return Promise.resolve();
      },
      clear: (cb) => {
        if (typeof cb === 'function') cb();
        return Promise.resolve();
      },
    };

    globalThis.chrome = {
      runtime: {
        sendMessage: async () => ({ ok: true }),
        onMessage: createEvent(),
        getURL: (p) => p,
        openOptionsPage: async () => {},
        lastError: null,
      },
      tabs: {
        query: async () => [{ id: 1, url: 'https://example.com', active: true }],
        create: async () => ({ id: 2 }),
        sendMessage: async () => ({ ok: true }),
      },
      storage: {
        local: storageArea,
        sync: storageArea,
      },
      permissions: {
        contains: async () => true,
        request: async () => true,
        remove: async () => true,
      },
      downloads: {
        download: async () => 1,
      },
      commands: {
        onCommand: createEvent(),
      },
      offscreen: {
        hasDocument: async () => true,
        createDocument: async () => {},
        closeDocument: async () => {},
      },
      scripting: {
        executeScript: async () => [],
      },
    };
  };
}

function startStaticServer() {
  const server = http.createServer(async (req, res) => {
    try {
      const reqPath = new URL(req.url || '/', `http://${HOST}`).pathname;
      const cleanPath = reqPath === '/' ? '/README.md' : reqPath;
      const fullPath = path.resolve(ROOT, `.${cleanPath}`);
      if (!fullPath.startsWith(ROOT)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      const content = await fs.readFile(fullPath);
      const ext = path.extname(fullPath);
      res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream' });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  return new Promise((resolve) => {
    server.listen(0, HOST, () => {
      const address = server.address();
      resolve({ server, port: address.port });
    });
  });
}

function assertNoRuntimeErrors(errorsByPage) {
  const pagesWithErrors = errorsByPage.filter((item) => item.errors.length > 0);
  if (pagesWithErrors.length === 0) return;

  const detail = pagesWithErrors
    .map((item) => `- ${item.page}\n${item.errors.map((err) => `  - ${err}`).join('\n')}`)
    .join('\n');

  throw new Error(`E2E smoke failed due to runtime errors:\n${detail}`);
}

function collectPageErrors(page, bucket) {
  page.on('pageerror', (err) => bucket.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') bucket.push(`console.error: ${msg.text()}`);
  });
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function runStubSmoke() {
  const { server, port } = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addInitScript(createChromeStubInitScript());

  const errorsByPage = [];

  try {
    for (const pagePath of PAGES) {
      const page = await context.newPage();
      const errors = [];
      collectPageErrors(page, errors);

      await page.goto(`http://${HOST}:${port}${pagePath}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(350);

      const rootPresent = await page.evaluate(() => Boolean(document.body));
      if (!rootPresent) errors.push('document body missing');

      errorsByPage.push({ page: pagePath, errors });
      await page.close();
    }

    assertNoRuntimeErrors(errorsByPage);
    console.log('PASS e2e smoke: popup/history/options pages loaded without runtime errors');
  } finally {
    await context.close();
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

async function getExtensionId(context) {
  const existing = context.serviceWorkers()[0];
  if (existing) return new URL(existing.url()).host;
  const sw = await context.waitForEvent('serviceworker', { timeout: 15000 });
  return new URL(sw.url()).host;
}

async function runRealExtensionManualSmoke() {
  if (!input.isTTY) {
    throw new Error('Manual mode requires a TTY. Run in an interactive terminal.');
  }

  const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'the-collector-smoke-'));
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [`--disable-extensions-except=${ROOT}`, `--load-extension=${ROOT}`],
    acceptDownloads: true,
  });

  const rl = readline.createInterface({ input, output });
  const allErrors = [];

  try {
    const extensionId = await getExtensionId(context);
    const extensionBase = `chrome-extension://${extensionId}`;

    const webPage = await context.newPage();
    const webErrors = [];
    collectPageErrors(webPage, webErrors);
    await webPage.goto('https://example.com', { waitUntil: 'domcontentloaded' });

    console.log('\nManual capture step required:');
    console.log('1) Keep the Example tab selected.');
    console.log('2) Click THE Collector toolbar icon.');
    console.log('3) Click "Capture Full Page" and wait for completion.');
    await rl.question('Press Enter after capture completes... ');

    const popupPage = await context.newPage();
    const popupErrors = [];
    collectPageErrors(popupPage, popupErrors);
    await popupPage.goto(`${extensionBase}/src/popup/popup.html`, {
      waitUntil: 'domcontentloaded',
    });

    await popupPage.click('#urlsTabBtn');
    await popupPage.click('#btn-add-all');
    await popupPage.waitForSelector('.url-item', { timeout: 5000 });

    const downloadPromise = popupPage.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    await popupPage.click('#btn-export');
    const download = await downloadPromise;
    if (!download) {
      throw new Error('TXT export smoke check failed: no download was triggered.');
    }

    const historyTabPromise = context.waitForEvent('page', { timeout: 7000 });
    await popupPage.click('#historyBtn');
    const historyPage = await historyTabPromise;
    const historyErrors = [];
    collectPageErrors(historyPage, historyErrors);
    await historyPage.waitForURL(
      new RegExp(`^${escapeRegex(extensionBase)}/src/history/history\\.html`),
      { timeout: 7000 }
    );

    await rl.question('Confirm history page loaded and looks healthy, then press Enter... ');

    const optionsPage = await context.newPage();
    const optionsErrors = [];
    collectPageErrors(optionsPage, optionsErrors);
    await optionsPage.goto(`${extensionBase}/src/options/options.html`, {
      waitUntil: 'domcontentloaded',
    });

    await optionsPage.selectOption('#defaultExportFormat', 'png');
    await optionsPage.click('#saveBtn');
    await optionsPage.waitForFunction(
      () => document.getElementById('status')?.textContent?.includes('Settings saved.'),
      { timeout: 5000 }
    );

    allErrors.push(...webErrors, ...popupErrors, ...historyErrors, ...optionsErrors);
    if (allErrors.length > 0) {
      throw new Error(`Manual smoke runtime errors:\n- ${allErrors.join('\n- ')}`);
    }

    console.log(
      'PASS manual real-extension smoke: capture, URL add/export, history open, options save.'
    );
  } finally {
    rl.close();
    await context.close();
    await fs.rm(userDataDir, { recursive: true, force: true });
  }
}

async function run() {
  const mode = parseMode();
  if (mode === 'real-extension-manual') {
    await runRealExtensionManualSmoke();
    return;
  }
  await runStubSmoke();
}

run().catch((err) => {
  console.error(err?.stack || err?.message || String(err));
  process.exit(1);
});
