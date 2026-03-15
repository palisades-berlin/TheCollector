# UI Handoff (Single Source of Truth)

This document defines the implementation contract between design and code for THE Collector.

## Source of Truth

<!-- UI_SOURCE_OF_TRUTH:START -->

- Figma file `THECollector - UI Kit & Screens` is the project UI single source of truth.
- Canonical URL: `https://www.figma.com/design/sECUN6qSqUygWoG7PhC548/THECollector---UI-Kit---Screens?t=UVQ55HTnnPvLrqyo-0`
- Active handoff authority node: `19:2` (`THECollector - Final Handoff Ops`)
<!-- UI_SOURCE_OF_TRUTH:END -->
- Figma file key: `sECUN6qSqUygWoG7PhC548`
- Rule: this Figma file is the single source of truth for all UX/UI and components.
- Implementation policy: code should map to Figma tokens, component states, and naming before introducing new visual patterns.
- Canonical UI kit + screens node: `1:2` (`THECollector - UI Kit & Screens`)

## Figma Node Index (Synced 2026-03-05)

- `19:2` - FINAL handoff ops page (active handoff marker and final declaration)
- `1:2` - UI kit + screens page root
- `1:4` - Main components/screens section on UI kit page
- `1:305` - Layout Components heading block
- `1:753` - Settings frame cluster
- `1:830` - Onboarding frame cluster
- `1:885` - System states frame cluster
- `1:930` - Dark mode feasibility section

## Token Architecture

- Global primitives live in `src/shared/ui.css` (`--sc-*`).
- Surface semantic layers map to global tokens:
  - `src/popup/popup.css` (`--popup-*`)
  - `src/history/history.css` (`--history-*`)
- Typography baseline: Poppins (`--sc-font-sans`).
- Spacing baseline: 4px grid with 8px scale.

## Shared Component Primitives (Code Contract)

Use these shared classes before creating surface-specific variants:

- `sc-card`
- `sc-input`, `sc-select`
- `sc-btn` + variants:
  - `sc-btn-primary`
  - `sc-btn-secondary`
  - `sc-btn-ghost`
  - `sc-btn-danger`
  - size/layout: `sc-btn-sm`, `sc-btn-md`, `sc-btn-block`
- `sc-tablist`, `sc-tab`
- `sc-pill` + state variants:
  - `sc-pill-ok`
  - `sc-pill-warn`
  - `sc-pill-off` / `sc-pill-danger`
- Feedback states:
  - `sc-banner`
  - `sc-banner-info`, `sc-banner-success`, `sc-banner-warn`, `sc-banner-error`
  - popup capture errors use toast-only feedback (`.sc-toast.error`) as single-surface messaging (no inline red error banner)
  - `sc-state-empty`, `sc-state-loading`
- Overlay shell: `sc-modal`
- Keyboard hint: `sc-kbd`

## Accessibility Baseline

- Focus visibility: rely on shared `:focus-visible` style in `src/shared/ui.css`.
- Live regions:
  - transient feedback/status uses `role="status"` + `aria-live="polite"`
  - blocking/error feedback uses `role="alert"` + `aria-live="assertive"`
- Busy state:
  - set `aria-busy="true"` for loading/capture workflows; restore to `false` on completion/failure.
- Keyboard behavior:
  - tablists support arrow-key navigation.
  - modal overlays must trap focus while open and return focus to the trigger on close.
  - hidden row actions become visible on `:focus-within` as well as hover.
  - URL Library row expansion actions are explicit-button only (no implicit whole-row toggle).

## Screen Mapping

- Popup surface:
  - structure: `src/popup/popup.html`
  - styles: `src/popup/popup.css`
  - behavior: `src/popup/popup.js`
- Sidebar/history workspace:
  - structure: `src/history/history.html`
  - styles: `src/history/history.css`
  - behavior: `src/history/history.js`
- Settings surface:
  - structure: `src/options/options.html`
  - styles: `src/options/options.css`
  - behavior: `src/options/options.js`
- Preview surface:
  - structure: `src/preview/preview.html`
  - styles: `src/preview/preview.css`
  - behavior: `src/preview/preview.js`
- Onboarding surface:
  - structure: `src/onboarding/onboarding.html`
  - styles: `src/onboarding/onboarding.css`
  - behavior: `src/onboarding/onboarding.js`

## Figma Mapping Table

| Figma Section/Component      | Figma Node | State/Variant                             | Code Class Contract                                                                                                                                                                                     | Primary Files                                                                                           |
| ---------------------------- | ---------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Components / Button          | `1:4`      | primary, secondary, ghost, danger; sm, md | `sc-btn` + variant + size (`sc-btn-primary`, `sc-btn-secondary`, `sc-btn-ghost`, `sc-btn-danger`, `sc-btn-sm`, `sc-btn-md`, `sc-btn-block`)                                                             | `src/shared/ui.css`, consumed in popup/history/options/preview HTML                                     |
| Components / Input           | `1:4`      | text/search/dropdown                      | `sc-input`, `sc-select`                                                                                                                                                                                 | `src/shared/ui.css`, `src/history/history.html`, `src/options/options.html`, `src/preview/preview.html` |
| Components / Tabs            | `1:4`      | horizontal tabs                           | `sc-tablist`, `sc-tab`                                                                                                                                                                                  | `src/shared/ui.css`, `src/popup/popup.html`                                                             |
| Components / Pills/Tags      | `1:4`      | status/info labels                        | `sc-pill` + `sc-pill-ok/warn/off`                                                                                                                                                                       | `src/shared/ui.css`, `src/history/history.html`, `src/options/options.html`                             |
| Components / Toast + Banners | `1:4`      | info/success/warn/error                   | `sc-banner` + variant classes; toast via `.sc-toast.*`                                                                                                                                                  | `src/shared/ui.css`, popup/history/options/preview HTML                                                 |
| Components / Modal shell     | `1:4`      | overlay dialog                            | `sc-modal`                                                                                                                                                                                              | `src/shared/ui.css`, `src/history/history.html`                                                         |
| Popup / Capture              | `1:4`      | default/progress/success/error            | `sc-btn*`, `sc-banner*`, `sc-kbd` + `--popup-*` aliases                                                                                                                                                 | `src/popup/popup.html`, `src/popup/popup.css`                                                           |
| Popup / Smart Save Profiles  | `1:4`      | quick preset actions (Pro/Ultra)          | `sc-btn`/`sc-btn-secondary` in compact action row; hidden unless tier >= Pro                                                                                                                            | `src/popup/popup.html`, `src/popup/popup.css`, `src/popup/popup.js`                                     |
| Popup / Capture Queue        | `1:4`      | queue current/window + run/clear (Pro)    | `sc-btn*` controls in compact queue card/list; hidden unless tier >= Pro                                                                                                                                | `src/popup/popup.html`, `src/popup/popup.css`, `src/popup/popup.js`                                     |
| Screenshots / History        | `1:4`      | default/filter/empty/loading/overlay      | `sc-card`, `sc-input`, `sc-select`, `sc-btn`, `sc-modal`, `sc-state-*` + `--history-*` aliases; cards enforce equal-height body slots for URL/meta/diagnostic and use viewport-driven thumbnail loading | `src/history/history.html`, `src/history/history.css`, `src/history/history-thumbs.js`                  |
| Screenshots / Filters        | `1:4`      | domain/date/export/profile filters        | `sc-input`, `sc-select`, `sc-btn`; profile filter hidden unless tier >= Pro                                                                                                                             | `src/history/history.html`, `src/history/history.css`, `src/history/history.js`                         |
| Screenshots / Bulk Actions   | `1:4`      | multi-select overlay (Pro/Ultra)          | `sc-modal`, `sc-btn`, checkbox list rows; entry action hidden unless tier >= Pro                                                                                                                        | `src/history/history.html`, `src/history/history-files-overlay.js`, `src/history/history.js`            |
| Settings / Account           | `1:753`    | default/status/permission badges          | `sc-card`, `sc-input`, `sc-select`, `sc-btn`, `sc-pill*`, `sc-banner*`                                                                                                                                  | `src/options/options.html`, `src/options/options.css`                                                   |
| Settings / Navigation Shell  | `1:753`    | left nav + section switching              | tokenized nav buttons + section panels; URL section state via `?section=<id>`                                                                                                                           | `src/options/options.html`, `src/options/options.css`, `src/options/options.js`                         |
| Settings / Save Contract     | `1:753`    | section editing + save feedback           | explicit save model with global dirty-state bar (`#globalSaveBar`) and status banner guidance; includes Auto-purge toggle + storage usage counter (`000/500`)                                           | `src/options/options.html`, `src/options/options.css`, `src/options/options.js`                         |
| Settings / Weekly Report     | `1:753`    | Pro/Ultra summary card                    | `sc-card` with tokenized stat tiles; hidden unless tier >= Pro                                                                                                                                          | `src/options/options.html`, `src/options/options.css`, `src/options/options.js`                         |
| Preview / Inspector          | `1:4`      | toolbar/editing/loading/error             | `sc-btn*`, `sc-select`, `sc-banner*`, `sc-state-loading` + `--preview-*` aliases                                                                                                                        | `src/preview/preview.html`, `src/preview/preview.css`                                                   |
| Onboarding / First run       | `1:830`    | install guidance + quick entry actions    | `sc-card`, `sc-btn*`, `sc-banner*`                                                                                                                                                                      | `src/onboarding/onboarding.html`, `src/onboarding/onboarding.css`                                       |
| System States                | `1:885`    | permission/offline/storage/confirmation   | `sc-banner*`, `sc-btn*`, `sc-modal`                                                                                                                                                                     | `src/popup/popup.html`, `src/options/options.html`, `src/history/history.html`                          |

## Design Principles

Six non-negotiable principles that govern every implementation decision across all surfaces. Source: `docs/design-overhaul-master-plan-2026-03-13.md` §3.2. Required before Phase 2 (DS 2.0 Sprint 1) begins.

**Principle 1 — One nav, always in the same place.**
Every full-page surface renders `sc-header-nav` as the second child of `<header>`. No exceptions.

**Principle 2 — The header contains navigation. The command bar contains actions.**
Page-specific CTAs do not live in the header. The header is for identity (logo + title + badge) and navigation only. Actions live in a `sc-command-bar` component below the header.

**Principle 3 — Max 3 visible top-level actions per surface.**
If a surface needs more than 3 top-level actions, group related ones into a dropdown. The user's eye should land on one primary action on first view.

**Principle 4 — Contextual UI is hidden until needed.**
Selection bars, bulk action toolbars, and inline editors appear only when triggered. Persistent zero-state UI (e.g. "0 selected") is noise, not affordance.

**Principle 5 — Tabs filter one data type. Different data types use different navigation patterns.**
A tab in a tablist must operate on the same data set as its sibling tabs. An audit log is not a tab alongside All/Starred/Today.

**Principle 6 — Destructive actions have spatial separation.**
`Clear All` is always right-aligned and separated from other actions by a visual gap. It never sits adjacent to an export or copy button.

---

## Change Policy

<!-- UI_CHANGE_POLICY:START -->

- If Figma changes:
  1. Update shared tokens/components first (`src/shared/ui.css`).
  2. Update surface semantic layers (`--popup-*`, `--history-*`) only where needed.
  3. Keep behavior stable unless interaction requirements changed in Figma.
- If code changes require new UI patterns:
  - add to Figma first, then implement in shared primitives, then consume in surfaces.
  <!-- UI_CHANGE_POLICY:END -->
