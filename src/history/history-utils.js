export function getRecordDomain(record) {
  try {
    return new URL(record.url).hostname.toLowerCase();
  } catch {
    return String(record.url || '').toLowerCase();
  }
}

export function getCanonicalTldFromHost(hostname) {
  const host = String(hostname || '')
    .trim()
    .toLowerCase();
  if (!host || !host.includes('.')) return '';

  const parts = host.split('.').filter(Boolean);
  if (parts.length < 2) return '';
  const tail2 = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
  if (MULTI_LABEL_PUBLIC_SUFFIXES.has(tail2) && parts.length >= 3) {
    return `.${tail2}`;
  }

  return `.${parts[parts.length - 1]}`;
}

const MULTI_LABEL_PUBLIC_SUFFIXES = new Set([
  'co.uk',
  'org.uk',
  'gov.uk',
  'ac.uk',
  'co.jp',
  'com.au',
  'net.au',
  'org.au',
  'co.nz',
]);

export function buildDomainFilterSuggestions(records) {
  const counts = new Map();
  for (const record of records || []) {
    const domain = getRecordDomain(record);
    if (!domain || !domain.includes('.') || domain.includes('/')) continue;
    counts.set(domain, Number(counts.get(domain) || 0) + 1);
  }

  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.value.localeCompare(b.value);
    });
}

export function getRecordExportType(record) {
  const type = String(record.blobType || '').toLowerCase();
  if (type.includes('pdf')) return 'pdf';
  if (type.includes('jpeg') || type.includes('jpg')) return 'jpg';
  return 'png';
}

export function buildGroups(allRecords) {
  return allRecords
    .map((record) => ({
      baseId: record.id,
      records: [record],
      timestamp: record.timestamp,
      previewId: record.id,
      url: record.url || '',
      totalBytes: record.byteSize || 0,
    }))
    .sort((a, b) => b.timestamp - a.timestamp);
}

export function buildRecordHints(record) {
  const hints = [];
  if (record.splitCount > 1 && record.splitPart > 0) {
    hints.push(`Part ${record.splitPart}/${record.splitCount}`);
  }
  if (record.stitchedFrom) hints.push('Stitched');
  return hints;
}

export function formatDuration(ms) {
  const seconds = Math.max(0, Number(ms || 0)) / 1000;
  if (seconds < 10) return `${seconds.toFixed(1)}s`;
  return `${Math.round(seconds)}s`;
}

export function buildCardDiagnosticText(record) {
  const durationMs = Number(record.captureDurationMs || 0);
  const totalTiles = Number(record.captureTotalTiles || 0);
  const retries = Number(record.captureRetries || 0);
  const quotaBackoffs = Number(record.captureQuotaBackoffs || 0);
  const fallbackUsed = String(record.captureFallbackUsed || 'none');
  const notes = [];

  if (fallbackUsed === 'oversized_autoscale') {
    notes.push('Auto-scaled oversized page');
  }
  if (durationMs >= 12000) {
    const tileText = totalTiles > 0 ? `, ${totalTiles} tiles` : '';
    notes.push(`Slow capture (${formatDuration(durationMs)}${tileText})`);
  }
  if (retries > 0 || quotaBackoffs > 0) {
    notes.push(`Capture retries: ${retries} (quota backoffs: ${quotaBackoffs})`);
  }

  return notes.join(' · ');
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

export async function runWithConcurrency(items, limit, worker) {
  let index = 0;
  const runners = Array.from({ length: Math.max(1, limit) }, async () => {
    while (index < items.length) {
      const current = items[index++];
      await worker(current);
    }
  });
  await Promise.all(runners);
}
