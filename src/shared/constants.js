export const DB_NAME = 'screen-collector';
export const DB_VERSION = 6; // bumped: thumbnail fast-path store for history rendering
export const STORE_NAME = 'screenshots';
export const META_STORE = 'screenshot_meta';
export const THUMBS_STORE = 'screenshot_thumbs';
export const TILES_STORE = 'pending_tiles'; // temporary tile buffer during capture

// Screenshot retention / storage guardrails.
export const SCREENSHOT_ITEM_LIMIT = 500;
export const SCREENSHOT_STORAGE_WARN_THRESHOLD = 0.85;

// Conservative per-image canvas side limit.
// Oversized captures are split into multiple stitched images.
export const MAX_CANVAS_SIDE = 16000;

// Milliseconds to wait after scrolling before capturing
export const SCROLL_SETTLE_MS = 200;

// Throttle + retry to stay under chrome.tabs.captureVisibleTab quota
export const CAPTURE_MIN_INTERVAL_MS = 550;
export const CAPTURE_RETRY_MAX_ATTEMPTS = 5;
export const CAPTURE_RETRY_BASE_DELAY_MS = 400;

// Queue state storage keys shared between popup and service worker.
export const CAPTURE_QUEUE_STORAGE_KEY = 'popupCaptureQueueV1';
export const CAPTURE_QUEUE_SESSION_KEY = 'captureQueueSessionV1';
