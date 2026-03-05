import { buildDownloadFilename } from '../shared/filename.js';
import { chromeDownloadBlob, anchorDownloadBlob } from '../shared/download.js';

function blobExt(blob) {
  const type = blob?.type || '';
  if (type.includes('jpeg')) return 'jpg';
  if (type.includes('pdf')) return 'pdf';
  return 'png';
}

export async function downloadRecord({
  record,
  settings,
  partIndex,
  partTotal,
  titleHint,
  allowSaveAs,
}) {
  const ext = blobExt(record.blob);
  const hasDownloads = await chrome.permissions.contains({ permissions: ['downloads'] });
  if (!hasDownloads) {
    await anchorDownloadBlob({
      blob: record.blob,
      filename: `screenshot-${Date.now()}.${ext}`,
    });
    return;
  }

  const filename = buildDownloadFilename({
    title: titleHint || record.url || record.title || 'screenshot',
    index: partIndex,
    total: partTotal,
    ext,
    directory: settings.downloadDirectory,
  });
  await chromeDownloadBlob({
    blob: record.blob,
    filename,
    saveAs: partTotal > 1 ? false : Boolean(allowSaveAs && settings.saveAs),
  });
}
