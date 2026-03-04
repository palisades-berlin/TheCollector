# Changelog

## 1.1.3 - 2026-03-04
- Merged `screen-collector` and `url-collector` into one extension: `Collector`.
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
- Unified product naming in UI/docs to `Collector`.
- Updated maintainer docs and README for merged functionality.

## 1.0.33 and earlier
- Legacy SCREEN Collector versions before URL collector merge.
