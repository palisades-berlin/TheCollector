# Changelog

## 1.9.9 - 2026-03-06

- Added mandatory commit/push wiki-sync policy:
  - every requested commit/push cycle must include a same-session update to GitHub Wiki `Home.md` in `palisades-berlin/TheCollector.wiki`
  - defined required wiki sync payload (date, manifest version, top changes, and changed policy blocks)
  - documented source-consistency mapping and publish workflow in `docs/dev-workflow.md`.

## 1.9.8 - 2026-03-05

- Version bump release for current `main` state and synced version pointers.

## 1.9.7 - 2026-03-05

- Added a dedicated UX/UI calibration gate tied to the canonical Figma source of truth:
  - new script `scripts/check-ui-calibration-contract.mjs` verifies the canonical Figma URL/file key are aligned in:
    - `tests/visual/ui-parity.spec.mjs`
    - `docs/ui-handoff.md`
- Added `npm run test:ui-calibration`:
  - runs Figma contract check first
  - then runs visual parity snapshots.
- Updated CI visual parity job to run the new calibration gate:
  - `.github/workflows/ci.yml` now executes `npm run test:ui-calibration` for the visual stage.

## 1.9.5 - 2026-03-05

- Added local-only guardrails for roadmap-tier feature work:
  - new shared module `src/shared/roadmap-guardrails.js`
  - blocks external URLs for roadmap feature requests (`assertLocalOnlyUrl`, `roadmapFeatureFetch`)
  - enforces no-tracking payload policy (`assertNoTrackingPayload`, `enforceRoadmapActionPolicy`).
- Added unit coverage for guardrail behavior:
  - new `tests/roadmap-guardrails.test.mjs`
  - integrated in `npm run test:unit`.
- Reinforced roadmap contract in docs:
  - added explicit local-only guardrail requirement in `docs/thecollector-2.0-90-day-roadmap.md`.

## 1.9.4 - 2026-03-05

- Migrated capability gating to a single hierarchical tier model: `basic | pro | ultra`.
  - settings schema now uses `capabilityTier` as primary field
  - legacy `proEnabled` / `ultraEnabled` values are still read for migration, then normalized
  - persisted settings now store `capabilityTier` and no longer persist legacy tier booleans.
- Reworked shared capability helpers for hierarchical checks:
  - added/standardized `getCurrentTier`, `isTierAtLeast`, `canUseFeature`
  - `ultra` now implicitly includes `pro` and `basic` feature access.
- Updated options UI from dual toggles to single selector:
  - `Capability tier` select with `Basic`, `Pro`, `Ultra`.
- Expanded unit coverage:
  - settings migration and write-path cleanup assertions
  - capability tier hierarchy and legacy-shape compatibility assertions.
- Added explicit roadmap note that tier gating uses render-time exclusion (hide-only) rather than disabled UI.

## 1.9.3 - 2026-03-05

- Added centralized capability-gating layer for roadmap tiers:
  - new shared module `src/shared/capabilities.js`
  - canonical Pro (30-day) and Ultra (90-day) feature-key registry
  - helper APIs for deterministic gating checks (`getRequiredTier`, `isFeatureEnabled`, `getCapabilitySnapshot`, `listGatedFeatures`).
- Added unit coverage for capability gating and tier independence:
  - new test `tests/capabilities.test.mjs`
  - integrated into `npm run test:unit`.
- Kept existing runtime behavior unchanged; this step introduces the reusable gating foundation only.

## 1.9.2 - 2026-03-05

- Step 1 roadmap foundation: added `Pro` and `Ultra` feature-access toggles to Settings schema and Options UI.
  - schema additions in `src/shared/settings.js`: `proEnabled`, `ultraEnabled` (normalized boolean defaults: `false`)
  - options UI additions in `src/options/options.html` and `src/options/options.js`
  - unit test coverage expanded in `tests/settings.test.mjs` for normalization and persistence of both toggles.
- No capture/export/history business logic changes in this step.

## 1.9.1 - 2026-03-05

- Figma sync pass only (no UI behavior or business-logic changes):
  - synced canonical Figma URL and file key into handoff/audit workflow docs
  - documented active handoff authority node (`19:2`) and core UI-kit section node mapping
  - added explicit Figma mapping contract constants to visual parity suite (`tests/visual/ui-parity.spec.mjs`) to keep snapshots tied to the same design source.
- Updated developer workflow docs with direct Figma source reference for implementation parity.

## 1.9.0 - 2026-03-05

- Implemented premium UX remediation wave across extension surfaces and integration points while preserving core capture/export logic.
- Theme system foundations:
  - added `theme` setting (`system | light | dark`) in shared settings normalization
  - added shared theme runtime utility (`src/shared/theme.js`) and applied it across popup/history/options/preview
  - added dark theme token overrides in `src/shared/ui.css`.
- First-run and permission UX:
  - added onboarding surface (`src/onboarding/onboarding.html`, `src/onboarding/onboarding.css`, `src/onboarding/onboarding.js`)
  - install flow now opens onboarding on first install via service worker
  - added onboarding + permission rationale messaging on options page.
- Extension-native entry surface improvements:
  - added context menu integration (capture page, collect page URL, collect link URL)
  - added omnibox keyword routing (`tc`) for quick capture/collect actions
  - added manifest entries/permissions for `contextMenus` and `omnibox`.
- UX calibration updates:
  - improved popup footer action target sizing for constrained popup ergonomics
  - maintained preview grouped export bar improvements and responsive toolbar behavior.
- Visual QA expansion:
  - added visual baselines for onboarding and dark-theme shared matrix
  - updated impacted popup/options/preview snapshot baselines.

## 1.8.1 - 2026-03-05

- Preview header UX/UI calibration pass (PDF controls and export usability):
  - restructured preview toolbar into explicit groups (navigation, PDF options, primary exports, presets, zoom hint)
  - aligned PDF size select with Save PDF workflow for better context and scanability
  - added responsive wrap rules for grouped toolbar behavior at narrower widths
  - preserved all preview/export logic and button wiring (presentation-only changes).
- Expanded visual regression coverage with `preview-toolbar-wrap` snapshot.

## 1.8.0 - 2026-03-05

- Implemented a full multi-pass UX/UI QA calibration wave across shared primitives and all extension surfaces (popup, history, options, preview) while preserving runtime behavior.
- Shared design-system calibration in `src/shared/ui.css`:
  - introduced explicit control-size tokens (`--sc-ctl-sm`, `--sc-ctl-md`, `--sc-ctl-tab`) and icon-gap token (`--sc-icon-gap`)
  - standardized primitive sizing/padding for buttons, inputs/selects, and tabs
  - scoped hover/press motion to shared button primitives to reduce dense-layout baseline drift.
- Surface-level visual calibration:
  - `src/popup/popup.css`: tokenized segmented tab spacing, normalized compact action/button paddings, and disabled hover-lift in dense footer/tab regions
  - `src/history/history.css`: aligned header/filter/card/files-overlay spacing and action sizing to token rhythm, plus hover-lift opt-outs in dense toolbars/actions
  - `src/options/options.css`: normalized header/row/permission spacing rhythm and control alignment to shared metrics
  - `src/preview/preview.css`: normalized toolbar/editbar spacing and dense action behavior.
- Added formal audit artifact `docs/ui-qa-audit.md` and linked it from workflow docs.
- Expanded visual QA coverage:
  - added component-level snapshot test `shared primitives / calibration matrix` in `tests/visual/ui-parity.spec.mjs`
  - regenerated all affected parity baselines in `tests/visual/ui-parity.spec.mjs-snapshots/`.

## 1.7.1 - 2026-03-05

- Popup tab calibration (Figma segmented tabs):
  - replaced underline-style popup switcher with segmented `Capture` / `URLs` control
  - normalized tab height, typography, spacing, active/inactive hierarchy, and focus treatment
  - removed popup tab style collision between shared `.sc-tab` primitives and local `.tab-btn` rules by scoping popup tab overrides.
- Updated popup visual parity baselines:
  - `popup-capture-default-darwin.png`
  - `popup-urls-default-darwin.png`
  - `popup-error-state-darwin.png`
  - `popup-success-state-darwin.png`

## 1.7.0 - 2026-03-05

- Completed a full visual calibration pass across shared system + popup + history + options + preview:
  - normalized global spacing/control metrics in `src/shared/ui.css` (4px base scale, 32px small controls, 40px standard controls)
  - aligned popup layout rhythm, tab/control sizing, footer/action spacing, and dense-list row spacing
  - refined history grid/filter/header/action alignment and card/action sizing consistency
  - refined options shell/card/row rhythm and action/status alignment to shared control heights
  - aligned preview toolbar/editbar/control baselines and responsive spacing rhythm.
- Updated visual parity snapshots for calibrated surfaces in `tests/visual/ui-parity.spec.mjs-snapshots/`.

## 1.6.2 - 2026-03-05

- Options/Settings page calibration pass for layout and control parity:
  - refined page shell grid, spacing rhythm, and card padding hierarchy
  - standardized form control heights and row-label alignment
  - improved action/status alignment and permission item spacing behavior across breakpoints.
- Updated Options visual regression baselines in `tests/visual/ui-parity.spec.mjs-snapshots/`.

## 1.6.1 - 2026-03-05

- History page visual calibration pass for alignment/size parity:
  - normalized header and filter-bar vertical rhythm (control heights, spacing, grid alignment)
  - tuned card sizing/spacing and action-row alignment for closer Figma match
  - refined History responsive breakpoints and preserved existing behavior.
- Updated History visual regression baselines in `tests/visual/ui-parity.spec.mjs-snapshots/` for the calibrated layout.

## 1.6.0 - 2026-03-05

- Implemented full Figma-exact UI parity pass (light mode) across popup, history/sidebar, options, and preview.
- Design system and component ownership hardening:
  - normalized shared design primitives in `src/shared/ui.css` (typography tiers, radius scale, control sizing)
  - enforced `sc-*` shared primitives as baseline visual contract across surfaces
  - reduced local per-surface component restyling to layout/context exceptions only.
- Preview surface refactor:
  - migrated preview controls/states to shared classes in `src/preview/preview.html`
  - rebuilt `src/preview/preview.css` with `--preview-*` semantic tokens mapped to shared primitives
  - aligned preview canvas text rendering baseline to Poppins and added busy-state signaling.
- Visual parity gate added:
  - added Playwright visual regression config and tests:
    - `playwright.visual.config.mjs`
    - `tests/visual/ui-parity.spec.mjs`
    - baseline snapshots under `tests/visual/ui-parity.spec.mjs-snapshots/`
  - added npm script `test:e2e:visual`
  - wired CI to run visual parity checks (`maxDiffPixels <= 2`).
- Documentation hardening:
  - expanded `docs/ui-handoff.md` with a Figma mapping table (component/state -> class contract -> file mapping)
  - updated `docs/dev-workflow.md` and `docs/architecture.md` with mandatory visual parity gate requirements.

## 1.5.6 - 2026-03-05

- Completed handoff hardening pass (step 6) for design-system-driven implementation:
  - added `docs/ui-handoff.md` as the engineering contract for tokens, shared primitives, accessibility states, and screen mapping
  - documented Figma (`THECollector - UI Kit & Screens`) as the project UI single source of truth
  - updated architecture/workflow docs to codify token-first implementation and Dev Mode handoff expectations.
- Synced maintainer-facing docs and version pointers (`README.md`, `CLAUDE.md`) to current release version.

## 1.5.5 - 2026-03-05

- Completed UX/UI step 5 (states + accessibility pass) across popup, history, and options:
  - added shared state primitives in `src/shared/ui.css` (`sc-banner` variants and `sc-state-empty/loading`)
  - improved live-region semantics (`role`/`aria-live`/`aria-atomic`) for progress, success, error, empty, loading, and status messages
  - enabled keyboard discoverability for popup tab switching (arrow key navigation) and URL row action visibility on `:focus-within`
  - added busy-state signaling (`aria-busy`) for capture/history loading flows.
- Fixed popup inline error visibility regression in `src/popup/popup.js` (error text now displays instead of remaining hidden).

## 1.5.4 - 2026-03-05

- Executed shared component normalization pass (step 4) across popup, history sidebar, and options:
  - added reusable shared primitives in `src/shared/ui.css` for `sc-card`, `sc-input`, `sc-select`, `sc-btn` variants/sizes, `sc-tablist/sc-tab`, `sc-pill`, `sc-modal`, and `sc-kbd`
  - wired popup/history/options markup to consume shared classes while preserving existing behavior and IDs
  - aligned dynamic history card/files panel structure with shared card primitives for consistent Dev Mode handoff.
- Kept local screen-specific styling in place where needed, with shared tokenized components now serving as the default base layer.

## 1.5.3 - 2026-03-05

- Continued UX/UI refactor rollout with a token-first pass for the main workspace sidebar (`src/history/history.css`):
  - introduced a semantic `--history-*` token layer mapped to shared design tokens
  - migrated header, filters, grid/cards, empty/loading, diagnostics, and files overlay styles off direct hardcoded values
  - kept existing HTML/JS behavior unchanged while improving maintainability and handoff consistency.
- Updated shared system font token in `src/shared/ui.css` so UI surfaces inherit `Poppins` by default.

## 1.5.2 - 2026-03-05

- Started UX/UI refactor rollout from the approved Figma source-of-truth with a stepwise execution plan.
- Refactored popup styling into a clearer design-token layer:
  - added popup-semantic tokens in `src/popup/popup.css` mapped to shared tokens from `src/shared/ui.css`
  - replaced popup hardcoded values with semantic token references for spacing, colors, radius, timing, and layout
  - kept popup behavior and DOM structure unchanged while improving maintainability for upcoming component refactors.

## 1.5.1 - 2026-03-05

- Regenerated extension icon set in `assets/icons/` with a unified modern camera-mark style consistent with the approved 128x128 store icon.
- Updated runtime icon assets:
  - `icon16.png`
  - `icon32.png`
  - `icon48.png`
  - `icon128.png`
- Kept icon filenames/paths unchanged for manifest compatibility.

## 1.5.0 - 2026-03-05

- Release alignment and packaging hardening:
  - CI artifact is documented as the source of truth for store submission
  - packaging script validates manifest/changelog/tag version alignment
  - package zip composition is validated against forbidden non-runtime files
- CI release readiness improvements:
  - parallelized quality, e2e smoke, and package jobs
  - Playwright browser cache for faster e2e runs
  - packaged zip is uploaded as a CI artifact (`the-collector-release-zip`)
- QA and smoke coverage improvements:
  - lightweight Playwright smoke check for popup/history/options loading
  - real-extension manual smoke mode (`npm run test:e2e:manual`) for pre-upload verification of capture, URL export, history, and settings save
- Documentation consolidation:
  - `docs/dev-workflow.md` is the canonical developer/release operations reference
  - added canonical CWS permissions justification text in `docs/chrome-web-store-permissions.md`.

## 1.3.64 - 2026-03-05

- Consolidated release/maintainer documentation ownership to reduce drift:
  - `docs/dev-workflow.md` is now the canonical source for developer and release operations
  - `README.md` and `CLAUDE.md` now point to the canonical workflow doc instead of duplicating operational checklists
- Kept behavior and release policy content unchanged; this is documentation structure cleanup only.

## 1.3.63 - 2026-03-05

- Extended `scripts/e2e-smoke.mjs` with `--real-extension-manual` mode for pre-upload manual smoke in real extension context (no stubbed `chrome` API).
- Added `npm run test:e2e:manual` command to run the manual real-context smoke checklist:
  - capture in toolbar popup (manual action)
  - URL add/export smoke
  - history page open smoke
  - options save smoke
- Documented the manual smoke requirement in release workflow docs.

## 1.3.62 - 2026-03-05

- Hardened release-version alignment checks in `scripts/package-release.sh`:
  - fail if top `CHANGELOG.md` version differs from `manifest.json` version
  - fail on exact-tag builds when git tag version differs from manifest/changelog version
- Documented these release guardrails in workflow/readme docs.

## 1.3.61 - 2026-03-05

- Added canonical Chrome Web Store permission-justification text in `docs/chrome-web-store-permissions.md`.
- Explicitly covers `tabs`, `activeTab`, `offscreen`, `unlimitedStorage`, and optional `downloads` usage rationale.
- Linked release workflow docs to this canonical listing/policy text source.

## 1.3.60 - 2026-03-05

- Finalized release-process rule: Chrome Web Store submissions must use the CI-uploaded package artifact (`the-collector-release-zip`) as source of truth.
- Updated maintainer/user docs to clarify that locally generated zips are validation-only.
- Synced workflow documentation to current CI job model (quality + e2e smoke + package).

## 1.3.59 - 2026-03-05

- Refactored CI into parallel jobs for clearer failure surface and faster feedback:
  - `quality` job: `npm ci` + `npm run check`
  - `e2e_smoke` job: Playwright smoke test flow
  - `package` job depends on both and runs release packaging + artifact upload
- Added Playwright browser caching in the e2e job (`actions/cache@v4`) for `~/.cache/ms-playwright`.
- Updated CI browser install flow for fast-path behavior:
  - cache miss: `npx playwright install --with-deps chromium`
  - cache hit: `npx playwright install chromium` (lightweight validation/no-op path)

## 1.3.57 - 2026-03-05

- Added lightweight Playwright e2e smoke coverage:
  - new script: `scripts/e2e-smoke.mjs` (loads popup/history/options pages and fails on runtime errors)
  - new npm command: `npm run test:e2e:smoke`
- Updated CI workflow to run smoke e2e checks:
  - installs Chromium via `npx playwright install --with-deps chromium`
  - runs `npm run test:e2e:smoke` before packaging
- Updated maintainer/user docs (`README.md`, `CLAUDE.md`) with the new smoke-test command.

## 1.3.56 - 2026-03-05

- Added CI artifact publishing for packaged extension zip:
  - uploads `dist/the-collector-v*.zip` via `actions/upload-artifact@v4`
  - fails the workflow if the expected zip is missing
- Keeps push/PR runs producing a downloadable package output for quick verification.

## 1.3.55 - 2026-03-05

- Hardened release packaging script (`scripts/package-release.sh`):
  - added explicit excludes for non-runtime content (`docs/`, `tests/`, `*.md`, and local config files)
  - added post-zip validation to fail if forbidden non-runtime files are present in the archive
- Keeps release zip composition stricter and self-validating before publish.

## 1.3.54 - 2026-03-05

- Added CI packaging smoke coverage in `.github/workflows/ci.yml`:
  - runs `./scripts/package-release.sh` after quality checks
  - asserts the expected release zip exists in `dist/`
  - fails CI if zip contents include development artifacts (`tests/`, `node_modules/`, `.git/`)
- Keeps release validation aligned with local packaging workflow.

## 1.3.53 - 2026-03-05

- Updated CI workflow to run the full quality gate on push/PR:
  - install dependencies with `npm ci`
  - run unified checks with `npm run check` (lint + unit tests + format check)
- Replaced the previous CI-only unit-test command list with the shared project check command to keep local and CI validation aligned.

## 1.3.52 - 2026-03-05

- Cleared remaining ESLint blockers so `npm run lint` passes:
  - removed empty `catch` blocks in `src/content/capture-agent.js` with explicit best-effort comments
  - removed unused `getAllRecords` parameter from `src/history/history-files-overlay.js`
  - replaced control-character filename sanitizer regex in `src/shared/filename.js` with explicit character filtering to satisfy `no-control-regex`
- Applied repository-wide Prettier formatting so `npm run format:check` now passes consistently.
- `npm run check` now completes successfully (lint + unit tests + format check).

## 1.3.51 - 2026-03-05

- Added internal documentation for maintainers:
  - `docs/architecture.md` (runtime components, shared layer, and main data flows)
  - `docs/dev-workflow.md` (setup, checks, unpacked run, release packaging, versioning rules)
- Linked internal docs from `README.md` and reflected the `docs/` folder in repository layout.
- Standardized popup non-fatal error logging in `src/popup/popup.js` and `src/popup/urls-panel.js` to use consistent `[THE Collector][non-fatal]` diagnostics prefixes.

## 1.3.50 - 2026-03-05

- Extracted capture orchestration into `src/background/capture-service.js`.
- Simplified `src/background/service-worker.js` to adapter responsibilities (message and command handling + preview-download route).
- Kept capture behavior unchanged (retry/throttle, target protocol sync, stitching, telemetry, auto-download/preview flow).

## 1.3.49 - 2026-03-05

- Added repository abstraction modules under `src/shared/repos/`:
  - `screenshot-repo.js`
  - `tile-repo.js`
  - `url-repo.js`
  - `settings-repo.js`
- Migrated key consumers to repositories without changing behavior:
  - background capture + offscreen stitching paths
  - history page orchestration and files overlay settings access
  - popup URL state access and popup URL-count preload
  - options/settings and preview settings/screenshot reads
  - background download screenshot fetches
- Added focused unit tests for URL repository behavior in `tests/url-repo.test.mjs`.
- Expanded local/CI unit test runs to include URL repository tests.

## 1.3.48 - 2026-03-05

- Updated the Preview Visual Diff status message to a clearer, more user-friendly sentence while keeping the same meaning and UI behavior.

## 1.3.47 - 2026-03-05

- Refactored History page into focused modules while preserving behavior:
  - `src/history/history-filters.js`
  - `src/history/history-thumbs.js`
  - `src/history/history-cards.js`
  - `src/history/history-files-overlay.js`
- Converted `src/history/history.js` into an orchestration layer.
- Added focused unit tests for extracted filter logic in `tests/history-filters.test.mjs`.
- Expanded local/CI unit test runs to include history filter tests.

## 1.3.46 - 2026-03-05

- Improved History diagnostics banner wording to be more user-friendly and action-oriented.
- Added clearer guidance for common failure causes (restricted pages, concurrent capture, target changes, and rate limits).
- Kept diagnostics behavior and dismissal flow unchanged.

## 1.3.45 - 2026-03-05

- Refactored popup URL panel into focused modules while preserving behavior:
  - `src/popup/urls/urls-state.js`
  - `src/popup/urls/urls-history-view.js`
  - `src/popup/urls/urls-actions.js`
- Converted `src/popup/urls-panel.js` into an orchestration layer for state, history view, and event wiring.
- Kept URL add/remove/export/restore/history workflows functionally unchanged.

## 1.3.44 - 2026-03-05

- Refactored Preview into focused modules while preserving behavior:
  - `src/preview/preview-init.js`
  - `src/preview/preview-diff.js`
  - `src/preview/preview-annotations.js`
  - `src/preview/preview-export.js`
- Converted `src/preview/preview.js` into an orchestration layer that wires module responsibilities together.
- Kept existing capture preview, diff rendering, editing, copy/export, and preset flows functionally unchanged.

## 1.3.43 - 2026-03-05

- Added shared protocol payload validation in `src/shared/protocol-validate.js` for:
  - `CAPTURE_START`
  - `PT_DOWNLOAD`
  - `OS_STITCH`
  - `CS_SCROLL_TO`
- Integrated validation at runtime boundaries:
  - service worker message handling
  - offscreen stitch message handling
  - content-script scroll message handling
- Added focused unit tests in `tests/protocol-validate.test.mjs`.
- Expanded local/CI unit test execution to include protocol validation tests.

## 1.3.42 - 2026-03-05

- Added focused unit coverage for settings and history utilities:
  - `tests/settings.test.mjs`
  - `tests/history-utils.test.mjs`
- Expanded local/CI unit test execution to include the new test files.

## 1.3.41 - 2026-03-05

- Added GitHub Actions CI workflow (`.github/workflows/ci.yml`) for push/PR test runs.
- Added developer tooling scaffold:
  - `package.json` scripts (`test:unit`, `lint`, `format:check`, `check`)
  - ESLint and Prettier configuration files
  - `.editorconfig`
- Added README developer-checks guidance for local quality checks.

## 1.3.40 - 2026-03-05

- Updated Visual Diff rendering to use translucent bounding boxes around detected change regions.
- Box semantics:
  - green boxes = added/brighter regions
  - red boxes = removed/darker regions
- Added region grouping/merge pass to keep diff overlays readable on dense pages.
- Kept diff output derived-only and export/copy behavior unchanged.

## 1.3.39 - 2026-03-05

- Added Visual Diff Mode for screenshots:
  - History now supports selecting 2 screenshots and opening a compare view in Preview (`Compare (2/2)` flow).
  - Preview supports `mode=diff` (`id` + `compareId`) and renders a pixel-difference overlay:
    - green highlights added/brighter regions
    - red highlights removed/darker regions
    - unchanged regions are dimmed for focus.
- Diff output is derived-only (no changes to original screenshot records) and can be exported/copied with existing Preview export actions.
- Added History compare selection UI states (`Selected 1/2`) and compare button state handling.

## 1.3.38 - 2026-03-05

- Improved URL History performance and consistency in popup:
  - history is loaded lazily only when `History` is opened
  - added history pagination (`Load More`) for larger snapshot sets
  - reused shared copy/export helpers across current list and history actions
- Kept URL collection behavior and snapshot semantics unchanged.

## 1.3.37 - 2026-03-05

- Updated popup URL History item titles to show the snapshot URL instead of only URL count.
- Added truncation with ellipsis for long snapshot URLs in history list rows to keep popup layout stable.
- Kept snapshot actions and storage behavior unchanged.

## 1.3.36 - 2026-03-05

- Implemented the URL Collection History storage model as a shared data layer in `src/shared/url-history.js`.
- Standardized snapshot schema with explicit fields:
  - `id`, `createdAt`, `actionType`, `urls`, `count`, `meta`
- Added snapshot normalization/validation and bounded retention handling in one place.
- Updated popup URL history integration to use the shared model for load/save/append flows.
- Added focused tests for URL history model normalization and retention in `tests/url-history.test.mjs`.

## 1.3.35 - 2026-03-05

- Added URL Collection History in popup `URLs` tab:
  - new `History` view with timestamped snapshots of URL list states
  - snapshot actions: `Restore`, `Copy`, `TXT`, `CSV`
  - history management actions: `Back`, `Clear History`
- Persisted URL history snapshots in `chrome.storage.local` under `urlHistorySnapshots` with bounded retention.
- Added automatic snapshot capture on URL list mutations (add current tab, add all tabs, remove item), clear-all pre-state, and restore actions.
- Refactored URL export logic to reuse shared download helper (`anchorDownloadBlob`).

## 1.3.34 - 2026-03-05

- Fixed the Options `Choose Folder` action to use a real folder-picker flow (`showDirectoryPicker`) where supported, instead of always invoking upload-style folder selection.
- Kept existing fallback behavior via hidden `webkitdirectory` input for environments without `showDirectoryPicker`.
- Preserved download-directory path handling behavior (existing nested suffix retention remains unchanged).

## 1.3.33 - 2026-03-05

- Added popup performance debug instrumentation for startup/lazy-load timing:
  - logs in `src/popup/popup.js` for popup init, URL-count preload, and URLs panel lazy-load timing
  - logs in `src/popup/urls-panel.js` for URLs panel init and list render timing
- Debug logging can be enabled with `localStorage.sc_debug_popup_perf = '1'` (or `?debugPopupPerf=1` in popup URL).

## 1.3.32 - 2026-03-05

- Further reduced initial popup-open latency by splitting popup logic into lazy-loaded modules:
  - `src/popup/popup.js` now focuses on capture flow and lightweight tab shell
  - URL collector logic moved to `src/popup/urls-panel.js`, loaded only when `URLs` tab is opened
- Added lightweight URL-count preload for the badge without hydrating the full URL panel.
- Preserved existing URL/capture behavior and controls.

## 1.3.31 - 2026-03-05

- Fixed slow initial popup open by deferring expensive URL DOM hydration until the `URLs` tab is first shown.
- Kept URL count badge available at startup via lightweight URL state preload.
- Preserved popup stability by avoiding async lazy-init races in initial tab rendering.

## 1.3.30 - 2026-03-05

- Fixed popup regression introduced by lazy URL panel initialization.
- Restored eager URL state loading on popup init for stability.
- Kept low-risk popup performance improvements:
  - delegated URL list action handling
  - `DocumentFragment` batching for URL list rendering
- Added defensive delegated-click target handling to avoid edge-case event target errors.

## 1.3.29 - 2026-03-05

- Improved first-popup-open responsiveness without changing business logic:
  - deferred URL list load/render until the `URLs` tab is first opened
  - replaced per-row URL button listeners with delegated list click handling
  - batched URL row insertion with `DocumentFragment`
- Capture tab startup remains the default initial view.

## 1.3.28 - 2026-03-05

- Reworked capture-agent DOM scans with staged filters to reduce startup overhead on very large pages:
  - replaced broad `querySelectorAll('*')` scans with TreeWalker-based traversal
  - added cheap renderability/size/scrollability gates before expensive style checks
  - applied staged filtering in dominant scroll-container detection and fixed/sticky suppression scan
- No business logic changes; capture behavior remains functionally equivalent.

## 1.3.27 - 2026-03-05

- Added stitch-pass decode caching for oversized offscreen rendering:
  - `src/offscreen/offscreen.js` now reuses decoded source tiles across chunk renders in oversized mode
  - decoded tile resources are explicitly released after the stitch pass
- Added memoized edited-canvas pipeline for Preview export/copy:
  - `src/preview/preview.js` now caches edited canvases by edit revision + stamp state
  - cache invalidates on edit mutations and when a new screenshot loads
- No business logic changes; behavior and outputs are preserved.

## 1.3.26 - 2026-03-05

- Introduced a shared protocol constants strategy for content-script messaging to prevent string drift:
  - service worker now syncs protocol IDs from `MSG` into `window.__THE_COLLECTOR_PROTOCOL` before capture-agent execution
  - capture-agent now resolves message IDs from injected protocol with safe fallback constants
- No business logic changes; message semantics remain unchanged.

## 1.3.25 - 2026-03-05

- Decomposed large runtime modules into smaller files without changing business logic:
  - `src/background/service-worker.js` now uses:
    - `src/background/offscreen-manager.js`
    - `src/background/downloads.js`
  - `src/history/history.js` now uses:
    - `src/history/history-utils.js`
    - `src/history/history-downloads.js`
  - `src/preview/preview.js` now uses:
    - `src/preview/pdf-export.js`
- Kept existing behavior and message flow intact; this is structure/readability refactoring only.

## 1.3.24 - 2026-03-05

- Removed `CHROME_WEB_STORE_RELEASE_NOTES_1.1.3.md` from the repository.
- Added `.gitignore` rule to prevent tracking `CHROME_WEB_STORE_RELEASE_NOTES_*.md` files.

## 1.3.23 - 2026-03-05

- Removed all `GITHUB_RELEASE_*.md` files from the repository.
- Added `.gitignore` rule to prevent `GITHUB_RELEASE_*.md` files from being tracked again.
- Documented release-notes policy in `README.md` (`CHANGELOG.md` is the single source).

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
