# THE Collector v1.3.18

## Highlights
- Added **History diagnostics improvements** (including dismiss control for latest failure banner).
- Added **History Search + Filters** (domain, date range, export type) with reset and filtered counts.
- Added **Preview Export Presets** (`Email`, `Docs`, `PDF Auto`) using existing export logic.
- Improved **popup capture error UX** with user-friendly guidance and toast delivery.
- Consolidated UI into a shared **Design Token system** across popup/history/options/preview.

## Included improvements

### Reliability + diagnostics
- Capture attempt metadata stored for troubleshooting (duration, tiles, retries/backoffs, fallback/error summary).
- History cards show concise “why slow/fallback” hints.
- Latest failed capture note shown in History with dismiss (`×`) support.

### History UX
- Client-side filter bar:
  - Domain
  - From/To date
  - Export type (`PNG`, `JPG`, `PDF`)
- Filter reset and `x of y screenshots` count.
- Clear-all behavior preserved for full dataset (not only filtered view).

### Preview UX
- One-click preset actions:
  - `Email`: JPG export + opens mail draft
  - `Docs`: copy image with Docs-safe sizing
  - `PDF Auto`: export PDF using Auto page size

### Permissions UX
- Options page now includes plain-language “why we need this permission” explanations.
- Real-time status badges for required and optional permissions.
- User-friendly permission status labels.

### Popup UX
- Capture errors translated to plain guidance for restricted pages (`chrome://`, `chrome-extension://`, etc.).
- Capture errors now appear as toasts (matching URL collector behavior).

### Design system consolidation
- Expanded shared token palette in `src/shared/ui.css`.
- Migrated module styles to shared tokens for color/typography/radius consistency.
- No business logic changes in tokenization step.

## Stability
- Core capture/export and URL collection logic preserved.
- Local checks passed:
  - `node tests/url-utils.test.mjs`
