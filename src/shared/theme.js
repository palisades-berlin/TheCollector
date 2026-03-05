import { getUserSettings } from './repos/settings-repo.js';

const THEME_VALUES = new Set(['light', 'dark', 'system']);

function detectSystemTheme() {
  try {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  } catch {
    return 'light';
  }
}

export function normalizeThemeValue(value) {
  return THEME_VALUES.has(value) ? value : 'system';
}

export function resolveTheme(value) {
  const normalized = normalizeThemeValue(value);
  if (normalized === 'system') return detectSystemTheme();
  return normalized;
}

export function applyThemeToDocument(theme) {
  const resolved = resolveTheme(theme);
  document.documentElement.setAttribute('data-theme', resolved);
  return resolved;
}

export async function applySavedTheme() {
  try {
    const settings = await getUserSettings();
    return applyThemeToDocument(settings?.theme);
  } catch {
    return applyThemeToDocument('system');
  }
}
