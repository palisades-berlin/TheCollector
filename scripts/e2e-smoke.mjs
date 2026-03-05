import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
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

async function run() {
  const { server, port } = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addInitScript(createChromeStubInitScript());

  const errorsByPage = [];

  try {
    for (const pagePath of PAGES) {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
      });

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

run().catch((err) => {
  console.error(err?.stack || err?.message || String(err));
  process.exit(1);
});
