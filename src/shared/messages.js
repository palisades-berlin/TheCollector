// Message type constants shared across all extension contexts
export const MSG = {
  // Popup → Service Worker
  CAPTURE_START: 'CAPTURE_START',

  // Service Worker → Content Script
  CS_GET_METRICS: 'CS_GET_METRICS',
  CS_PREPARE: 'CS_PREPARE',
  CS_SCROLL_TO: 'CS_SCROLL_TO',
  CS_RESTORE: 'CS_RESTORE',

  // Service Worker → Offscreen Document
  OS_STITCH: 'OS_STITCH',

  // Service Worker → Popup (broadcast)
  SW_PROGRESS: 'SW_PROGRESS',
  SW_DONE: 'SW_DONE',
  SW_ERROR: 'SW_ERROR',

  // Preview Tab → Service Worker
  PT_GET: 'PT_GET',
};
