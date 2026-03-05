import { getScreenshotById } from '../shared/repos/screenshot-repo.js';
import { buildDownloadFilename } from '../shared/filename.js';
import { chromeDownloadBlob } from '../shared/download.js';

export async function hasDownloadsPermission() {
  return chrome.permissions.contains({ permissions: ['downloads'] });
}

async function convertPngBlobToJpeg(blob) {
  const bitmap = await createImageBitmap(blob);
  try {
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to create OffscreenCanvas context');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0);
    return await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.92 });
  } finally {
    if (typeof bitmap.close === 'function') bitmap.close();
  }
}

export async function downloadBlob({ blob, filename, saveAs }) {
  await chromeDownloadBlob({ blob, filename, saveAs });
}

export async function downloadCaptureParts({ ids, format, directory, saveAs, titleHint }) {
  const total = ids.length;
  const ext = format === 'jpg' ? 'jpg' : 'png';
  const effectiveSaveAs = total > 1 ? false : Boolean(saveAs);

  for (let i = 0; i < ids.length; i++) {
    const record = await getScreenshotById(ids[i]);
    if (!record?.blob) throw new Error(`Missing screenshot part: ${ids[i]}`);
    const blob = format === 'jpg' ? await convertPngBlobToJpeg(record.blob) : record.blob;
    const filename = buildDownloadFilename({
      title: titleHint || record.title || record.url || 'screenshot',
      index: i,
      total,
      ext,
      directory,
    });
    await downloadBlob({ blob, filename, saveAs: effectiveSaveAs });
  }
}
