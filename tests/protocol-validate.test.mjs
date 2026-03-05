import assert from 'node:assert/strict';
import {
  validateCaptureStartPayload,
  validatePreviewDownloadPayload,
  validateOffscreenStitchPayload,
  validateCsScrollPayload,
} from '../src/shared/protocol-validate.js';

function test(name, fn) {
  try {
    fn();
    process.stdout.write(`PASS ${name}\n`);
  } catch (err) {
    process.stderr.write(`FAIL ${name}\n${err.stack}\n`);
    process.exitCode = 1;
  }
}

test('validateCaptureStartPayload accepts positive tab id only', () => {
  assert.deepEqual(validateCaptureStartPayload({ tabId: 5 }), {
    ok: true,
    value: { tabId: 5 },
  });
  assert.deepEqual(validateCaptureStartPayload({ tabId: 0 }), {
    ok: false,
    error: 'Invalid tab id',
  });
  assert.deepEqual(validateCaptureStartPayload(null), {
    ok: false,
    error: 'Invalid tab id',
  });
});

test('validatePreviewDownloadPayload validates blob and normalizes fields', () => {
  const blob = new Blob(['abc'], { type: 'text/plain' });
  const parsed = validatePreviewDownloadPayload({
    blob,
    ext: 'gif',
    partIndex: -4,
    partTotal: 0,
    title: '  ',
  });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.value.ext, 'png');
  assert.equal(parsed.value.partIndex, 0);
  assert.equal(parsed.value.partTotal, 1);
  assert.equal(parsed.value.title, 'screenshot');
  assert.equal(parsed.value.blob, blob);

  assert.deepEqual(validatePreviewDownloadPayload({ ext: 'jpg' }), {
    ok: false,
    error: 'Download payload is missing blob data',
  });

  const parsedPdf = validatePreviewDownloadPayload({
    blob,
    ext: 'pdf',
    partIndex: 3,
    partTotal: 2,
    title: 'Report',
  });
  assert.equal(parsedPdf.ok, true);
  assert.equal(parsedPdf.value.ext, 'pdf');
  assert.equal(parsedPdf.value.partIndex, 3);
  assert.equal(parsedPdf.value.partTotal, 2);
  assert.equal(parsedPdf.value.title, 'Report');

  assert.deepEqual(validatePreviewDownloadPayload(null), {
    ok: false,
    error: 'Invalid download payload',
  });
});

test('validateOffscreenStitchPayload enforces id and dimensions', () => {
  assert.deepEqual(
    validateOffscreenStitchPayload({
      id: 'job-1',
      totalW: 1000,
      totalH: 2000,
      sourceUrl: 42,
      title: null,
    }),
    {
      ok: true,
      value: {
        id: 'job-1',
        totalW: 1000,
        totalH: 2000,
        sourceUrl: '',
        title: '',
      },
    }
  );

  assert.deepEqual(validateOffscreenStitchPayload({ id: '', totalW: 100, totalH: 100 }), {
    ok: false,
    error: 'Invalid stitch id',
  });
  assert.deepEqual(validateOffscreenStitchPayload({ id: 'x', totalW: 0, totalH: 100 }), {
    ok: false,
    error: 'Invalid stitch dimensions',
  });
  assert.deepEqual(validateOffscreenStitchPayload(null), {
    ok: false,
    error: 'Invalid stitch payload',
  });

  assert.deepEqual(
    validateOffscreenStitchPayload({
      id: 'job-2',
      totalW: 10,
      totalH: 20,
      sourceUrl: 'https://example.com',
      title: 'Shot',
    }),
    {
      ok: true,
      value: {
        id: 'job-2',
        totalW: 10,
        totalH: 20,
        sourceUrl: 'https://example.com',
        title: 'Shot',
      },
    }
  );
});

test('validateCsScrollPayload enforces finite coordinates', () => {
  assert.deepEqual(validateCsScrollPayload({ x: 10, y: 20, targetId: 't_1' }), {
    ok: true,
    value: { x: 10, y: 20, targetId: 't_1' },
  });
  assert.deepEqual(validateCsScrollPayload({ x: 'a', y: 20 }), {
    ok: false,
    error: 'Invalid scroll coordinates',
  });
  assert.deepEqual(validateCsScrollPayload({ x: 1, y: 2, targetId: 7 }), {
    ok: false,
    error: 'Invalid target id',
  });
  assert.deepEqual(validateCsScrollPayload({ x: 1, y: 2 }), {
    ok: true,
    value: { x: 1, y: 2, targetId: null },
  });
  assert.deepEqual(validateCsScrollPayload(null), {
    ok: false,
    error: 'Invalid scroll payload',
  });
});
