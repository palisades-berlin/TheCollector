export const CAPTURE_PROFILE = {
  RESEARCH: 'research',
  INTEREST: 'interest',
  PRIVATE: 'private',
};

export const DEFAULT_CAPTURE_PROFILE_ID = CAPTURE_PROFILE.RESEARCH;

const PROFILE_CATALOG = {
  [CAPTURE_PROFILE.RESEARCH]: {
    id: CAPTURE_PROFILE.RESEARCH,
    label: 'Research',
    description: 'High-quality capture for review workflows',
    overrides: {
      defaultExportFormat: 'png',
      defaultPdfPageSize: 'auto',
      autoDownloadMode: 'off',
      saveAs: false,
      fitClipboardToDocsLimit: true,
    },
  },
  [CAPTURE_PROFILE.INTEREST]: {
    id: CAPTURE_PROFILE.INTEREST,
    label: 'Interest',
    description: 'Focused collection for topics of interest',
    overrides: {
      defaultExportFormat: 'png',
      defaultPdfPageSize: 'auto',
      autoDownloadMode: 'off',
      saveAs: false,
      fitClipboardToDocsLimit: true,
    },
  },
  [CAPTURE_PROFILE.PRIVATE]: {
    id: CAPTURE_PROFILE.PRIVATE,
    label: 'Private',
    description: 'Private capture defaults for sensitive content',
    overrides: {
      defaultExportFormat: 'pdf',
      defaultPdfPageSize: 'letter',
      autoDownloadMode: 'after_preview',
      saveAs: false,
      fitClipboardToDocsLimit: true,
    },
  },
};

export function normalizeCaptureProfileId(profileId) {
  return PROFILE_CATALOG[profileId] ? profileId : DEFAULT_CAPTURE_PROFILE_ID;
}

export function isCaptureProfileId(profileId) {
  return Boolean(
    PROFILE_CATALOG[
      String(profileId || '')
        .trim()
        .toLowerCase()
    ]
  );
}

export function sanitizeCaptureProfileId(profileId) {
  const next = String(profileId || '')
    .trim()
    .toLowerCase();
  return PROFILE_CATALOG[next] ? next : '';
}

export function getCaptureProfile(profileId) {
  return PROFILE_CATALOG[normalizeCaptureProfileId(profileId)];
}

export function listCaptureProfiles() {
  return [
    PROFILE_CATALOG[CAPTURE_PROFILE.RESEARCH],
    PROFILE_CATALOG[CAPTURE_PROFILE.INTEREST],
    PROFILE_CATALOG[CAPTURE_PROFILE.PRIVATE],
  ];
}

export function resolveCaptureSettings(baseSettings, profileId) {
  const profile = getCaptureProfile(profileId);
  return {
    ...baseSettings,
    ...profile.overrides,
  };
}

export function buildCaptureProfileUsageSummary(records = []) {
  const summary = {
    total: 0,
    recognized: 0,
    unknown: 0,
    byProfile: {
      [CAPTURE_PROFILE.RESEARCH]: 0,
      [CAPTURE_PROFILE.INTEREST]: 0,
      [CAPTURE_PROFILE.PRIVATE]: 0,
    },
  };

  for (const record of Array.isArray(records) ? records : []) {
    const rawProfileId = record?.captureProfileId || record?.captureReport?.profileId || '';
    const cleaned = sanitizeCaptureProfileId(rawProfileId);
    if (!rawProfileId) continue;
    summary.total += 1;
    if (!cleaned) {
      summary.unknown += 1;
      continue;
    }
    summary.recognized += 1;
    summary.byProfile[cleaned] += 1;
  }

  return summary;
}
