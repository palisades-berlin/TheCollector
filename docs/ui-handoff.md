# UI Handoff (Single Source of Truth)

This document defines the implementation contract between design and code for THE Collector.

## Source of Truth

- Figma file: `THECollector - UI Kit & Screens`
- Rule: this Figma file is the single source of truth for all UX/UI and components.
- Implementation policy: code should map to Figma tokens, component states, and naming before introducing new visual patterns.

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

## Figma Mapping Table

| Figma Section/Component      | State/Variant                             | Code Class Contract                                                                                                                         | Primary Files                                                                                           |
| ---------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Components / Button          | primary, secondary, ghost, danger; sm, md | `sc-btn` + variant + size (`sc-btn-primary`, `sc-btn-secondary`, `sc-btn-ghost`, `sc-btn-danger`, `sc-btn-sm`, `sc-btn-md`, `sc-btn-block`) | `src/shared/ui.css`, consumed in popup/history/options/preview HTML                                     |
| Components / Input           | text/search/dropdown                      | `sc-input`, `sc-select`                                                                                                                     | `src/shared/ui.css`, `src/history/history.html`, `src/options/options.html`, `src/preview/preview.html` |
| Components / Tabs            | horizontal tabs                           | `sc-tablist`, `sc-tab`                                                                                                                      | `src/shared/ui.css`, `src/popup/popup.html`                                                             |
| Components / Pills/Tags      | status/info labels                        | `sc-pill` + `sc-pill-ok/warn/off`                                                                                                           | `src/shared/ui.css`, `src/history/history.html`, `src/options/options.html`                             |
| Components / Toast + Banners | info/success/warn/error                   | `sc-banner` + variant classes; toast via `.sc-toast.*`                                                                                      | `src/shared/ui.css`, popup/history/options/preview HTML                                                 |
| Components / Modal shell     | overlay dialog                            | `sc-modal`                                                                                                                                  | `src/shared/ui.css`, `src/history/history.html`                                                         |
| Popup / Capture              | default/progress/success/error            | `sc-btn*`, `sc-banner*`, `sc-kbd` + `--popup-*` aliases                                                                                     | `src/popup/popup.html`, `src/popup/popup.css`                                                           |
| Sidebar / History            | default/filter/empty/loading/overlay      | `sc-card`, `sc-input`, `sc-select`, `sc-btn`, `sc-modal`, `sc-state-*` + `--history-*` aliases                                              | `src/history/history.html`, `src/history/history.css`                                                   |
| Settings / Account           | default/status/permission badges          | `sc-card`, `sc-input`, `sc-select`, `sc-btn`, `sc-pill*`, `sc-banner*`                                                                      | `src/options/options.html`, `src/options/options.css`                                                   |
| Preview / Inspector          | toolbar/editing/loading/error             | `sc-btn*`, `sc-select`, `sc-banner*`, `sc-state-loading` + `--preview-*` aliases                                                            | `src/preview/preview.html`, `src/preview/preview.css`                                                   |

## Change Policy

- If Figma changes:
  1. Update shared tokens/components first (`src/shared/ui.css`).
  2. Update surface semantic layers (`--popup-*`, `--history-*`) only where needed.
  3. Keep behavior stable unless interaction requirements changed in Figma.
- If code changes require new UI patterns:
  - add to Figma first, then implement in shared primitives, then consume in surfaces.
