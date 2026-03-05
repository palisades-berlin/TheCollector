# THE Collector

Manifest V3 browser extension for Chrome and Edge that combines full-page screenshot capture with URL collection in one popup.

Current extension version: `1.3.60`.

## Overview

THE Collector includes two modes:

- Capture: full-page screenshots with local history, editing, and export
- URLs: collect clean tab URLs (tracking params removed), copy/export/email, and manage a saved list
- UX is consolidated across both flows (shared toasts and unified design tokens)

All data remains in extension-local storage; there is no backend upload pipeline.

## Core Architecture

The capture pipeline is split across extension contexts:

- `service worker`: capture orchestration, retries/throttling, progress/result events
- `content script`: page metrics, target detection, scrolling, temporary fixed/sticky suppression
- `offscreen document`: tile stitching and final image persistence
- `preview page`: review, editing, and export
- `history page`: stored capture browsing and deletion
- `options page`: export defaults, auto-download behavior, optional permissions

## Features

### Capture

- One-click toolbar capture
- Keyboard shortcut: `Alt+Shift+P`
- Tile-by-tile full-page capture via `chrome.tabs.captureVisibleTab`
- Fixed/sticky element suppression during capture pass
- Capture target detection/locking:
  - page scrolling
  - dominant same-origin iframe mode
  - dominant inner scroll-container mode
- Target mismatch/liveness checks across capture phases
- Per-tab capture mutex to prevent conflicting concurrent runs
- Quota-aware capture throttling and retry/backoff
- Progress/result surfaced in popup UI
- Capture reliability telemetry (duration, tiles, retries, fallback/error summary) for troubleshooting
- User-friendly popup error messages for restricted pages (e.g. `chrome://` and extension pages)
- Capture errors in popup are shown as toasts (same UX pattern as URL collector actions)

### URL Collection

- Add current tab URL
- Add all URLs from current window
- Automatic tracking-parameter cleanup (UTM, gclid, fbclid, and similar)
- URL deduplication (normalized compare)
- Open/remove individual URLs
- Copy all URLs to clipboard
- Export as TXT or CSV
- Send URL list via email draft
- Clear list with confirmation
- Restore last cleared URL list (single-step undo snapshot)
- URL Collection History with snapshot restore/copy/TXT/CSV actions

### Preview & Editing

- Click-to-zoom preview
- Visual Diff mode (History compare 2 screenshots) with translucent change boxes:
  - green = added/brighter
  - red = removed/darker
- Editing tools:
  - Crop
  - Blur
  - Highlight
  - Text
  - Rectangle shape
  - Emoji markers
- Optional URL + timestamp stamp
- URL in preview sanitized to clickable `http/https` only
- Clipboard copy with optional Docs-limit resize behavior
- One-click export presets:
  - `Email` (JPG export + opens draft)
  - `Docs` (copy with Docs-safe sizing)
  - `PDF Auto` (PDF export using `Auto` page size preset)

### Export

- PNG
- JPG
- PDF (`Auto`, `A4`, `Letter`)
- Smart PDF page splitting for `A4`/`Letter` (heuristic break selection)
- In split overview mode, export/edit actions are intentionally disabled

### History & Storage

- Local persistence in IndexedDB
- Open, single delete, and clear-all flows
- Client-side History filters:
  - domain text filter
  - date range filter (from/to)
  - export type filter (`PNG`, `JPG`, `PDF`)
- History diagnostics:
  - Per-capture “why slow” hints (slow duration, retries/backoffs, oversized auto-scale fallback)
  - Latest capture failure note (if the most recent run failed)
  - Dismiss control (`×`) for the latest failure note
- No cloud sync or server upload path in current implementation

### Settings

- Default export format
- Default PDF page size
- Auto-download behavior
- Download directory
- Optional `downloads` permission grant/revoke
- Save-As behavior for downloads
- Permission clarity panel with inline “why this permission” rationale
- Real-time permission status badges in Options

## Oversized Capture Behavior

When a capture exceeds safe canvas limits, THE Collector uses oversized fallback handling and split-aware preview behavior for stable rendering and review of large pages.

## Install (Unpacked)

1. Open `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this repository folder.
4. Pin the extension if needed.

## Basic Usage

1. Open the extension popup.
2. Use the `Capture` tab for screenshots (`Alt+Shift+P` also works).
3. Use the `URLs` tab to collect, clean, and export links.
4. Use History/Options for screenshot management and defaults.

## Local checks

```bash
node tests/url-utils.test.mjs
node tests/url-history.test.mjs
node tests/filename.test.mjs
node tests/ui-state-validation.test.mjs
node tests/settings.test.mjs
node tests/history-utils.test.mjs
node tests/protocol-validate.test.mjs
node tests/history-filters.test.mjs
node tests/url-repo.test.mjs
```

## Developer checks

Optional local tooling for lint/format/check aggregation:

```bash
npm install
npm run lint
npm run test:unit
npx playwright install chromium
npm run test:e2e:smoke
npm run format:check
npm run check
```

## Release Packaging

Create a release zip that excludes local/development artifacts such as `node_modules`, tests, and git metadata:

```bash
./scripts/package-release.sh
```

For store submission, use the zip uploaded by CI (`the-collector-release-zip`) as the source-of-truth artifact, not a local machine zip.

Release notes policy: keep notes in `CHANGELOG.md` only; do not add `GITHUB_RELEASE_*.md` files.

## Security & Privacy

- Captures remain in extension-local storage unless downloaded by the user.
- Deleting from History removes stored records from IndexedDB.
- Uninstalling the extension clears extension storage per browser behavior.
- No backend upload path exists in this codebase.

## Permission Scope (Phase A)

Phase A focuses on dead-permission cleanup only. Current audit result: no removable runtime permission without behavior risk.

- Required: `activeTab`
  - Needed for temporary host access on the user-invoked tab during capture/injection flows.
- Required: `tabs`
  - Needed for active/current-window queries, opening history/preview tabs, and capture-tab operations.
- Required: `scripting`
  - Needed to inject/execute capture logic in the target tab.
- Required: `storage`
  - Needed for URL list persistence (`local`) and settings (`sync`).
- Required: `offscreen`
  - Needed for offscreen stitching/composition document lifecycle.
- Required: `unlimitedStorage`
  - Retained for screenshot history reliability on larger capture datasets.
- Optional: `downloads`
  - Requested/revoked by user in Options; used only for explicit export/download flows.

Next refinement phases should focus on architectural reductions (not blind permission removal), especially around large-capture storage strategy.

## Current Constraints

- Cross-origin iframe capture is incomplete.
- Highly custom JavaScript scroll behavior is best-effort.
- Browser storage limits still apply.
- Capture scope depends on active-tab permissions and browser site access.
- Browser PDF documents are not captured by this pipeline.

## Repository Layout

```text
THE Collector/
├── manifest.json
├── assets/icons/
├── docs/
└── src/
   ├── background/      # service worker
   ├── content/         # injected capture agent
   ├── offscreen/       # stitching document
   ├── popup/           # action popup
   ├── preview/         # review/edit/export
   ├── history/         # saved captures UI
   ├── options/         # extension settings
   └── shared/          # constants/messages/db/settings
```

## Internal Docs

- [Architecture](./docs/architecture.md)
- [Developer Workflow](./docs/dev-workflow.md)

## Near-Term Roadmap

1. Unified merge/synthesis flow for oversized split captures
2. Deeper nested iframe + nested scroll-container traversal
3. Further permission-scope refinement where feasible
