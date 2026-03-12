# THE Collector

Manifest V3 browser extension for Chrome and Edge that combines full-page screenshot capture with URL collection in one popup.

Current extension version: `1.9.58`.

## Overview

THE Collector includes two modes:

- Capture: full-page screenshots with local history, editing, and export
- URLs: collect clean tab URLs (tracking params removed), copy/export/email, and manage a saved list
- UX is consolidated across both flows (shared toasts and unified design tokens)

All data remains in extension-local storage; there is no backend upload pipeline.

Need help getting started? See the [End-User Help Guide](./docs/help-user-guide.md).

## Top Changes

- Added new full-tab **URL Library** page with URL Saved Views (`All`, `Starred`, `Today`, `By Domain`) and integrated Change Log view.
- Added URL tag editing directly in URL Library rows (suggestions + free-text + remove, max-10 enforcement).
- Added inline URL notes in URL Library rows (Pro/Ultra, max 140 characters).
- Updated full-tab header navigation to `Screenshots · URLs · Settings`.
- Fixed URL remove data integrity by deleting orphaned metadata records on removal.

## Core Architecture

The capture pipeline is split across extension contexts:

- `service worker`: capture orchestration, retries/throttling, progress/result events
- `content script`: page metrics, target detection, scrolling, temporary fixed/sticky suppression
- `offscreen document`: tile stitching and final image persistence
- `preview page`: review, editing, and export
- `history page`: stored capture browsing and deletion
- `Settings page`: export defaults, auto-download behavior, optional permissions

## Features

### Capture

- One-click toolbar capture
- Keyboard shortcut: `Alt+Shift+P`
- Smart Save Profiles (Pro/Ultra tier): fixed presets `Research`, `Interest`, `Private`
- Default Smart Save Profile can be set in Settings (Pro/Ultra tier)
- Read-only Smart Save usage summaries in History and Settings (Pro/Ultra tier)
- Capture Queue + Batch Mode v1 (Pro/Ultra tier):
  - queue current tab or current window tabs
  - run queued captures sequentially from popup
  - after completion, History opens automatically with queue result summary
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
- Popup quick URL actions: add/copy/export/email/clear/restore + recent list
- URL Library full-tab surface with Saved Views: `All`, `Starred`, `Today`, `By Domain`
- URL Change Log view available in URL Library
- URL Tags v1 (Pro/Ultra): stored per URL record (max 10 tags)
- URL Notes v1 (Pro/Ultra): inline per URL row (max 140 characters)
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
  - profile filter (`Research`, `Interest`, `Private`) for Pro/Ultra tier users
- History diagnostics:
  - Per-capture “why slow” hints (slow duration, retries/backoffs, oversized auto-scale fallback)
  - Latest capture failure note (if the most recent run failed)
  - Dismiss control (`×`) for the latest failure note
- Bulk Actions v1 (Pro/Ultra tier):
  - multi-select via `Bulk` overlay
  - bulk download and bulk delete
- No cloud sync or server upload path in current implementation

### Settings

- Default export format
- Default PDF page size
- Auto-download behavior
- Download directory
- Optional `downloads` permission grant/revoke
- Save-As behavior for downloads
- Permission clarity panel with inline “why this permission” rationale
- Real-time permission status badges in Settings
- Capability tier selector: `Basic`, `Pro`, `Ultra` (UX complexity preference — the extension is free forever; all tiers are free)
- Pro/Ultra tier controls:
  - Default Smart Save Profile (`Research`, `Interest`, `Private`)
  - Smart Revisit Nudges controls (`enabled`, cadence)
  - Weekly Value Report (local summary card in Settings)
- Settings IA:
  - Daily Essentials: tier, default profile, theme, save
  - Capture & Export: export format, PDF page size, clipboard fit
  - Downloads: auto-download mode, download directory, save-as
  - Feature Access: nudges + weekly value report
  - Privacy & Permissions: optional permissions and permission status
  - Advanced: onboarding and host-access guidance
  - Help & FAQ: end-user guidance and quick answers

## Oversized Capture Behavior

When a capture exceeds safe canvas limits, THE Collector uses oversized fallback handling and split-aware preview behavior for stable rendering and review of large pages.

## Install (Unpacked)

1. Open `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this repository folder.
4. Pin the extension if needed.

## Environment Variables

No runtime environment variables are required for the extension. See `.env.example` for policy.

## Basic Usage

1. Open the extension popup.
2. Use the `Capture` tab for screenshots (`Alt+Shift+P` also works).
3. Use the `URLs` tab to collect, clean, and export links.
4. Use History and Settings for screenshot management and defaults.

## Local checks

```bash
npm run lint
npm run test:repo-hygiene
npm run test:docs-policy
npm run test:unit
npm run test:coverage
npm run test:coverage:runtime
npm run test:coverage:preview-export
npm run test:integration
npm run test:security-policy
npm run test:stability
npm run test:performance
npx playwright install chromium
npm run test:e2e:smoke
npm run test:e2e:visual
npm run test:e2e:manual
npm run format:check
npm run check
```

## Developer checks

Canonical developer and release operations live in `docs/dev-workflow.md` to avoid drift:

- install/setup
- local quality checks
- visual parity gate (`npm run test:e2e:visual`)
- manual extension smoke (`npm run test:e2e:manual`)
- release packaging + artifact rules

## Release Packaging

Create a release zip that excludes local/development artifacts such as `node_modules`, tests, and git metadata:

```bash
./scripts/package-release.sh
```

For store submission, use the zip uploaded by CI (`the-collector-release-zip`) as the source-of-truth artifact, not a local machine zip.
`./scripts/package-release.sh` validates version alignment between `manifest.json`, top `CHANGELOG.md` entry, and exact `HEAD` tag (when present).
Before upload, run `npm run test:e2e:manual` once to smoke test capture + URL export + history + settings in a real extension context.
When creating/publishing a GitHub release asset with `./scripts/publish-release-with-asset.sh`, run it as `MANUAL_SMOKE_ATTEST=pass ./scripts/publish-release-with-asset.sh`.
Release notes must include the exact line `manual-smoke: pass`.

Release notes policy: keep notes in `CHANGELOG.md` only; do not add `GITHUB_RELEASE_*.md` files.

## Security & Privacy

- Captures remain in extension-local storage unless downloaded by the user.
- Deleting from History removes stored records from IndexedDB.
- Uninstalling the extension clears extension storage per browser behavior.
- No backend upload path exists in this codebase.

## Governance & Compliance

- Project license: [MIT](./LICENSE).
- Contribution and review policy: [CONTRIBUTING.md](./CONTRIBUTING.md).
- Code ownership is enforced via [CODEOWNERS](./.github/CODEOWNERS).
- `main` branch protection requires:
  - required status checks
  - admin enforcement.

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
  - Requested/revoked by user in Settings; used only for explicit export/download flows.

Next refinement phases should focus on architectural reductions (not blind permission removal), especially around large-capture storage strategy.

For Chrome Web Store submission copy text, see `docs/chrome-web-store-permissions.md`.

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
├── tools/            # local developer utilities
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
- [UI Handoff](./docs/ui-handoff.md)
- [Roadmap](./docs/thecollector-2.0-90-day-roadmap.md)
- [End-User Help Guide](./docs/help-user-guide.md)
- [Contributing Guide](./CONTRIBUTING.md)

## Near-Term Roadmap

Milestones in delivery order:

**v1.10 — Foundation & Distribution**

- Tier gating as UX complexity preference (no payment, free forever — see ADR 0009)
- Featured-Ready UX Polish Pack (Chrome Web Store featuring push)
- Weekly Value Report promoted to popup footer card
- Microcopy pass + WCAG 2.2 AA audit
- Edge Add-ons Store submission

**v2.0 — Design System 2.0 + URL Collector 2.0 + v2 Depth**

- Design System 2.0 tokens and 4 purpose-driven animations _(Sprint 1 prerequisite — ships before all features below)_
- Saved URL Views (Starred, Today, By Domain) and URL tags/notes/bulk actions
- Smart Save Profiles v2 (user-editable custom profiles)
- Bulk Actions v2 (tag + move)

**v2.1 — Intelligence Layer**

- Magic Mode v1 (rule-based domain → profile suggestion, no ML)
- Workflow Automations v1 (3–4 preset toggles, no rule builder)
- Quick Note at Save, Omnibox Actions (`tc research`, `tc star`)
- Admin Config Profile (importable JSON)

**v3.0 — Monitoring & Share**

- Capture Diff as Monitoring (scheduled re-capture + auto-diff + notification)
- Team Spaces Lite MVP (self-contained ZIP + viewer.html export)
- Firefox baseline (architecture spike first)

Full roadmap: `docs/thecollector-2.0-90-day-roadmap.md`
