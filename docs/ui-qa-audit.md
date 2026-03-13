# UI QA Audit - Multi-Pass Calibration

## Purpose

This document is the implementation QA contract for exhaustive UX/UI verification across all extension surfaces while preserving business logic and API behavior.

- Source of truth: Figma `THECollector - UI Kit & Screens`
- Figma URL: `https://www.figma.com/design/sECUN6qSqUygWoG7PhC548/THECollector---UI-Kit---Screens?t=UVQ55HTnnPvLrqyo-0`
- Figma file key: `sECUN6qSqUygWoG7PhC548`
- Active handoff node: `19:2` (`THECollector - Final Handoff Ops`)
- Code contract source: `src/shared/ui.css` + `docs/ui-handoff.md`
- Theme scope: Light mode

## Audit Scope

### Surfaces

1. Popup / capture
2. Popup / URLs (+ URL history subview)
3. History workspace (default, empty, loading, files overlay)
4. Settings (default + permission feedback)
5. Preview (edit mode + error + diff)
6. Tier-gated overlays (Pro/Ultra): Smart Save profile row, profile filter, bulk entry, nudge card, weekly report card
7. URL Collector 2.0 readiness states (planned): saved URL views, URL tags/notes, URL bulk actions, Ultra commands URL actions

### Components

1. Shared primitives: `sc-btn*`, `sc-input`, `sc-select`, `sc-card`, `sc-tab*`, `sc-pill*`, `sc-banner*`, `sc-state-*`, `sc-modal`, `sc-kbd`
2. Surface components:

- Popup: header badge, segmented tabs, capture and URL action blocks, row actions, footer groups
- History: header actions, filters (including profile filter), cards, diagnostics banner, files overlay rows
- Settings: cards, labels/controls rows, status banners, permission pills
- Preview: toolbar actions, preset group, edit toolbar, mode notice, screenshot stage

### Flows and States

1. Capture flow: idle -> progress -> success/error
2. URL flow: add/add-all/copy/export/clear/restore/history
3. History flow: filter/reset/compare/open/delete/files
4. Settings flow: load/save/grant/revoke + feedback
5. Preview flow: load/edit/export/preset/error/diff
6. Tier visibility flow: Basic hides Pro/Ultra controls; Pro and Ultra render entitled controls

State coverage target:

- default, hover, active/pressed, focus-visible, disabled, empty, loading, success, warning, error, hidden/visible transitions.
- Popup error surface contract: capture errors must render as a single toast surface only (no inline red error banner and no duplicated stacked messages).

## Calibration Targets

### Spacing and Grid

- Use tokenized rhythm: `4, 8, 12, 16, 20, 24, 32`
- No new ad-hoc spacing constants without inline exception comment
- Inter-control gaps: `8-12`
- Section gaps: `16`
- Surface shell padding:
  - Popup: 16 side rhythm
  - History/Settings/Preview: tokenized 20-24 context padding

### Control Geometry

- Small controls: `32px`
- Standard controls: `40px`
- Popup segmented tabs: `44px` (documented surface exception)
- Icon-to-label gap: `6px`
- Popup height calibration: fit active-tab content up to popup max height; never let popup overflow the browser frame; never leave avoidable dead vertical space on shorter tabs; when constrained, only long content regions may scroll while fixed controls remain visible.

### Card Model

- Radius: `8px` (`--sc-r-md`) unless documented exception
- Border: semantic border token only
- Card padding:
  - compact: `12px`
  - standard: `16px`
- Action row alignment: baseline-consistent with `8-12px` gaps
- Card height consistency: cards in the same grid row must render equal heights even when optional metadata/diagnostic lines differ; reserve content slots and clamp overflow where needed.

### Typography and Color

- Font family: Poppins
- Semantic sizes from shared tokens (`--sc-font-*`)
- Line heights from shared tokens (`--sc-lh-*`)
- Semantic color usage only (`--sc-color-*` and surface aliases)

## Current Findings Matrix

| Area                             | Severity | Current                                                      | Expected                                                      | Target Files                                                                                           |
| -------------------------------- | -------- | ------------------------------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Spacing rhythm                   | High     | Multiple legacy local spacings in surface CSS                | Token-scale spacing only, exceptions documented               | `src/popup/popup.css`, `src/history/history.css`, `src/options/options.css`, `src/preview/preview.css` |
| Control height role mapping      | High     | Small/standard control roles mixed in dense bars             | strict role mapping (`32`/`40`, popup tab `44`)               | `src/shared/ui.css` + all surfaces                                                                     |
| Hover lift in dense bars         | High     | Global hover lift can create optical baseline jitter         | keep lift only where visually appropriate; opt out dense bars | `src/shared/ui.css` + surface override blocks                                                          |
| Card internal rhythm             | High     | Card body and action paddings differ by surface              | compact vs standard card contract                             | `src/history/history.css`, `src/options/options.css`, `src/preview/preview.css`                        |
| Toolbar action grouping          | Medium   | Preview/action groups can shift hierarchy when wrapping      | deterministic group spacing/wrap behavior                     | `src/preview/preview.css`                                                                              |
| Component-state snapshot breadth | Medium   | page-level snapshots exist but not full primitive matrix     | broaden screenshot matrix to state variants                   | `tests/visual/ui-parity.spec.mjs`                                                                      |
| Accessibility automation depth   | Medium   | semantic ARIA exists and basic contract checks are automated | deepen keyboard/focus/contrast/state checks in CI             | `tests/accessibility-contract.test.mjs`, `tests/visual/*`                                              |
| Figma node/frame validation      | Medium   | Direct file key + core node mapping now documented           | wire per-state snapshots to explicit frame/node references    | `docs/ui-handoff.md`, `tests/visual/ui-parity.spec.mjs`                                                |
| Tier-gated visibility parity     | High     | Pro/Ultra controls are now feature-gated across surfaces     | Basic/Pro/Ultra visibility must be snapshot-validated         | `src/popup/*`, `src/history/*`, `src/options/*`, `tests/visual/ui-parity.spec.mjs`                     |

## Remediation Tracking Board

| Finding                                       | Phase   | Owner Files                                                                           | Risk   | Test Gate                                    |
| --------------------------------------------- | ------- | ------------------------------------------------------------------------------------- | ------ | -------------------------------------------- |
| Control/tap target ergonomics in popup        | Phase 2 | `src/popup/popup.css`, `src/shared/ui.css`                                            | Medium | visual + keyboard spot checks                |
| Preview toolbar cognitive load                | Phase 2 | `src/preview/preview.css`, `src/preview/preview.html`                                 | Medium | visual snapshots (`preview-edit-mode`, wrap) |
| Theme system support                          | Phase 4 | `src/shared/settings.js`, `src/shared/ui.css`, `src/shared/theme.js`, `src/options/*` | Medium | unit(settings) + visual(light/dark)          |
| Smart Save profile + History filter parity    | Phase 2 | `src/popup/*`, `src/history/*`, `src/options/*`                                       | Low    | unit + visual tier-state checks              |
| First-run onboarding and permission education | Phase 3 | `src/background/service-worker.js`, `src/onboarding/*`, `src/options/*`               | Low    | manual install/onboarding checklist          |
| Extension-native entry points                 | Phase 5 | `manifest.json`, `src/background/service-worker.js`                                   | Medium | manual context menu + omnibox smoke          |
| Accessibility automation depth                | Phase 6 | `tests/visual/ui-parity.spec.mjs` (+ a11y checks)                                     | Medium | CI checks pass                               |

## Implementation Strategy (Logic-Safe)

1. CSS-only + token-first
2. Optional minimal class wiring only (no behavior changes)
3. No data-flow/API/protocol modifications
4. Exceptions require inline reason comment
5. Remove only clearly obsolete visual rules

## QA Execution Checklist

### Pass 0 - Baseline and Inventory

- [ ] Enumerate all surfaces, states, and component usage
- [ ] Capture baseline screenshots for audited states
- [ ] Produce token/non-token usage report

### Pass 1 - Shared Primitive Calibration

- [ ] Control heights and paddings aligned to `sc-*` tokens
- [ ] Tab/button/input/card/pill/banner primitives calibrated
- [ ] Motion behavior audited for baseline stability

### Pass 2 - Surface Layout Calibration

- [ ] Popup spacing and segmented tabs aligned
- [ ] History filters/grid/cards/actions aligned
- [ ] History card rows maintain equal-height geometry for mixed content states (with/without optional diagnostics)
- [ ] Settings shell/rows/actions aligned
- [ ] Preview toolbar/editbar/stage spacing aligned

### Pass 3 - State and Flow QA

- [ ] loading/empty/success/error/disabled states match system
- [ ] primary flows remain behavior-identical
- [ ] popup capture errors show a single toast only; repeated identical errors do not stack

### Pass 4 - Accessibility QA

- [ ] focus-visible consistency across controls
- [ ] keyboard tab order and activation checks
- [ ] live region behavior for dynamic statuses
- [ ] modal semantics, focus trap, and focus-return interactions
- [ ] URL Library tablist arrow-key navigation (Left/Right/Home/End) across all views
- [ ] URL row expansion only via explicit action buttons (no implicit full-row expand)
- [x] HTML accessibility/isolation contracts enforced (`tests/accessibility-contract.test.mjs`)

### Pass 5 - Figma Pixel Validation

- [x] Map each audited state family to Figma file key + frame/node IDs
- Operational follow-ups for parity deltas/certification are tracked in `docs/todo-list.md`.

## Testing Contract

Run for every calibration wave:

```bash
npm run lint
npm run test:unit
npm run test:e2e:visual
npm run format:check
```

Visual snapshots must be updated only for intentionally changed surfaces/states.

## Parity Delta Log (2026-03-12)

| Snapshot              | Figma Node | Calibrated Tolerance | Delta Summary                                                                     |
| --------------------- | ---------- | -------------------- | --------------------------------------------------------------------------------- |
| `history-default.png` | `1:4`      | `220`                | Remaining drift is concentrated in header/filter text antialiasing and spacing.   |
| `history-empty.png`   | `1:885`    | `220`                | Residual diff is primarily vertical rhythm/font rendering variance.               |
| `history-loading.png` | `1:885`    | `220`                | Residual diff is mostly skeleton gradient/antialiasing behavior across renderers. |

Certification status:

- Reduced temporary history tolerances from `300` to `220` for the current calibration wave.
- Next reduction target remains `<=100` before returning to the default global `<=2` target.

## Acceptance Criteria

1. 0 unresolved Critical/High UI inconsistencies for in-scope surfaces
2. 100% completion of audit checklist for in-scope states
3. Visual parity snapshots green
4. Functional behavior unchanged
5. Accessibility states remain semantically correct

## Known Dependency

Final pixel-perfect certification still requires a full per-state node matrix and explicit Figma-vs-snapshot delta logs, but file-level/node-level source mapping is now present in the repo handoff contract.

## Figma Sync Status (2026-03-05)

- Synced canonical Figma URL and file key into repo docs.
- Synced active handoff authority node (`19:2`) into repo docs.
- Synced core section nodes for settings/onboarding/system states and UI kit roots into repo docs.
- Next parity increment tracking moved to `docs/todo-list.md`.

## Recent Calibration Note (2026-03-05)

- Preview header PDF UX was recalibrated to a grouped export bar:
  - navigation, PDF settings, primary exports, presets, and hint now use explicit grouped layout
  - PDF size control is visually coupled with export actions and responsive wrap behavior is locked by snapshot coverage.
