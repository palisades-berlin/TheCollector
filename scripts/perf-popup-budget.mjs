import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const HOST = '127.0.0.1';
const RUNS = Number(process.env.PERF_RUNS || 7);
const WARMUP_RUNS = Number(process.env.PERF_WARMUP_RUNS || 1);
const P95_BUDGET_MS = Number(process.env.POPUP_P95_BUDGET_MS || 150);
const PACKAGE_BUDGET_BYTES = Number(process.env.PACKAGE_BUDGET_BYTES || 400000);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

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

function createChromeStubInitScript() {
  return () => {
    const createEvent = () => ({
      addListener: () => {},
      removeListener: () => {},
      hasListener: () => false,
    });
    const storageArea = {
      get: async (keys) => {
        if (keys == null) return {};
        if (Array.isArray(keys)) return Object.fromEntries(keys.map((k) => [k, undefined]));
        if (typeof keys === 'string') return { [keys]: undefined };
        return keys;
      },
      set: async () => {},
      remove: async () => {},
      clear: async () => {},
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
      storage: { local: storageArea, sync: storageArea },
      permissions: {
        contains: async () => true,
        request: async () => true,
        remove: async () => true,
      },
      downloads: { download: async () => 1 },
      commands: { onCommand: createEvent() },
      offscreen: {
        hasDocument: async () => true,
        createDocument: async () => {},
        closeDocument: async () => {},
      },
      scripting: { executeScript: async () => [] },
    };
  };
}

function percentile95(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);
  return sorted[idx];
}

async function runPopupPerf(baseUrl) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addInitScript(createChromeStubInitScript());

  const times = [];
  try {
    for (let i = 0; i < WARMUP_RUNS; i++) {
      const page = await context.newPage();
      await page.goto(`${baseUrl}/src/popup/popup.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#captureBtn', { timeout: 5000 });
      await page.close();
    }

    for (let i = 0; i < RUNS; i++) {
      const page = await context.newPage();
      const start = performance.now();
      await page.goto(`${baseUrl}/src/popup/popup.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#captureBtn', { timeout: 5000 });
      const end = performance.now();
      times.push(end - start);
      await page.close();
    }
  } finally {
    await context.close();
    await browser.close();
  }

  const p95 = percentile95(times);
  console.log(`Popup warm-up runs ignored: ${WARMUP_RUNS}`);
  console.log(`Popup interactive timings (ms): ${times.map((v) => v.toFixed(1)).join(', ')}`);
  console.log(`Popup p95 (ms): ${p95.toFixed(1)} (budget ${P95_BUDGET_MS})`);
  if (p95 > P95_BUDGET_MS) {
    throw new Error(`Popup p95 ${p95.toFixed(1)}ms exceeded budget ${P95_BUDGET_MS}ms`);
  }
}

async function checkPackageSize() {
  const manifest = JSON.parse(await fs.readFile(path.join(ROOT, 'manifest.json'), 'utf8'));
  const zipPath = path.join(ROOT, 'dist', `the-collector-v${manifest.version}.zip`);
  let stat;
  try {
    stat = await fs.stat(zipPath);
  } catch {
    console.log(`No package zip at ${zipPath}. Run package step before package-size gate.`);
    return;
  }
  console.log(`Package size: ${stat.size} bytes (budget ${PACKAGE_BUDGET_BYTES})`);
  if (stat.size > PACKAGE_BUDGET_BYTES) {
    throw new Error(`Package size ${stat.size} exceeded budget ${PACKAGE_BUDGET_BYTES}`);
  }
}

async function main() {
  const started = await startStaticServer();
  const baseUrl = `http://${HOST}:${started.port}`;
  try {
    await runPopupPerf(baseUrl);
    await checkPackageSize();
  } finally {
    await new Promise((resolve) => started.server.close(resolve));
  }
  console.log('PASS performance gate.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
