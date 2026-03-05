import {
  saveScreenshot,
  getScreenshot,
  listScreenshots,
  listScreenshotMeta,
  deleteScreenshots,
} from '../db.js';

const CAPTURE_REPORTS_KEY = 'captureReports';
const CAPTURE_REPORTS_LIMIT = 30;

export async function saveScreenshotRecord(record) {
  return saveScreenshot(record);
}

export async function getScreenshotById(id) {
  return getScreenshot(id);
}

export async function listScreenshotRecords() {
  return listScreenshots();
}

export async function listScreenshotMetaRecords() {
  return listScreenshotMeta();
}

export async function deleteScreenshotRecords(ids) {
  return deleteScreenshots(ids);
}

export async function loadCaptureReports() {
  const state = await chrome.storage.local.get({ [CAPTURE_REPORTS_KEY]: [] });
  return Array.isArray(state[CAPTURE_REPORTS_KEY]) ? state[CAPTURE_REPORTS_KEY] : [];
}

export async function prependCaptureReport(report) {
  const current = await loadCaptureReports();
  const next = [report, ...current].slice(0, CAPTURE_REPORTS_LIMIT);
  await chrome.storage.local.set({ [CAPTURE_REPORTS_KEY]: next });
  return next;
}
