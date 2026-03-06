import assert from 'node:assert/strict';
import { createPreviewExportController } from '../src/preview/preview-export.js';

function createBaseDeps() {
  const calls = {
    toast: [],
    error: [],
    anchor: [],
    runtimeMessages: [],
  };

  globalThis.chrome = {
    permissions: {
      contains: async () => false,
    },
    runtime: {
      sendMessage: async (msg) => {
        calls.runtimeMessages.push(msg);
        return { ok: true };
      },
    },
  };

  Object.defineProperty(globalThis, 'navigator', {
    value: {
      clipboard: {
        write: async () => {},
      },
    },
    configurable: true,
  });
  Object.defineProperty(globalThis, 'ClipboardItem', {
    value: class {
      constructor(v) {
        this.v = v;
      }
    },
    configurable: true,
  });
  Object.defineProperty(globalThis, 'document', {
    value: {
      title: 'THE Collector · Test Title',
      body: {
        appendChild: () => {},
        removeChild: () => {},
      },
      createElement: () => ({
        getContext: () => ({ drawImage: () => {} }),
        click: () => {},
        set href(_value) {},
        width: 0,
        height: 0,
      }),
    },
    configurable: true,
  });

  const buttons = {
    downloadPngBtn: { addEventListener: () => {}, disabled: false, innerHTML: 'Save PNG' },
    downloadJpgBtn: { addEventListener: () => {}, disabled: false, innerHTML: 'Save JPG' },
    downloadPdfBtn: { addEventListener: () => {}, disabled: false, innerHTML: 'Save PDF' },
    copyImageBtn: { addEventListener: () => {}, disabled: false, innerHTML: 'Copy' },
    presetEmailBtn: { addEventListener: () => {}, disabled: false },
    presetDocsBtn: { addEventListener: () => {}, disabled: false },
    presetPdfAutoBtn: { addEventListener: () => {}, disabled: false },
  };

  const pdfPageSizeEl = { value: 'a4' };

  const controller = createPreviewExportController({
    MSG: { PT_DOWNLOAD: 'PT_DOWNLOAD' },
    showToast: (msg, type) => calls.toast.push({ msg, type }),
    anchorDownloadBlob: async (payload) => calls.anchor.push(payload),
    buildPdfFromCanvas: async () => new Blob(['pdf'], { type: 'application/pdf' }),
    sanitizeHttpUrl: (v) => v,
    buttons,
    pdfPageSizeEl,
    canvasToBlob: async () => new Blob(['img'], { type: 'image/png' }),
    buildEditedCanvas: async () => ({ width: 1200, height: 900, getContext: () => ({}) }),
    getCurrentBlob: () => new Blob(['img'], { type: 'image/png' }),
    getSettings: () => ({ autoDownloadMode: 'off', defaultExportFormat: 'png' }),
    getSourceUrl: () => 'https://example.com',
    getCaptureTimestamp: () => Date.now(),
    showError: (msg) => calls.error.push(msg),
  });

  return { controller, calls, buttons };
}

async function testMaybeAutoDownloadRunsOnce() {
  const deps = createBaseDeps();
  const autoCalls = [];
  const controller = createPreviewExportController({
    MSG: { PT_DOWNLOAD: 'PT_DOWNLOAD' },
    showToast: () => {},
    anchorDownloadBlob: async () => {
      autoCalls.push('anchor');
    },
    buildPdfFromCanvas: async () => new Blob(['pdf'], { type: 'application/pdf' }),
    sanitizeHttpUrl: (v) => v,
    buttons: deps.buttons,
    pdfPageSizeEl: { value: 'auto' },
    canvasToBlob: async () => new Blob(['img'], { type: 'image/png' }),
    buildEditedCanvas: async () => ({ width: 100, height: 100, getContext: () => ({}) }),
    getCurrentBlob: () => new Blob(['img'], { type: 'image/png' }),
    getSettings: () => ({ autoDownloadMode: 'after_preview', defaultExportFormat: 'png' }),
    getSourceUrl: () => '',
    getCaptureTimestamp: () => Date.now(),
    showError: () => {},
  });

  await controller.maybeAutoDownload();
  await new Promise((r) => setTimeout(r, 350));
  await controller.maybeAutoDownload();
  await new Promise((r) => setTimeout(r, 50));

  assert.equal(autoCalls.length, 1, 'auto download should run once');
  process.stdout.write('PASS preview export auto-download executes once\n');
}

async function testBindEventsCanAttachWithoutThrowing() {
  const { controller } = createBaseDeps();
  controller.bindEvents();
  process.stdout.write('PASS preview export binds events\n');
}

async function run() {
  try {
    await testMaybeAutoDownloadRunsOnce();
    await testBindEventsCanAttachWithoutThrowing();
  } catch (err) {
    process.stderr.write(`FAIL preview export suite\n${err.stack}\n`);
    process.exitCode = 1;
  }
}

await run();
