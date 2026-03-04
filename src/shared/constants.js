export const DB_NAME = 'screen-collector';
export const DB_VERSION = 4;         // bumped: repair metadata store migration path
export const STORE_NAME = 'screenshots';
export const META_STORE = 'screenshot_meta';
export const TILES_STORE = 'pending_tiles'; // temporary tile buffer during capture

// Conservative per-image canvas side limit.
// Oversized captures are split into multiple stitched images.
export const MAX_CANVAS_SIDE = 16000;

// Milliseconds to wait after scrolling before capturing
export const SCROLL_SETTLE_MS = 200;

// Throttle + retry to stay under chrome.tabs.captureVisibleTab quota
export const CAPTURE_MIN_INTERVAL_MS = 550;
export const CAPTURE_RETRY_MAX_ATTEMPTS = 5;
export const CAPTURE_RETRY_BASE_DELAY_MS = 400;
