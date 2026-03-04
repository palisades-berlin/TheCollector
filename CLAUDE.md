# SCREEN Collector — Maintainer Context

## Project Summary
`SCREEN Collector` is a Chrome/Edge extension (Manifest V3) for full-page screenshot capture.  
Implementation is plain JavaScript modules loaded directly by the browser extension runtime (no bundler).
Current extension version: `1.0.32`.

## Current Scope
- Full-page capture from popup and keyboard shortcut (`Alt+Shift+P`).
- Tile capture + offscreen stitching.
- Oversized capture split into multiple output images.
- Preview page with:
  - single-image mode: zoom, editing, export (PNG/JPG/PDF)
  - split overview mode: side-by-side part gallery with click/shift-click zoom
  - clipboard copy from preview (optional Docs-limit fit from settings)
- Smart PDF split for fixed paper sizes (`A4`, `Letter`).
- History page with open/delete/clear-all.
- Options page for export defaults, auto-download, and downloads permission controls.

Note: split overview mode is intentionally review-first; editing/export stays in single-image mode.

## Visual System
Maintain alignment with the existing extension style:
- Light base (`#f0f4f8`) and dark text (`#1a1a2e`).
- Blue gradient header/toolbar (`#1565c0` to `#0d47a1`).
- Primary action buttons in `#1976d2`.
- Rounded controls consistent across popup/preview/history/options.
- Font stack: `'Segoe UI', Roboto, Arial, sans-serif`.

## Runtime Topology
| Context | Path | Responsibility |
|---|---|---|
| Service Worker | `src/background/service-worker.js` | End-to-end capture orchestration, capture mutex, progress updates, offscreen lifecycle |
| Content Script | `src/content/capture-agent.js` | Page/iframe/element target detection, target lock, scroll commands, temporary fixed/sticky suppression |
| Offscreen Document | `src/offscreen/offscreen.js` | Stitching captured tiles, multi-part fallback, persistence |
| Popup | `src/popup/*` | Capture trigger, progress/error/done state, quick navigation |
| Preview | `src/preview/*` | Review/edit/export (single-image mode) + split overview gallery |
| History | `src/history/*` | Stored capture browsing and deletion |
| Options | `src/options/*` | Settings + optional permission management |

## Critical Shared Modules
- `src/shared/messages.js`: message constants across extension contexts.
- `src/shared/constants.js`: capture/stitch timing and limits.
- `src/shared/db.js`: IndexedDB access for screenshots and temporary tiles.
- `src/shared/settings.js`: persisted settings (default format/page size, auto-download).

## Capture Sequence
1. Popup or command event triggers `CAPTURE_START`.
2. Service worker injects `capture-agent.js` and requests metrics.
3. Content script returns capture mode and `targetId` (`page` / `iframe` / `element`).
4. Worker prepares capture with the same `targetId`; content script suppresses fixed/sticky elements.
5. Worker scrolls tile positions and captures viewport images.
6. Content script validates target liveness on each scroll step; mismatches fail fast.
7. Worker applies `captureVisibleTab` throttling and retry/backoff on quota errors.
8. Tile blobs are buffered in IndexedDB (`pending_tiles`).
9. Offscreen context stitches output:
   - single image when within limits
   - multi-part output when oversized
10. Worker opens preview tab (with split metadata when applicable).

## Storage Model
IndexedDB database: `SCREEN Collector` (v2)
- Store `screenshots`: final persisted captures.
- Store `pending_tiles`: temporary per-capture tile buffer.

Rationale: avoids large message payload limits by storing binary tiles in IDB rather than transferring all image data through runtime messages.

## Engineering Rules
- Keep content script self-contained (IIFE, no module imports).
- Keep all browser API calls in the correct context (`captureVisibleTab` in service worker only).
- Treat progress messages as broadcast events; do not rely on popup presence.
- Offscreen creation must be race-safe (single document limit).
- Keep capture target consistency (`targetId`) across metric/prepare/scroll message flow.
- Keep split overview and single-image preview behaviors explicitly separated.
- Preserve local-only behavior; do not add remote upload paths without explicit product decision.
- Versioning policy: keep extension version in patch cadence from `1.0.0` (`1.0.1`, `1.0.2`, ...), and bump on every code change.

## Manual Verification
1. Reload extension in `chrome://extensions`.
2. Capture a long page from popup.
3. Verify preview opens and full content is present.
4. Verify PNG/JPG/PDF export in single-image mode.
5. Verify edit tools are reflected in single-image exports.
6. Verify oversized capture yields split overview and split notice.
7. Verify split overview click zoom and `Shift+click` single-focus behavior.
8. Verify history operations.
9. Verify options save/apply and downloads permission grant/revoke.
10. Verify keyboard shortcut flow.

## Known Boundaries
- Cross-origin iframe capture remains incomplete.
- Non-standard scrolling layouts are best-effort.
- Effective “unlimited” capture count is still bounded by browser storage limits.
- Split overview mode currently does not support direct editing/export.
