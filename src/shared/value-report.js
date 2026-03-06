const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function toHost(value) {
  try {
    return new URL(String(value || '')).hostname.toLowerCase();
  } catch {
    return '';
  }
}

export function buildWeeklyValueReport({
  screenshotRecords = [],
  urlList = [],
  now = Date.now(),
} = {}) {
  const weekStart = Number(now) - WEEK_MS;
  const recentScreenshots = Array.isArray(screenshotRecords)
    ? screenshotRecords.filter((record) => Number(record?.timestamp || 0) >= weekStart)
    : [];
  const recentCaptureCount = recentScreenshots.length;

  const uniqueDomains = new Set();
  for (const record of recentScreenshots) {
    const host = toHost(record?.url);
    if (host) uniqueDomains.add(host);
  }

  const cleanUrlCount = Array.isArray(urlList) ? urlList.filter((url) => toHost(url)).length : 0;

  // Simple local estimate for user-facing value reporting (no tracking/model dependency).
  const estimatedMinutesSaved = Math.max(
    0,
    Math.min(240, recentCaptureCount * 2 + uniqueDomains.size + Math.round(cleanUrlCount * 0.5))
  );

  return {
    periodDays: 7,
    capturesSaved: recentCaptureCount,
    uniqueDomains: uniqueDomains.size,
    urlsCollected: cleanUrlCount,
    estimatedMinutesSaved,
  };
}
