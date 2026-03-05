# Architecture

THE Collector is a Manifest V3 browser extension that combines two user-facing workflows in one popup:

- Full-page screenshot capture, review, and export.
- URL collection, cleanup, and export/history actions.

## Runtime Components

- `src/background/service-worker.js`: extension runtime adapter and message/command entrypoint.
- `src/background/capture-service.js`: capture orchestration logic (state checks, retries, progress, stitching handoff).
- `src/content/capture-agent.js`: page-side metrics, scroll orchestration, and capture target handling.
- `src/offscreen/offscreen.js`: tile stitching/composition and final image persistence.
- `src/popup/*`: primary user UI for capture and URL collection.
- `src/preview/*`: screenshot review/edit/export (including visual diff).
- `src/history/*`: capture browsing, filtering, compare mode selection, and file actions.
- `src/options/*`: user settings and permission management.

## Shared Layer

- `src/shared/messages.js`: message protocol IDs used across extension contexts.
- `src/shared/constants.js`: capture/export limits and shared constants.
- `src/shared/db.js`: IndexedDB access primitives.
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
- Service worker delegates to capture service.
- Capture service coordinates content script scrolling and `captureVisibleTab` snapshots.
- Tiles are stitched in offscreen document, then persisted.
- Popup receives progress/done/error messages and opens preview/history as needed.

2. URL flow

- Popup URL panel loads URL list and history snapshots via repositories/models.
- User actions mutate list state (add/remove/clear/restore/export/copy).
- Mutations persist to extension storage and optionally append history snapshots.

3. Review/export flow

- History/preview read persisted screenshot records.
- Preview applies non-destructive visual operations and exports PNG/JPG/PDF or clipboard output.

## Architectural Style

- Monolithic extension codebase with context-specific modules.
- Orchestrator modules in each context wire focused helpers.
- Repository abstraction centralizes storage access and lowers coupling to raw storage APIs.
