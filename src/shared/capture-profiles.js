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
