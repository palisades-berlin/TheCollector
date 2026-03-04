# screen-collector Product Specification

Updated: 2026-03-04
Extension Version: `1.0.23`

## 1. Product Goal
`screen-collector` is a Manifest V3 browser extension for Chrome/Edge that captures full-page screenshots and keeps all capture data local to the user’s browser profile.

## 2. Runtime Model
The capture pipeline is distributed across extension contexts:
- Service worker: capture orchestration and progress broadcasting.
- Content script: page/target measurement, scrolling, and temporary fixed/sticky suppression.
- Offscreen document: tile stitching and final image persistence.
- Preview page: review plus either single-image edit/export or split overview rendering.
- History page: browsing and deletion of saved captures.
- Options page: export defaults, auto-download behavior, optional permissions.

## 3. Delivered Scope

### 3.1 Capture
- Toolbar-triggered full-page capture.
- Keyboard command `Alt+Shift+P`.
- Tile-by-tile viewport capture using `chrome.tabs.captureVisibleTab`.
- Fixed/sticky suppression during capture pass.
- Capture-target detection and lock:
  - default page scrolling
  - dominant same-origin iframe mode
  - dominant inner scroll-container mode
- Target id propagation (`metrics -> prepare -> scroll`) with mismatch/liveness checks.
- Per-tab capture mutex to prevent parallel capture conflicts.
- Quota-aware `captureVisibleTab` throttling + retry/backoff.
- Progress and result state surfaced in popup.

### 3.2 Oversized Capture Handling
- If page dimensions exceed the safe single-canvas side limit (`16000px`), the stitch step emits multiple image parts.
- First output part retains the original capture id for preview continuity.
- Split state is surfaced in popup and preview UI.
- Preview split overview mode renders all parts side-by-side.
- Split overview interaction:
  - click part to toggle zoom
  - `Shift+click` to zoom one part and collapse other zoomed parts
- History remains the persistence and management surface for individual split parts.

### 3.3 Review and Editing
- Preview zoom toggle.
- Export-time editing tools:
  - crop
  - blur
  - highlight
  - text labels
  - rectangular shapes
  - emoji markers
- Optional URL + timestamp stamp overlay.
- URL field in preview is sanitized for clickable navigation (`http/https` only).
- Clipboard copy action in preview with optional Docs-limit resize.

### 3.4 Export
- PNG export.
- JPG export.
- PDF export with page size modes: `Auto`, `A4`, `Letter`.
- Smart page splitting for `A4`/`Letter` PDF exports (heuristic row-based break selection).
- In split overview mode, export/edit actions are intentionally disabled.

### 3.5 Data Management
- Persistent local history in IndexedDB.
- Single-item delete and clear-all flows.
- No backend upload path in current codebase.

### 3.6 Settings
- Default export format.
- Default PDF page size.
- Auto-download on preview load.
- Optional `downloads` permission grant/revoke controls.

## 4. Known Constraints
- Cross-origin iframe content is not fully captured.
- Complex custom scroll containers are handled best-effort.
- Browser storage limits still apply even though there is no app-level screenshot count cap.
- Capture currently runs under active-tab scope and browser site-access constraints.
- Capture of browser PDF documents is not supported by this extension pipeline.

## 5. Security and Privacy
- Capture artifacts remain in extension-local storage unless explicitly downloaded by the user.
- Deleting entries from history removes stored records from IndexedDB.
- Uninstalling the extension clears extension storage per browser behavior.

## 6. Near-Term Roadmap
1. Merge/synthesize split parts for unified export/edit workflows after oversized fallback.
2. Deeper traversal for nested iframe + nested scroll-container combinations.
3. Permission model refinement to reduce install-time scope where feasible.
