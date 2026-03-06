import { buildDefaultNudgeState, normalizeNudgeState } from '../nudges.js';

const REVISIT_NUDGE_STATE_KEY = 'revisitNudgeState';
const MAX_DISMISSED_ENTRIES = 200;

async function loadRawNudgeState() {
  const state = await chrome.storage.local.get({
    [REVISIT_NUDGE_STATE_KEY]: buildDefaultNudgeState(),
  });
  return normalizeNudgeState(state[REVISIT_NUDGE_STATE_KEY]);
}

async function saveRawNudgeState(nextState) {
  const normalized = normalizeNudgeState(nextState);
  await chrome.storage.local.set({ [REVISIT_NUDGE_STATE_KEY]: normalized });
  return normalized;
}

export async function loadRevisitNudgeState() {
  return loadRawNudgeState();
}

export async function dismissRevisitNudge(id, now = Date.now()) {
  const key = String(id || '').trim();
  if (!key) return loadRawNudgeState();

  const current = await loadRawNudgeState();
  const next = {
    ...current,
    dismissedById: {
      ...current.dismissedById,
      [key]: Number(now) || Date.now(),
    },
  };

  const entries = Object.entries(next.dismissedById).sort((a, b) => Number(b[1]) - Number(a[1]));
  next.dismissedById = Object.fromEntries(entries.slice(0, MAX_DISMISSED_ENTRIES));
  return saveRawNudgeState(next);
}

export async function snoozeRevisitNudges(durationMs, now = Date.now()) {
  const ms = Number(durationMs);
  const nextSnoozeUntil = (Number(now) || Date.now()) + (Number.isFinite(ms) && ms > 0 ? ms : 0);
  const current = await loadRawNudgeState();
  return saveRawNudgeState({
    ...current,
    snoozedUntil: nextSnoozeUntil,
  });
}
