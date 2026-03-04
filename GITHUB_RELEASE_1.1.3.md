# THE Collector v1.1.3

THE Collector now combines screenshot capture and URL collection in one extension.

## Highlights
- Merged `screen-collector` and `url-collector` into a single codebase.
- New unified popup with two tabs:
  - `Capture` for full-page screenshots
  - `URLs` for cleaned URL collection and export
- Preserved full screenshot pipeline:
  - service worker orchestration
  - content capture agent
  - offscreen stitching
  - preview, history, and options flows
- Added URL collection features:
  - add current tab / add all tabs
  - tracking-parameter cleanup
  - dedupe, open, remove, clear
  - copy, TXT, CSV, and email export
- Added shared URL utilities and test coverage:
  - `src/shared/url-utils.js`
  - `tests/url-utils.test.mjs`

## Compatibility
- Existing screenshot data remains compatible.
- Data remains local-only (no cloud sync or backend upload path introduced).
