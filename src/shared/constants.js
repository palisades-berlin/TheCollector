export const DB_NAME = 'screen-collector';
export const DB_VERSION = 2;         // bumped: added pending_tiles store
export const STORE_NAME = 'screenshots';
export const TILES_STORE = 'pending_tiles'; // temporary tile buffer during capture

// Conservative canvas size limit (Chrome max is ~32k but we stay safe)
export const MAX_CANVAS_SIDE = 16000;

// Milliseconds to wait after scrolling before capturing
export const SCROLL_SETTLE_MS = 200;
