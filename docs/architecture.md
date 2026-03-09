# Architecture

THE Collector is a Manifest V3 browser extension that combines two user-facing workflows in one popup:

- Full-page screenshot capture, review, and export.
- URL collection, cleanup, and export/history actions.

## Runtime Components

- `src/background/service-worker.js`: thin extension runtime adapter and event bootstrap.
- `src/background/capture-service.js`: capture orchestration logic (state checks, retries, progress, stitching handoff).
- `src/background/message-router.js`: runtime message routing for capture, queue, and preview download requests.
- `src/background/url-actions.js`: context menu, omnibox, and URL collection handlers.
- `src/background/queue-state.js`: queue storage/session lifecycle helpers used by service worker handlers.
- `src/content/capture-agent.js`: page-side metrics, scroll orchestration, and capture target handling.
- `src/offscreen/offscreen.js`: tile stitching/composition, oversized merged-preview synthesis, and final image persistence.
- `src/popup/*`: primary user UI for capture and URL collection.
- `src/preview/*`: screenshot review/edit/export (including visual diff).
- `src/history/*`: capture browsing, filtering, compare mode selection, and file actions.
- `src/options/*`: user settings and permission management.

## Shared Layer

- `src/shared/messages.js`: message protocol IDs used across extension contexts.
- `src/shared/constants.js`: capture/export limits and shared constants.
- `src/shared/non-fatal.js`: shared debug-gated non-fatal logging helper for extension contexts.
- `src/shared/db.js`: IndexedDB access primitives.
- `src/shared/capture-profiles.js`: fixed Smart Save Profiles catalog and capture override resolver.
- `src/popup/popup-profile-payload.js`: canonical popup payload builders for Smart Save capture and queue actions.
- `src/shared/nudges.js`: local Smart Revisit Nudge evaluator logic.
- `src/shared/value-report.js`: local Weekly Value Report metric builder.
- `src/popup/capture-queue.js`: queue entry helpers used by popup UI for Capture Queue + Batch Mode v1.
- `src/shared/repos/*.js`: persistence access wrappers for screenshots, tiles, URLs, and settings.
- `src/shared/*` utilities: filename, download, validation, UI helpers, and URL/history model logic.
- `src/shared/ui.css`: global design tokens (`--sc-*`) and shared UI primitives (`sc-*` component classes).

## Design System Contract

- Figma file `THECollector - UI Kit & Screens` is the single source of truth for UX/UI and components.
- Code mirrors Figma through:
  - global tokens in `src/shared/ui.css`
  - surface semantic tokens in `src/popup/popup.css` (`--popup-*`) and `src/history/history.css` (`--history-*`)
  - shared primitive classes (`sc-btn`, `sc-input`, `sc-select`, `sc-card`, `sc-tab*`, `sc-pill*`, `sc-banner*`, `sc-modal`).
- Detailed handoff rules and mapping: `docs/ui-handoff.md`.

## Primary Data Flows

1. Capture flow

- Popup sends `CAPTURE_START` to service worker.
- Optional `profileId` is accepted for Pro/Ultra Smart Save Profiles (`Research`, `Interest`, `Private`).
- Pro/Ultra queue mode can enqueue current/window tabs from popup while queue execution/state lifecycle is orchestrated in service worker.
- Service worker delegates to capture service.
- Capture service coordinates content script scrolling and `captureVisibleTab` snapshots.
- Tiles are stitched in offscreen document; oversized pages are synthesized into one merged previewable record with original dimensions preserved in metadata, then persisted.
- Capture metadata persists selected profile ID for History filtering.
- Service worker emits queue completion (`SW_QUEUE_DONE`) and opens History with queue summary on batch completion.
- Popup receives progress/done/error messages and queue completion status updates.

2. URL flow

- Popup URL panel loads URL list and history snapshots via repositories/models.
- User actions mutate list state (add/remove/clear/restore/export/copy).
- Mutations persist to extension storage and optionally append history snapshots.

3. Review/export flow

- History/preview read persisted screenshot records.
- Preview applies non-destructive visual operations and exports PNG/JPG/PDF or clipboard output.
- History supports profile-based filtering (Pro/Ultra) using persisted capture profile metadata.
- History and Settings expose read-only Smart Save profile usage summaries (Pro/Ultra), including unknown/legacy profile ID counts for migration-safe visibility.
- History supports tier-gated Bulk Actions v1 (Pro/Ultra) via multi-select overlay for batch download/delete.
- Settings supports tier-gated Weekly Value Report v1 (Pro/Ultra) with local-only metrics.

## Architectural Style

- Context-specific bootstraps stay thin and delegate to focused helpers.
- Popup and Settings now follow their visible panel/section boundaries in code structure.
- Repository abstraction centralizes storage access and lowers coupling to raw storage APIs.
- UI parity is validated by Playwright visual regression tests (`npm run test:e2e:visual`); calibrated targets use `maxDiffPixels <= 2` with any temporary per-snapshot exceptions defined in `tests/visual/ui-parity.spec.mjs`.

## Architecture Decisions

Accepted ADRs are tracked in `docs/adr/`:

- `0001`: Basic/Pro/Ultra tier-gating model
- `0002`: local-only + no-tracking guardrails
- `0003`: enterprise CI gates as release blockers
- `0004`: Smart Save Profiles v1 (fixed presets, capture-only override)
- `0005`: Smart Revisit Nudges v1 (local evaluator, Pro-gated)
- `0006`: Bulk Actions v1 (History overlay, Pro-gated)
- `0007`: Weekly Value Report v1 (Settings summary card, Pro-gated)
- `0008`: Capture Queue + Batch Mode v1 (popup queue, Pro-gated)
