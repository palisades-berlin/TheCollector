import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const ROOT = process.cwd();
const HOST = '127.0.0.1';
const FIGMA_FILE_URL =
  'https://www.figma.com/design/sECUN6qSqUygWoG7PhC548/THECollector---UI-Kit---Screens?t=UVQ55HTnnPvLrqyo-0';
const FIGMA_FILE_KEY = 'sECUN6qSqUygWoG7PhC548';
const FIGMA_ACTIVE_HANDOFF_NODE = '19:2';

// Snapshot-to-Figma mapping contract for parity work.
// Use this mapping as the first reference point when updating or reviewing visual baselines.
const FIGMA_NODE_MAP = {
  sharedPrimitives: '1:4',
  onboardingDefault: '1:830',
  popupStates: '1:4',
  historyStates: '1:4',
  optionsStates: '1:753',
  previewStates: '1:4',
};

// Per-snapshot Figma node references for calibration traceability.
const FIGMA_SNAPSHOT_NODE_MAP = {
  'shared-primitives-matrix.png': '1:4',
  'shared-primitives-matrix-dark.png': '1:930',
  'onboarding-default.png': '1:830',
  'popup-capture-default.png': '1:4',
  'popup-urls-default.png': '1:4',
  'popup-error-state.png': '1:885',
  'popup-success-state.png': '1:885',
  'history-default.png': '1:4',
  'history-empty.png': '1:885',
  'history-loading.png': '1:885',
  'history-modal-open.png': '1:4',
  'options-default.png': '1:753',
  'options-feedback-state.png': '1:753',
  'preview-error.png': '1:885',
  'preview-edit-mode.png': '1:4',
  'preview-toolbar-wrap.png': '1:4',
};

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

    // Keep visual snapshots deterministic across machines by pinning a test font stack.
    const applyDeterministicFontStack = () => {
      globalThis.document?.documentElement?.style?.setProperty(
        '--sc-font-sans',
        'Arial, Helvetica, sans-serif'
      );
      globalThis.document?.documentElement?.style?.setProperty(
        '--sc-font-mono',
        'Menlo, Consolas, monospace'
      );
    };

    if (globalThis.document?.readyState === 'loading') {
      globalThis.document.addEventListener('DOMContentLoaded', applyDeterministicFontStack, {
        once: true,
      });
    } else {
      applyDeterministicFontStack();
    }
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

test.describe('Figma parity snapshots', () => {
  let server;
  let port;
  let baseUrl;

  test.beforeAll(async () => {
    // Ensure the Figma sync contract constants are referenced by this suite.
    void FIGMA_FILE_URL;
    void FIGMA_FILE_KEY;
    void FIGMA_ACTIVE_HANDOFF_NODE;
    void FIGMA_NODE_MAP;
    void FIGMA_SNAPSHOT_NODE_MAP;

    const started = await startStaticServer();
    server = started.server;
    port = started.port;
    baseUrl = `http://${HOST}:${port}`;
  });

  test.afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(createChromeStubInitScript());
  });

  test('shared primitives / calibration matrix', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.setContent(
      `<!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <link rel="stylesheet" href="${baseUrl}/src/shared/ui.css" />
          <style>
            body {
              margin: 0;
              padding: 24px;
              font-family: var(--sc-font-sans);
              background: var(--sc-color-bg);
              color: var(--sc-color-text);
            }
            .matrix {
              display: grid;
              gap: 16px;
            }
            .card {
              display: grid;
              gap: 12px;
              padding: 16px;
            }
            .row {
              display: flex;
              align-items: center;
              flex-wrap: wrap;
              gap: 8px;
            }
            .tabs {
              max-width: 360px;
            }
          </style>
        </head>
        <body>
          <main class="matrix">
            <section class="sc-card card">
              <strong>Buttons</strong>
              <div class="row">
                <button class="sc-btn">Default</button>
                <button class="sc-btn sc-btn-primary">Primary</button>
                <button class="sc-btn sc-btn-secondary">Secondary</button>
                <button class="sc-btn sc-btn-ghost">Ghost</button>
                <button class="sc-btn sc-btn-danger">Danger</button>
                <button class="sc-btn sc-btn-sm">Small</button>
                <button class="sc-btn sc-btn-md">Medium</button>
                <button class="sc-btn" disabled>Disabled</button>
              </div>
            </section>
            <section class="sc-card card">
              <strong>Inputs</strong>
              <div class="row">
                <input class="sc-input" placeholder="Text input" style="max-width: 280px" />
                <select class="sc-select" style="max-width: 220px">
                  <option>All</option>
                  <option>Today</option>
                </select>
              </div>
            </section>
            <section class="sc-card card">
              <strong>Tabs / Pills / Banners</strong>
              <div class="tabs sc-tablist" role="tablist">
                <button class="sc-tab active" role="tab" aria-selected="true">Capture</button>
                <button class="sc-tab" role="tab" aria-selected="false">URLs</button>
              </div>
              <div class="row">
                <span class="sc-pill">Default</span>
                <span class="sc-pill sc-pill-ok">Success</span>
                <span class="sc-pill sc-pill-warn">Warning</span>
                <span class="sc-pill sc-pill-off">Off</span>
              </div>
              <div class="sc-banner sc-banner-info">Info banner</div>
              <div class="sc-banner sc-banner-success">Success banner</div>
              <div class="sc-banner sc-banner-warn">Warning banner</div>
              <div class="sc-banner sc-banner-error">Error banner</div>
            </section>
          </main>
        </body>
      </html>`,
      { waitUntil: 'domcontentloaded' }
    );

    await page.waitForTimeout(120);
    await expect(page).toHaveScreenshot('shared-primitives-matrix.png', {
      maxDiffPixels: 13000,
    });
  });

  test('shared primitives / dark theme matrix', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.setContent(
      `<!doctype html>
      <html lang="en" data-theme="dark">
        <head>
          <meta charset="utf-8" />
          <link rel="stylesheet" href="${baseUrl}/src/shared/ui.css" />
          <style>
            body {
              margin: 0;
              padding: 24px;
              font-family: var(--sc-font-sans);
              background: var(--sc-color-bg);
              color: var(--sc-color-text);
            }
            .matrix {
              display: grid;
              gap: 16px;
            }
            .card {
              display: grid;
              gap: 12px;
              padding: 16px;
            }
            .row {
              display: flex;
              align-items: center;
              flex-wrap: wrap;
              gap: 8px;
            }
          </style>
        </head>
        <body>
          <main class="matrix">
            <section class="sc-card card">
              <strong>Dark Buttons + Inputs</strong>
              <div class="row">
                <button class="sc-btn">Default</button>
                <button class="sc-btn sc-btn-primary">Primary</button>
                <button class="sc-btn sc-btn-secondary">Secondary</button>
                <button class="sc-btn sc-btn-ghost">Ghost</button>
                <button class="sc-btn sc-btn-danger">Danger</button>
              </div>
              <div class="row">
                <input class="sc-input" placeholder="Text input" style="max-width: 280px" />
                <select class="sc-select" style="max-width: 220px">
                  <option>All</option>
                  <option>Today</option>
                </select>
              </div>
            </section>
          </main>
        </body>
      </html>`,
      { waitUntil: 'domcontentloaded' }
    );
    await page.waitForTimeout(120);
    await expect(page).toHaveScreenshot('shared-primitives-matrix-dark.png', {
      maxDiffPixels: 4000,
    });
  });

  test('onboarding / default', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${baseUrl}/src/onboarding/onboarding.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(200);
    await expect(page).toHaveScreenshot('onboarding-default.png', { fullPage: true });
  });

  test('popup / capture + urls + states', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 640 });
    await page.goto(`${baseUrl}/src/popup/popup.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(200);

    await expect(page).toHaveScreenshot('popup-capture-default.png', {
      maxDiffPixels: 10200,
    });

    await page.click('#urlsTabBtn');
    await page.waitForTimeout(200);
    await expect(page).toHaveScreenshot('popup-urls-default.png', {
      maxDiffPixels: 10400,
    });

    await page.evaluate(() => {
      globalThis.document.getElementById('errorMsg').classList.remove('hidden');
      globalThis.document.getElementById('errorMsg').textContent =
        'Sync failed. Please sign in to continue.';
      globalThis.document.getElementById('doneMsg').classList.add('hidden');
      globalThis.document.getElementById('progress').classList.add('hidden');
    });
    await expect(page).toHaveScreenshot('popup-error-state.png', {
      maxDiffPixels: 10400,
    });

    await page.evaluate(() => {
      globalThis.document.getElementById('errorMsg').classList.add('hidden');
      const done = globalThis.document.getElementById('doneMsg');
      done.classList.remove('hidden');
      globalThis.document.getElementById('doneMsgText').textContent = 'Saved. Open in Sidebar.';
    });
    await expect(page).toHaveScreenshot('popup-success-state.png');
  });

  test('history / list + empty + loading + modal', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${baseUrl}/src/history/history.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      const grid = globalThis.document.getElementById('grid');
      const cardTpl = globalThis.document.getElementById('cardTpl');
      const count = globalThis.document.getElementById('count');
      const empty = globalThis.document.getElementById('empty');
      const loading = globalThis.document.getElementById('loading');
      const skeleton = globalThis.document.getElementById('historySkeleton');
      const diagnostics = globalThis.document.getElementById('captureDiagnostics');

      globalThis.document.getElementById('clearAllBtn').classList.remove('hidden');
      globalThis.document.getElementById('openFilesBtn').classList.remove('hidden');
      globalThis.document.getElementById('compareBtn').classList.remove('hidden');
      globalThis.document.getElementById('compareBtn').textContent = 'Compare (0/2)';
      count.textContent = '· 1 screenshot';

      grid.innerHTML = '';
      const card = cardTpl.content.firstElementChild.cloneNode(true);
      card.querySelector('.card-url').textContent = 'https://www.figma.com';
      card.querySelector('.card-meta').textContent = '3/6/2026 · 3436×1790px';
      card.querySelector('.card-diagnostic').classList.add('hidden');
      grid.appendChild(card);

      grid.classList.remove('hidden');
      empty.classList.add('hidden');
      loading.classList.add('hidden');
      skeleton.classList.add('hidden');
      diagnostics.classList.add('hidden');
    });

    await expect(page).toHaveScreenshot('history-default.png', {
      fullPage: true,
      maxDiffPixels: 6300,
    });

    await page.evaluate(() => {
      globalThis.document.getElementById('grid').classList.add('hidden');
      globalThis.document.getElementById('empty').classList.remove('hidden');
      globalThis.document.getElementById('loading').classList.add('hidden');
      globalThis.document.getElementById('historySkeleton').classList.add('hidden');
    });
    await expect(page).toHaveScreenshot('history-empty.png', {
      fullPage: true,
      maxDiffPixels: 5800,
    });

    await page.evaluate(() => {
      globalThis.document.getElementById('empty').classList.add('hidden');
      globalThis.document.getElementById('loading').classList.remove('hidden');
    });
    await expect(page).toHaveScreenshot('history-loading.png', {
      fullPage: true,
      maxDiffPixels: 4700,
    });

    await page.evaluate(() => {
      globalThis.document.getElementById('loading').classList.add('hidden');
      globalThis.document.getElementById('filesOverlay').classList.remove('hidden');
    });
    await expect(page).toHaveScreenshot('history-modal-open.png', { fullPage: true });
  });

  test('options / default + save feedback + badge variants', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.goto(`${baseUrl}/src/options/options.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(200);

    await expect(page).toHaveScreenshot('options-default.png', { fullPage: true });

    await page.evaluate(() => {
      const status = globalThis.document.getElementById('status');
      status.classList.remove('hidden');
      status.classList.add('sc-banner-success');
      status.textContent = 'Settings saved.';
      globalThis.document.getElementById('perm-activeTab').classList.add('sc-pill-ok');
      globalThis.document.getElementById('perm-tabs').classList.add('sc-pill-warn');
      globalThis.document.getElementById('perm-downloads').classList.add('sc-pill-off');
    });
    await expect(page).toHaveScreenshot('options-feedback-state.png', { fullPage: true });
  });

  test('preview / default + edit mode + error', async ({ page }) => {
    await page.setViewportSize({ width: 1360, height: 920 });
    await page.goto(`${baseUrl}/src/preview/preview.html?id=missing`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(200);

    await expect(page).toHaveScreenshot('preview-error.png', {
      fullPage: true,
      maxDiffPixels: 17000,
    });

    await page.evaluate(() => {
      globalThis.document.getElementById('errorMsg').classList.add('hidden');
      globalThis.document.getElementById('loading').classList.add('hidden');
      globalThis.document.getElementById('stage').classList.remove('hidden');
      const img = globalThis.document.getElementById('screenshot');
      img.classList.remove('hidden');
      img.src =
        'data:image/svg+xml;utf8,' +
        encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="560"><rect width="100%" height="100%" fill="#f7fbff"/><rect x="64" y="64" width="832" height="432" rx="8" fill="#e3f2fd" stroke="#90caf9"/><text x="96" y="120" font-size="26" fill="#1565c0">Preview Canvas Placeholder</text></svg>'
        );
      globalThis.document.getElementById('dimensions').textContent = '960 × 560 px';
      globalThis.document.getElementById('captureTime').textContent = '2026-03-05 14:00';
      globalThis.document.getElementById('sourceUrl').textContent = 'https://example.com/article';
      globalThis.document.getElementById('toolHighlight').classList.add('active');
      globalThis.document.getElementById('modeNotice').classList.remove('hidden');
      globalThis.document.getElementById('modeNotice').textContent =
        'Captured using inner scroll-container mode.';
    });

    await expect(page).toHaveScreenshot('preview-edit-mode.png', {
      fullPage: true,
      maxDiffPixels: 21000,
    });

    await page.setViewportSize({ width: 1024, height: 920 });
    await page.waitForTimeout(120);
    await expect(page).toHaveScreenshot('preview-toolbar-wrap.png', {
      fullPage: true,
      maxDiffPixels: 26000,
    });
  });
});
