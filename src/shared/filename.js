const FORBIDDEN_FILENAME_CHARS = new Set(['<', '>', ':', '"', '/', '\\', '|', '?', '*']);

export function sanitizeFilenameSegment(raw) {
  const cleaned = Array.from(String(raw || ''))
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      if (code <= 31) return false;
      return !FORBIDDEN_FILENAME_CHARS.has(ch);
    })
    .join('');

  return cleaned.replace(/\s+/g, ' ').trim().slice(0, 90);
}

export function sanitizeDirPath(raw) {
  if (!raw) return '';
  return String(raw)
    .replace(/\\/g, '/')
    .replace(/[^a-zA-Z0-9/_-]/g, '')
    .replace(/\.\./g, '')
    .replace(/\/{2,}/g, '/')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .slice(0, 120);
}

export function buildDownloadFilename({
  title,
  index = 0,
  total = 1,
  ext = 'png',
  directory = '',
  timestamp = null,
}) {
  const ts = (timestamp instanceof Date ? timestamp : new Date())
    .toISOString()
    .replace(/[:.]/g, '-');
  const safeTitle = sanitizeFilenameSegment(title) || 'screenshot';
  const partSuffix = Number(total) > 1 ? `-part-${Number(index) + 1}` : '';
  const name = `${safeTitle}-${ts}${partSuffix}.${ext}`;
  const dir = sanitizeDirPath(directory);
  return dir ? `${dir}/${name}` : name;
}
