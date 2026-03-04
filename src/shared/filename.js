export function sanitizeFilenameSegment(raw) {
  return String(raw || '')
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 90);
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
