# UI Handoff (Single Source of Truth)

This document defines the implementation contract between design and code for THE Collector.

## Source of Truth

- Figma file: `THECollector - UI Kit & Screens`
- Figma URL: `https://www.figma.com/design/sECUN6qSqUygWoG7PhC548/THECollector---UI-Kit---Screens?t=UVQ55HTnnPvLrqyo-0`
- Figma file key: `sECUN6qSqUygWoG7PhC548`
- Rule: this Figma file is the single source of truth for all UX/UI and components.
- Implementation policy: code should map to Figma tokens, component states, and naming before introducing new visual patterns.
- Active handoff node (authoritative): `19:2` (`THECollector - Final Handoff Ops`)
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
  - hidden row actions become visible on `:focus-within` as well as hover.

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

| Figma Section/Component      | Figma Node | State/Variant                             | Code Class Contract                                                                                                                           | Primary Files                                                                                           |
| ---------------------------- | ---------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Components / Button          | `1:4`      | primary, secondary, ghost, danger; sm, md | `sc-btn` + variant + size (`sc-btn-primary`, `sc-btn-secondary`, `sc-btn-ghost`, `sc-btn-danger`, `sc-btn-sm`, `sc-btn-md`, `sc-btn-block`) | `src/shared/ui.css`, consumed in popup/history/options/preview HTML                                     |
| Components / Input           | `1:4`      | text/search/dropdown                      | `sc-input`, `sc-select`                                                                                                                       | `src/shared/ui.css`, `src/history/history.html`, `src/options/options.html`, `src/preview/preview.html` |
| Components / Tabs            | `1:4`      | horizontal tabs                           | `sc-tablist`, `sc-tab`                                                                                                                        | `src/shared/ui.css`, `src/popup/popup.html`                                                             |
| Components / Pills/Tags      | `1:4`      | status/info labels                        | `sc-pill` + `sc-pill-ok/warn/off`                                                                                                             | `src/shared/ui.css`, `src/history/history.html`, `src/options/options.html`                             |
| Components / Toast + Banners | `1:4`      | info/success/warn/error                   | `sc-banner` + variant classes; toast via `.sc-toast.*`                                                                                        | `src/shared/ui.css`, popup/history/options/preview HTML                                                 |
| Components / Modal shell     | `1:4`      | overlay dialog                            | `sc-modal`                                                                                                                                    | `src/shared/ui.css`, `src/history/history.html`                                                         |
| Popup / Capture              | `1:4`      | default/progress/success/error            | `sc-btn*`, `sc-banner*`, `sc-kbd` + `--popup-*` aliases                                                                                       | `src/popup/popup.html`, `src/popup/popup.css`                                                           |
| Sidebar / History            | `1:4`      | default/filter/empty/loading/overlay      | `sc-card`, `sc-input`, `sc-select`, `sc-btn`, `sc-modal`, `sc-state-*` + `--history-*` aliases                                              | `src/history/history.html`, `src/history/history.css`                                                   |
| Settings / Account           | `1:753`    | default/status/permission badges          | `sc-card`, `sc-input`, `sc-select`, `sc-btn`, `sc-pill*`, `sc-banner*`                                                                        | `src/options/options.html`, `src/options/options.css`                                                   |
| Preview / Inspector          | `1:4`      | toolbar/editing/loading/error             | `sc-btn*`, `sc-select`, `sc-banner*`, `sc-state-loading` + `--preview-*` aliases                                                              | `src/preview/preview.html`, `src/preview/preview.css`                                                   |
| Onboarding / First run       | `1:830`    | install guidance + quick entry actions    | `sc-card`, `sc-btn*`, `sc-banner*`                                                                                                            | `src/onboarding/onboarding.html`, `src/onboarding/onboarding.css`                                       |
| System States                | `1:885`    | permission/offline/storage/confirmation   | `sc-banner*`, `sc-btn*`, `sc-modal`                                                                                                           | `src/popup/popup.html`, `src/options/options.html`, `src/history/history.html`                         |

## Change Policy

- If Figma changes:
  1. Update shared tokens/components first (`src/shared/ui.css`).
  2. Update surface semantic layers (`--popup-*`, `--history-*`) only where needed.
  3. Keep behavior stable unless interaction requirements changed in Figma.
- If code changes require new UI patterns:
  - add to Figma first, then implement in shared primitives, then consume in surfaces.
