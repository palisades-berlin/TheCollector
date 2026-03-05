import { getSettings, setSettings } from '../settings.js';

export async function getUserSettings() {
  return getSettings();
}

export async function setUserSettings(partial) {
  return setSettings(partial);
}
