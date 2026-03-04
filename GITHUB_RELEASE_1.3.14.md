# THE Collector v1.3.14

## Highlights
- Added **History Search + Filters** (domain, date range, export type) with reset and filtered count display.
- Added **Export Presets** in Preview for one-click workflows:
  - `Email`
  - `Docs`
  - `PDF Auto`
- Improved **popup capture errors** with user-friendly guidance for restricted pages.

## What changed

### History Search + Filters
- New filter controls in History:
  - Domain text filter
  - Date range (`From` / `To`)
  - Export type (`PNG`, `JPG`, `PDF`)
- Added `Reset Filters` action.
- Count now reflects filtered view (`x of y screenshots`).
- No backend changes; filtering is client-side on loaded metadata.

### Export Presets
- Added one-click preset buttons in Preview toolbar:
  - `Email`: exports JPG and opens an email draft
  - `Docs`: copies image with Docs-safe sizing
  - `PDF Auto`: exports PDF using `Auto` page size
- Built as wrappers around existing export/copy paths for low risk.

### Popup Error Clarity
- Replaced raw technical popup errors with plain-language guidance.
- Explicit friendly handling for:
  - `chrome://` / `edge://` pages
  - `chrome-extension://` pages
  - restricted-host permission errors

### Internal metadata support
- Persisted `blobType` in screenshot meta to support lightweight export-type filtering.

## Stability
- Core business logic for capture/export preserved.
- Local checks passed:
  - `node tests/url-utils.test.mjs`
