export const NOTIFICATION_CADENCE = {
  LOW: 'low',
  BALANCED: 'balanced',
  HIGH: 'high',
};

const CADENCE_MIN_AGE_MS = {
  [NOTIFICATION_CADENCE.LOW]: 7 * 24 * 60 * 60 * 1000,
  [NOTIFICATION_CADENCE.BALANCED]: 3 * 24 * 60 * 60 * 1000,
  [NOTIFICATION_CADENCE.HIGH]: 1 * 24 * 60 * 60 * 1000,
};

export function normalizeNotificationCadence(value) {
  if (value === NOTIFICATION_CADENCE.LOW) return NOTIFICATION_CADENCE.LOW;
  if (value === NOTIFICATION_CADENCE.HIGH) return NOTIFICATION_CADENCE.HIGH;
  return NOTIFICATION_CADENCE.BALANCED;
}

export function buildDefaultNudgeState() {
  return {
    dismissedById: {},
    snoozedUntil: 0,
  };
}

export function normalizeNudgeState(raw) {
  const base = buildDefaultNudgeState();
  if (!raw || typeof raw !== 'object') return base;

  const dismissedById = {};
  const source =
    raw.dismissedById && typeof raw.dismissedById === 'object' ? raw.dismissedById : {};
  for (const [id, timestamp] of Object.entries(source)) {
    const ts = Number(timestamp);
    if (!id || !Number.isFinite(ts) || ts <= 0) continue;
    dismissedById[id] = ts;
  }

  const snoozedUntil = Number(raw.snoozedUntil);
  return {
    dismissedById,
    snoozedUntil: Number.isFinite(snoozedUntil) && snoozedUntil > 0 ? snoozedUntil : 0,
  };
}

export function evaluateRevisitNudge(records = [], options = {}) {
  const now = Number(options.now || Date.now());
  const cadence = normalizeNotificationCadence(options.cadence);
  const state = normalizeNudgeState(options.state);

  if (state.snoozedUntil > now) return null;
  if (!Array.isArray(records) || records.length === 0) return null;

  const minAgeMs = CADENCE_MIN_AGE_MS[cadence] || CADENCE_MIN_AGE_MS[NOTIFICATION_CADENCE.BALANCED];

  const sorted = [...records]
    .filter((record) => record && record.id)
    .sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));

  const candidate = sorted.find((record) => {
    const ts = Number(record.timestamp || 0);
    if (!Number.isFinite(ts) || ts <= 0) return false;
    if (state.dismissedById[record.id]) return false;
    return now - ts >= minAgeMs;
  });

  if (!candidate) return null;

  const ageMs = now - Number(candidate.timestamp || now);
  const ageDays = Math.max(1, Math.floor(ageMs / (24 * 60 * 60 * 1000)));

  return {
    id: String(candidate.id),
    title: String(candidate.title || '').trim() || 'Untitled capture',
    url: String(candidate.url || '').trim(),
    ageDays,
    message: `Revisit this capture from ${ageDays} day${ageDays === 1 ? '' : 's'} ago.`,
  };
}
