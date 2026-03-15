# Design System Rules — THE Collector

> **Purpose:** Single source of truth for AI tools (Claude, Codex) integrating Figma designs with the codebase. Generated 2026-03-13 by `create_design_system_rules` analysis of the live codebase.
> **Note for Phase 0:** This document is the spec for the Figma rebuild. Every token, component, and naming convention here mirrors what is already live in code. Figma must match this — not the other way around.

---

## 1. Token Definitions

### Where tokens live

All design tokens are defined as CSS custom properties in **`src/shared/ui.css`** under `:root`. Surface-specific semantic aliases live in each surface's CSS file and always point back to `--sc-*` globals.

### Token naming convention

```
--sc-<category>-<variant>: <value>;
```

Surface aliases follow the same pattern but with a surface prefix:

```
--popup-<category>: var(--sc-color-<category>);
--history-<category>: var(--sc-color-<category>);
```

### Token tiers (DS 2.0 architecture)

**Tier 1 — Global primitives** (`src/shared/ui.css`)
Raw values. Never referenced in HTML directly.

**Tier 2 — Semantic globals** (`--sc-*` in `src/shared/ui.css`)
Role-based names consumed across all surfaces.

**Tier 3 — Surface semantic aliases** (`--popup-*`, `--history-*`, etc.)
Surface-scoped re-exports of Tier 2 tokens. Purpose: future surface-specific overrides without touching globals.

### Color tokens

#### Surface (light mode → dark mode)

| Token                  | Light     | Dark      |
| ---------------------- | --------- | --------- |
| `--sc-color-surface-1` | `#fff`    | `#161f2f` |
| `--sc-color-surface-2` | `#fbfdff` | `#1a2435` |
| `--sc-color-surface-3` | `#f5f8ff` | `#202c40` |
| `--sc-color-surface-4` | `#e9f0f8` | `#1a2538` |
| `--sc-color-bg`        | `#f0f4f8` | `#111826` |

#### Brand

| Token                      | Value     |
| -------------------------- | --------- |
| `--sc-color-brand-primary` | `#1976d2` |
| `--sc-color-brand-accent`  | `#42a5f5` |
| `--sc-color-brand-success` | `#2e7d32` |
| `--sc-color-brand-warning` | `#8d6e00` |
| `--sc-color-brand-danger`  | `#b71c1c` |

#### Text (light)

| Token                       | Value     |
| --------------------------- | --------- |
| `--sc-color-text`           | `#1a1a2e` |
| `--sc-color-text-strong`    | `#1d3d61` |
| `--sc-color-text-muted`     | `#607589` |
| `--sc-color-text-faint`     | `#90a4ae` |
| `--sc-color-text-subtle`    | `#5f6f89` |
| `--sc-color-text-secondary` | `#455a64` |
| `--sc-color-text-ui`        | `#546678` |

#### Border (light)

| Token                      | Value     |
| -------------------------- | --------- |
| `--sc-color-border`        | `#e3e8ef` |
| `--sc-color-border-strong` | `#ccd8e7` |
| `--sc-color-border-panel`  | `#dce5ef` |
| `--sc-color-border-card`   | `#ecf1f6` |
| `--sc-color-border-header` | `#dce6f3` |

#### Primary scale

| Token                       | Value     |
| --------------------------- | --------- |
| `--sc-color-primary`        | `#1976d2` |
| `--sc-color-primary-strong` | `#1565c0` |
| `--sc-color-primary-deep`   | `#0d47a1` |
| `--sc-color-primary-active` | `#0f56b3` |
| `--sc-color-primary-soft`   | `#e3f2fd` |
| `--sc-color-primary-soft-2` | `#bbdefb` |
| `--sc-color-primary-border` | `#90caf9` |
| `--sc-color-primary-glow`   | `#42a5f5` |

#### Header gradient

```css
--sc-header-grad: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
/* dark: linear-gradient(135deg, #0f3d7c 0%, #0a2d63 100%) */
```

### Spacing tokens

4px base grid with 8px scale:

| Token       | Value  |
| ----------- | ------ |
| `--sc-sp-1` | `4px`  |
| `--sc-sp-2` | `8px`  |
| `--sc-sp-3` | `12px` |
| `--sc-sp-4` | `16px` |
| `--sc-sp-5` | `20px` |
| `--sc-sp-6` | `24px` |
| `--sc-sp-7` | `28px` |
| `--sc-sp-8` | `32px` |

### Radius tokens

| Token              | Value   |
| ------------------ | ------- |
| `--sc-radius-xs`   | `4px`   |
| `--sc-radius-sm`   | `6px`   |
| `--sc-radius-md`   | `8px`   |
| `--sc-radius-lg`   | `16px`  |
| `--sc-radius-pill` | `999px` |

### Motion tokens

| Token               | Value                               |
| ------------------- | ----------------------------------- |
| `--sc-motion-quick` | `120ms`                             |
| `--sc-motion-base`  | `180ms`                             |
| `--sc-motion-slow`  | `240ms`                             |
| `--sc-ease`         | `cubic-bezier(0.2, 0, 0, 1)`        |
| `--sc-ease-spring`  | `cubic-bezier(0.34, 1.56, 0.64, 1)` |

### Elevation tokens

| Token              | Value                              |
| ------------------ | ---------------------------------- |
| `--sc-elevation-0` | `none`                             |
| `--sc-elevation-1` | `0 1px 3px rgba(0,0,0,0.1)`        |
| `--sc-elevation-2` | `0 2px 8px rgba(0,0,0,0.15)`       |
| `--sc-elevation-3` | `0 4px 14px rgba(21,101,192,0.3)`  |
| `--sc-elevation-4` | `0 4px 16px rgba(25,118,210,0.12)` |

### Density tokens (control heights)

| Token                      | Value  | Use                          |
| -------------------------- | ------ | ---------------------------- |
| `--sc-density-compact`     | `32px` | `sc-btn-sm`, row actions     |
| `--sc-density-default`     | `40px` | `sc-btn-md`, inputs, selects |
| `--sc-density-comfortable` | `44px` | tabs                         |

### Typography tokens

| Token                          | Value                                              |
| ------------------------------ | -------------------------------------------------- |
| `--sc-font-sans`               | `'Poppins', 'Segoe UI', Roboto, Arial, sans-serif` |
| `--sc-font-mono`               | `'Consolas', 'Menlo', 'Courier New', monospace`    |
| `--sc-font-h1-size`            | `18px`                                             |
| `--sc-font-h1-weight`          | `700`                                              |
| `--sc-font-h2-size`            | `15px`                                             |
| `--sc-font-h2-weight`          | `700`                                              |
| `--sc-font-body-size`          | `13px`                                             |
| `--sc-font-body-weight`        | `400`                                              |
| `--sc-font-body-medium-weight` | `500`                                              |
| `--sc-font-caption-size`       | `11px`                                             |
| `--sc-font-caption-weight`     | `500`                                              |
| `--sc-lh-tight`                | `1.2`                                              |
| `--sc-lh-body`                 | `1.45`                                             |
| `--sc-lh-caption`              | `1.35`                                             |

### Focus token

```css
--sc-focus: #64b5f6;
--sc-focus-glow: 0 0 0 3px rgba(100, 181, 246, 0.22);
/* dark: 0 0 0 3px rgba(120, 179, 246, 0.28) */
```

### Dark mode

Dark mode is activated via `[data-theme='dark']` on `:root`. The same `--sc-*` token names are overridden — no parallel naming scheme. Component classes require zero changes between modes; only the token values swap.

---

## 2. Component Library

All shared components are plain CSS classes defined in `src/shared/ui.css`. No JS framework. No CSS-in-JS. No build-time compilation of classes.

### Component inventory

#### Layout / structure

| Class            | Description                                        |
| ---------------- | -------------------------------------------------- |
| `sc-header`      | Sticky header bar with brand gradient              |
| `sc-header-nav`  | Inline-flex nav link group inside header           |
| `sc-header-link` | Individual nav link pill with active state         |
| `sc-card`        | Surface card (white bg, panel border, md radius)   |
| `sc-modal`       | Full-screen overlay scrim + centered content shell |

#### Controls

| Class              | Description                                               |
| ------------------ | --------------------------------------------------------- |
| `sc-btn`           | Base button (32px height, sm radius, body text)           |
| `sc-btn-primary`   | Filled blue CTA                                           |
| `sc-btn-secondary` | Subdued variant (muted text)                              |
| `sc-btn-ghost`     | Transparent with primary border/text                      |
| `sc-btn-danger`    | Red-tinted destructive action                             |
| `sc-btn-sm`        | 32px height, 11px caption font                            |
| `sc-btn-md`        | 40px height, full padding                                 |
| `sc-btn-block`     | 100% width                                                |
| `sc-input`         | Full-width text input (40px height)                       |
| `sc-select`        | Full-width dropdown (40px height)                         |
| `sc-tablist`       | Horizontal tab container with bottom border               |
| `sc-tab`           | Individual tab button with bottom-border active indicator |

#### Status indicators

| Class                            | Description                                              |
| -------------------------------- | -------------------------------------------------------- |
| `sc-pill`                        | Compact label badge (pill radius, 11px font, 700 weight) |
| `sc-pill-ok`                     | Green success pill                                       |
| `sc-pill-warn`                   | Yellow warning pill                                      |
| `sc-pill-off` / `sc-pill-danger` | Red danger pill                                          |

#### Feedback

| Class               | Description                                              |
| ------------------- | -------------------------------------------------------- |
| `sc-banner`         | Inline notification strip                                |
| `sc-banner-info`    | Blue info variant                                        |
| `sc-banner-success` | Green success variant                                    |
| `sc-banner-warn`    | Yellow warning variant                                   |
| `sc-banner-error`   | Red error variant                                        |
| `sc-state-empty`    | Centered empty state container                           |
| `sc-state-loading`  | Centered loading state container                         |
| `sc-skeleton`       | Shimmer loading placeholder                              |
| `sc-toast-host`     | Fixed bottom-right toast stack container                 |
| `sc-toast`          | Individual toast (info/success/error variants via class) |

#### Utility

| Class           | Description                                            |
| --------------- | ------------------------------------------------------ |
| `sc-kbd`        | Keyboard shortcut badge (monospace, border-bottom 2px) |
| `sc-page-enter` | Page entrance animation (fade + translateY 6px)        |

### Component architecture rules

1. Consume shared classes before creating surface-specific variants.
2. Surface-specific overrides go in the surface CSS file only (`popup.css`, `history.css`, etc.).
3. Component state is driven by HTML attributes (`aria-selected`, `aria-current`, `aria-disabled`, `data-theme`) — not JS-toggled class names where possible.
4. Popup capture errors use toast-only feedback (`.sc-toast.error`) — no inline red error banner.

---

## 3. Frameworks & Libraries

- **UI framework:** None. Vanilla JS + HTML. No React, Vue, Angular, or Svelte.
- **Styling:** Plain CSS with CSS custom properties. No CSS Modules, Styled Components, Tailwind, or SASS.
- **Build system:** None for CSS/HTML. Extension is loaded directly as source.
- **Testing:** Jest + Playwright (E2E visual regression via `npm run test:e2e:visual`). Visual parity baseline: `maxDiffPixels ≤ 2`.
- **Runtime:** Manifest V3 Chrome/Edge extension. Four isolated surfaces: popup, history (full-tab), options (full-tab), preview (full-tab), onboarding (full-tab).

---

## 4. Asset Management

- **Icons:** Inline SVG in HTML or CSS `background-image`. No external icon library. No icon font.
- **Images:** Extension icon set in `/icons/` directory. Accessed via `manifest.json` `icons` field and `action.default_icon`.
- **Thumbnails:** Stored in IndexedDB thumbnail fast-path store via `src/shared/db.js`. Retrieved lazily, viewport-driven (no upfront Blob reads).
- **Screenshots:** Stored as IndexedDB Blobs with metadata in `screenshot_meta` records. Oldest-first auto-purge policy when limit reached.
- **No CDN.** Fully local-only. No external network requests permitted (ADR 0002).

---

## 5. Icon System

- No dedicated icon library.
- Icons are inline SVG elements embedded in HTML templates.
- No naming convention enforced — icons are contextual and surface-specific.
- **Phase 0 Figma note:** If Phase 0 introduces a canonical icon set, it should be documented in `docs/ui-handoff.md` under a new `## Icon System` section and matched with inline SVG in HTML surfaces.

---

## 6. Styling Approach

### Methodology

- **Global flat CSS** in `src/shared/ui.css` for all shared primitives and tokens.
- **Surface-specific CSS** files (`popup.css`, `history.css`, `options.css`, `preview.css`, `onboarding.css`) consume globals and add surface layout.
- **BEM-lite class naming:** `sc-<component>[-<modifier>]` for shared; `<surface>-<element>` for surface-specific.
- **No utility-first approach.** No Tailwind. No atomic classes.

### Responsive design

- Extension surfaces are fixed-width (popup: 400px). Full-tab surfaces (history, options, preview) are fluid.
- No media query breakpoints for popup. Full-tab surfaces use flexible grid layout.
- `prefers-reduced-motion` media query disables all animations and transitions globally.

### Global styles

- `box-sizing: border-box` reset in each surface CSS file.
- `:focus-visible` style defined globally in `src/shared/ui.css`: `2px solid var(--sc-focus)` + glow box-shadow.
- Global transition shorthand on `button`, `a`, `input`, `select` elements.

---

## 7. Project Structure

```
src/
  shared/
    ui.css                  ← ALL tokens + shared component classes (THE file)
    messages.js
    constants.js
    non-fatal.js
    db.js                   ← IndexedDB primitives, thumbnail store, quota guardrails
    capture-profiles.js
    nudges.js
    value-report.js
    repos/                  ← storage access wrappers (screenshots, URLs, settings)
    *.js                    ← utilities (filename, download, validation, UI helpers)
  popup/
    popup.html / popup.css / popup.js
    popup-profile-payload.js
    capture-queue.js
  history/
    history.html / history.css / history.js
    history-thumbs.js
    history-files-overlay.js
  options/
    options.html / options.css / options.js
  preview/
    preview.html / preview.css / preview.js
  onboarding/
    onboarding.html / onboarding.css / onboarding.js
  background/
    service-worker.js       ← thin bootstrap coordinator
    background-runtime.js
    capture-service.js
    message-router.js
    queue-state.js
    downloads.js
    offscreen-manager.js
    [other managers]
  content/
    capture-agent.js
  offscreen/
    offscreen.js            ← tile stitching + image persistence
docs/
  ui-handoff.md             ← Figma ↔ code mapping table + design principles
  architecture.md
  design-overhaul-master-plan-2026-03-13.md
  thecollector-2.0-90-day-roadmap.md
  adr/                      ← Architecture Decision Records 0001–0013
```

### Feature organization pattern

- Each surface is a self-contained folder: one HTML, one CSS, one or more JS files.
- Shared logic lives in `src/shared/` — never duplicated per-surface.
- Repository pattern: all IndexedDB/storage access goes through `src/shared/repos/*.js`.

---

## 8. Figma Integration Rules (for Phase 0)

### Phase 0 goal

Rebuild the Figma file so it is an exact, complete reflection of the live token system above. No new values. No approximations.

### Token mapping rule

Every Figma color style, spacing token, radius style, and text style must use the exact values from section 1 above. The `--sc-*` token name is the canonical name — use it as the Figma style name (e.g. `color/surface/1`, `color/brand/primary`, `motion/quick`).

### Component mapping rule

Each class in section 2 maps to one Figma component. The class name is the component name. States map to Figma variants:

- `sc-btn` → Button / default, hover, disabled; variants: primary, secondary, ghost, danger; sizes: sm, md, block
- `sc-input` / `sc-select` → Input / default, focus, placeholder
- `sc-tab` → Tab / default, active
- `sc-pill` → Pill / default, ok, warn, danger
- `sc-banner` → Banner / default, info, success, warn, error
- `sc-toast` → Toast / info, success, error
- `sc-modal` → Modal shell (overlay scrim only — content is surface-specific)

### Dark mode

Dark mode is a Figma variable mode toggle on the `:root` token set. All components inherit the mode — no separate dark-mode component variants.

### Naming convention for Figma

- Token styles: `<category>/<subcategory>/<variant>` e.g. `color/surface/1`, `spacing/4`, `radius/md`
- Components: `<ComponentName>/<Variant>/<State>` e.g. `Button/Primary/Default`
- Frames/screens: match surface names — `Popup`, `Screenshots`, `Settings`, `Preview`, `Onboarding`
- Sections within screens: match Figma Mapping Table in `docs/ui-handoff.md`

### Design principles (non-negotiable)

Source: `docs/ui-handoff.md` §Design Principles + `docs/design-overhaul-master-plan-2026-03-13.md` §3.2

1. **One nav, always in the same place.** `sc-header-nav` is second child of `<header>` on every full-page surface.
2. **Header = navigation only. Command bar = actions.** No CTAs in the header.
3. **Max 3 visible top-level actions per surface.** Overflow → dropdown.
4. **Contextual UI is hidden until triggered.** No persistent zero-state bars.
5. **Tabs filter one data type.** Audit log ≠ a tab alongside All/Starred/Today.
6. **Destructive actions have spatial separation.** Clear All is right-aligned, separated by a visual gap.

---

_Generated 2026-03-13 · Source: `src/shared/ui.css`, `src/popup/popup.css`, `src/history/history.css`, `docs/ui-handoff.md`, `docs/architecture.md`_
