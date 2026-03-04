# Changelog

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
