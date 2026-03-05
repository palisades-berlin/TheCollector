# Changelog

## 1.3.22 - 2026-03-05
- Improved History rendering performance without behavior changes:
  - switched main screenshot grid rendering to `DocumentFragment` batching
  - switched files overlay row rendering to `DocumentFragment` batching

## 1.3.21 - 2026-03-05
- Refactored duplicated filename and download logic into shared helpers:
  - added `buildDownloadFilename` in `src/shared/filename.js`
  - added shared download helpers in `src/shared/download.js`
  - migrated service worker, history, and preview to shared helpers
- Replaced duplicated History split/stitch hint formatting with one helper.
- Added non-fatal debug logging wrappers for previously swallowed catches in service worker, history, and options.
- Added unit coverage for `buildDownloadFilename`.

## 1.3.20 - 2026-03-05
- Removed unused symbols without changing behavior:
  - removed unused `PT_GET` message constant
  - removed unused `editbarEl` and `zoomHintEl` references in Preview
  - removed unused `deleteScreenshot` helper export from shared DB module

## 1.3.19 - 2026-03-04
- Implemented low-risk code review fixes without changing business behavior:
  - fixed popup restore-button state refresh when list becomes empty
  - added debounce to History domain filtering to reduce re-render churn
  - hardened preview image setup with explicit load-error handling and object URL cleanup
  - added CAPTURE_START tab-id validation in service worker message handling
- Extracted duplicate filename/path sanitizers to shared helper module.
- Added focused unit tests for shared helpers and state/validation utilities.

## 1.3.18 - 2026-03-04
- Consolidated popup/history/options/preview styling into a shared Design Token system.
- Expanded `src/shared/ui.css` token palette (colors, radius, typography, shadows, motion).
- Replaced hardcoded module CSS color/radius literals with token references across all UI stylesheets.
- Preserved existing business logic and runtime behavior (style-only refactor).

## 1.3.17 - 2026-03-04
- Consolidated UX/UI layer between URL and SCREEN flows without changing business logic.
- Migrated popup to shared toast component (`src/shared/toast.js`) used by other modules.
- Added shared typography tokens (`--sc-font-sans`, `--sc-font-mono`) and applied them across popup/history/options/preview.
- Removed popup-only toast markup/styles to standardize notification behavior.

## 1.3.16 - 2026-03-04
- Changed popup capture error UX to toast notifications (matching URL collector module behavior).
- Friendly capture errors (e.g. restricted `chrome://` pages) now surface via toast instead of inline error block.

## 1.3.15 - 2026-03-04
- Added dismiss (`×`) control for the History “Last capture failed…” diagnostics banner.
- Dismissed banner stays hidden for the same failure message during the current session.
- Kept capture telemetry and filtering logic unchanged.

## 1.3.14 - 2026-03-04
- Improved popup capture error messages with user-friendly wording.
- Added clear guidance for restricted contexts:
  - `chrome://` / `edge://` internal pages
  - `chrome-extension://` pages
  - other browser-restricted hosts
- Replaced raw technical error output in popup with plain-action guidance.

## 1.3.13 - 2026-03-04
- Added one-click export presets in Preview toolbar using existing export logic:
  - `Email`: exports JPG and opens an email draft
  - `Docs`: copies image with Docs-safe sizing
  - `PDF Auto`: exports PDF with `Auto` page size
- Added preset button styling and guarded preset execution to avoid parallel actions.
- Kept core export pipeline unchanged (preset wrappers only).

## 1.3.12 - 2026-03-04
- Added client-side History Search + Filters with no backend/schema risk:
  - domain filter
  - date range filter (from/to)
  - export type filter (PNG/JPG/PDF)
- Added reset action for filters and filtered-count display (`x of y screenshots`).
- Preserved clear-all semantics to operate on the full history set, not just filtered results.
- Stored `blobType` in screenshot meta records to support lightweight export-type filtering.

## 1.3.11 - 2026-03-04
- Made Options permission-state language more user friendly and less technical.
- Reworded permission titles/descriptions to explain user benefit in plain terms.
- Updated status badge text to clearer labels (`Available`, `Check browser`, `Optional: On/Off`).

## 1.3.10 - 2026-03-04
- Implemented Permission Scope Phase B in Options (clarity-focused, no permission scope changes).
- Added inline “why we need this permission” copy for required and optional permissions.
- Added real-time permission status badges (required + optional) with periodic/focus refresh.
- Kept manifest permission set unchanged for stability.

## 1.3.9 - 2026-03-04
- Added capture reliability telemetry persistence for each capture attempt:
  - duration, tile counts, retry/backoff counts, capture mode, fallback used, and error summary.
- Saved reliability metadata into screenshot meta records for History card diagnostics.
- Added History diagnostics UI:
  - per-card “why slow” hints
  - top-line “last capture failed” note with concise reason and context.
- Kept capture/export business logic unchanged; this is observability-only UX.

## 1.3.8 - 2026-03-04
- Added URL list session restore in popup: `Restore Last Clear` (single-step undo snapshot).
- Clear-all now stores the previous URL list as an undo snapshot before clearing.
- Restore action is enabled only when the list is empty to avoid accidental overwrite.
- Added disabled-state styling for footer actions to keep UX clear and stable.

## 1.3.7 - 2026-03-04
- Implemented Permission Scope Phase A as a dead-permission audit with no risky removals.
- Documented required vs optional permission rationale in README for review/release traceability.
- Kept runtime permission set unchanged to preserve all capture, storage, and export flows.

## 1.3.6 - 2026-03-04
- Updated preview editor canvas typography to match the project UI type stack.
- Improved annotation text consistency for text tool, blur label, stamp overlay, and exported edits.

## 1.3.5 - 2026-03-04
- Added subtle, elegant micro-animations across popup, options, history, and preview styles.
- Enhanced hover/press/focus motion feedback using CSS-only transitions and spring-style easing.
- Kept all business logic and feature flows unchanged.
- Preserved reduced-motion accessibility safeguards.

## 1.3.4 - 2026-03-04
- Renamed project branding from `Collector` to `THE Collector` across UI, manifest metadata, and documentation.

## 1.3.3 - 2026-03-04
- Removed the Liquid Glass redesign layer entirely.
- Restored popup/history/options/preview UI and behavior to the last stable pre-liquid state.
- Removed shared liquid interaction engine (`src/shared/liquid.js`) and related wiring.
- Cleaned temporary release-note artifact from workspace.

## 1.1.4 - 2026-03-04
- Hardened popup message handling against missing payloads to prevent runtime UI errors.
- Cached frequently used popup DOM references to reduce repeated lookups.
- Added release packaging script `scripts/package-release.sh`.
- Added README release packaging instructions.

## 1.1.3 - 2026-03-04
- Merged `screen-collector` and `url-collector` into one extension: `THE Collector`.
- Replaced popup with a two-tab interface: `Capture` and `URLs`.
- Kept full screenshot capture flow (service worker, offscreen stitching, preview, history, options).
- Added URL collection flow in popup:
  - add current tab URL
  - add all tab URLs in current window
  - tracking parameter cleanup
  - dedupe, open, remove, clear
  - copy, TXT export, CSV export, email draft
- Added shared URL utility module at `src/shared/url-utils.js`.
- Added URL utility tests at `tests/url-utils.test.mjs`.
- Unified product naming in UI/docs to `THE Collector`.
- Updated maintainer docs and README for merged functionality.

## 1.0.33 and earlier
- Legacy SCREEN Collector versions before URL collector merge.
