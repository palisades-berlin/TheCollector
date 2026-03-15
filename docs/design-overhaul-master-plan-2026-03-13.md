# THE Collector — Design Overhaul Master Plan

**Date:** 2026-03-13
**Author:** Principal UX/UI Designer
**Status:** APPROVED DIRECTION — implement via Figma-first workflow
**Covers:** UX consistency · Visual quality uplift · Visual system direction v2.0
**Figma source of truth:** `sECUN6qSqUygWoG7PhC548` (`THECollector - UI Kit & Screens`)
**Roadmap alignment:** v1.10 (Quick Wins) → v2.0 DS 2.0 Sprint 1 (Token layer) → v2.0 DS 2.0 Sprint 2 (Component application)

---

> **The Figma Rule — non-negotiable throughout this document:**
> Every design change — no matter how small — must be reflected in the Figma file **before** any code is written. Figma is the single source of truth. Code follows design; design never follows code.
> This applies to token value changes, layout restructures, new components, and copy changes.
> The change policy from `docs/ui-handoff.md` is in effect at all times:
> **Figma update → `src/shared/ui.css` token update → surface alias update → behaviour stays stable.**

---

## 1. Executive Summary

THE Collector has the right structure — a coherent token system, a good font choice (Poppins), a clear colour vocabulary, and a solid roadmap. The problems are in assembly, not architecture.

Four compounding issues need to be resolved across v1.10 and v2.0:

**Issue A — UX inconsistency:** Three surfaces (Screenshots, URL Library, Preview) grew independently without a shared header contract. Navigation sits in a different DOM position on every page. The URL Library stacks five control rows before the user reaches content. Bulk-selection UI is always visible, even when nothing is selected.

**Issue B — Visual quality:** The product reads as a developer prototype. A generic 2016 blue gradient header, a cold blue-grey background, invisible card elevation, compressed typography, and 8px card radius combine to produce a "generic Chrome extension" reading rather than a premium power-user tool.

**Issue C — No visual system:** There is no coherent specification for dark mode, glass morphism, tier-differentiated density, or animation behaviour. These need to be defined before DS 2.0 token migration begins, so the token layer is built to the right target.

**Issue D — Product surface gaps:** "History" is used to mean three different things across the product. The popup URL panel is doing four simultaneous jobs in a 400px frame. URL Notes have a complete IndexedDB data model but zero UI surface anywhere. These are not design-system issues — they are product architecture debts that the design work must solve at the same time.

This document defines the solution to all three issues in a single unified plan, sequenced by dependency and risk, with Figma as the explicit gate between every phase.

---

## 2. Problem Diagnosis

### 2.1 UX Inconsistency Problems

Severity: 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low

**P-01 🔴 Navigation: different structure on every surface**

| Surface     | Nav position                              | Nav DOM role                          |
| ----------- | ----------------------------------------- | ------------------------------------- |
| Screenshots | Inside `.header-actions` div (right side) | `<nav>` nested inside actions wrapper |
| URL Library | Direct child of `<header>` (right side)   | `<nav>` standalone                    |
| Preview     | Own link group in toolbar (left side)     | No `<nav>` element                    |

Users cannot build spatial memory for navigation. Each page re-teaches the layout. Preview is the most severe case — it has no consistent nav to other surfaces at all.

**P-02 🔴 URL Library: five control layers before content**

```
Layer 1 — Header         (Logo · Nav)
Layer 2 — Quick Actions  (8 buttons: Add, Add All, Copy, TXT, CSV, Email, Restore, Clear All)
Layer 3 — Filters        (Domain · Tag · From · To)
Layer 4 — Tab bar        (All · Starred · Today · By Domain · Change Log)
Layer 5 — Selection bar  (0 selected · Select Visible · Clear · Copy · Open · TXT · CSV · Delete)
Layer 6 — Content
```

This is the single largest usability problem in the product.

**P-03 🟠 Button role undefined in dense bars**

The URL Library quick-actions row has 8 buttons at the same visual weight. Five export actions (`sc-btn` — no role signal) sit as peer siblings to the primary Add action and the destructive Clear All. The Screenshots header has Compare, Bulk, and Clear All at the same `btn-neutral sc-btn-sm` weight, even though they represent three different interaction modalities.

**P-04 🟠 Header badge pattern is inconsistent**

Screenshots badge is unlabelled (just a number). URL Library badge always shows "0 URLs" on load, which reads as an error state. Preview abandons the badge pattern entirely and spreads metadata inline as a flat string.

**P-05 🟠 Filter bar: different controls, different order, different visual treatment**

Screenshots uses a custom combobox for domain filtering; URL Library uses a plain `<input>` — same concept, different behaviour and rendering. The date pair sits in a different position on each surface. The two filter bars were built independently with no shared rhythm.

**P-06 🟠 Profile Usage pills: orphaned summary pattern**

The Screenshots page has a `PROFILE USAGE` row (`Research: 1 · Interest: 0 · Private: 0`) that exists nowhere else in the product. For Basic tier users (no profiles), it displays zeros across the board — noise with no value.

**P-07 🟡 Preview: floating left sidebar has no precedent**

The Preview page is the only surface with a floating vertical icon panel on the left edge. No icons are labelled. The panel uses hover-revealed state and has no analogue on any other surface.

**P-08 🟡 Selection/bulk pattern inconsistent**

Screenshots: Bulk mode is activated by a toggle button — the page enters selection mode explicitly. URL Library: the selection bar ("0 selected · Select Visible · Clear…") is **always rendered**, even when nothing is selected. It occupies a full row of space at zero-state.

**P-09 🟡 Change Log architecturally misplaced as a tab**

URL Library tabs: All · Starred · Today · By Domain · **Change Log**. The first four filter the same URL data set. Change Log is a fundamentally different content type — an audit trail — not a filtered view of URLs. Users tab through expecting filtered results and encounter something structurally different.

**P-10 🟢 Capitalisation inconsistency**

Screenshots header: `Clear all`. URL Library quick-actions: `Clear All`. URL Library selection bar: `Clear`. Three different labels for the same concept family.

---

**P-11 🔴 "History" naming collision: three meanings, one word**

_(From PM findings audit, 2026-03-12)_

| Usage                                         | What it actually is                             |
| --------------------------------------------- | ----------------------------------------------- |
| "History" — header nav link in `history.html` | Screenshot History page (full-tab)              |
| "History" — button in popup URL footer        | URL Change Log (add/remove operation snapshots) |
| "History" — roadmap surface references        | Conceptual URL Library page                     |

Every new URL feature added to the product makes this worse. The Screenshots page must be renamed "Screenshots" in the nav. The popup "History" button must be renamed "Change Log". The internal DOM IDs (`urlsHistoryView`, `urlHistoryListEl`) must follow.

---

**P-12 🔴 Popup URL panel: doing four jobs simultaneously**

_(From PM findings audit, 2026-03-12)_

The popup URL panel currently serves as: (1) a capture tool — Add Tab, Add All, Clear; (2) a browsable library — All / Starred / Today / By Domain view tabs + tag filter; (3) an inline editor — tag chip editor per row, star toggle per row; (4) a Change Log viewer — panel-swap subview for operation snapshots. This is structurally overloaded for a 400px-wide, height-constrained popup. The library and editing roles belong on a dedicated full-tab URL Library page.

---

**P-13 🟠 URL Notes: complete data model, zero UI**

_(From PM findings audit, 2026-03-12)_

`url-repo.js` implements full note support — `normalizeUrlNote`, 140-char limit, IndexedDB persistence in the `url_meta` store alongside the URL record. The capability is in the roadmap. No UI surface exists anywhere — no note icon, no inline field, no note indicator. The data is silently collected and never shown.

---

### 2.2 Visual Quality Problems

**V-diag-01 — Header gradient is a visual cliché**
`--sc-header-grad: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)` — the standard 2016 Material Design blue gradient, recognisable as the default for thousands of Chrome extensions. It signals "generic app" immediately.

**V-diag-02 — Page background is cold blue-grey**
`--sc-color-bg: #f0f4f8` — blue-tinted grey that makes white cards feel institutional rather than clean.

**V-diag-03 — Card elevation is nearly invisible**
A blue-tinted shadow at 12% opacity plus a very light border produces cards that barely lift off the background. The screenshot grid reads as a flat grid of bordered boxes, not a gallery of lifted items.

**V-diag-04 — Typography has no weight contrast**
Type scale spans 18/15/13/11px — only a 7px range. No typographic moment commands authority. The header title at 15px/600 weight reads as a label, not a product name.

**V-diag-05 — Border radius feels dated**
`--sc-radius-md: 8px` was standard in 2020–2022. Premium 2025–2026 products (Linear, Vercel, Arc, Raycast) use 10–14px on cards and components.

**V-diag-06 — Screenshot card actions are always visible**
Compare/Open/Delete buttons are rendered permanently below each thumbnail. A four-card row shows 12 buttons constantly — visual noise that prevents the grid from reading as a clean gallery.

---

## 3. Design Direction & Principles

### 3.1 Visual Direction

The target aesthetic sits at the intersection of **Linear** (information density + dark header), **Vercel dashboard** (clean card grid + frosted active states), and **Raycast** (precise typography + hover affordances). The closest single reference: **macOS Sequoia in dark mode** — frosted sidebars, precise typography, glass panels behind scrolling content, functional animations that never perform.

**Dark default, light secondary.** The product defaults to dark mode. Light mode is fully supported but is not the primary design frame.

**Glass as layering, not decoration.** Frosted glass surfaces communicate depth — that there is content below a sticky or floating element. It is never applied to scrolling rows or card grids.

**Brand blue as precision accent.** `#1976d2` stays. It stops filling the header. It appears only where it carries meaning: primary buttons, active nav indicators, count badges, selected states, focus rings. Its scarcity makes every appearance meaningful.

**Tier signals through density, not identity.** Basic (B2C), Pro and Ultra (B2B) share the same component system and token layer. Differences are expressed through subtle density, animation presence, and accent warmth — not a separate visual language.

### 3.2 Design Principles (add to `docs/ui-handoff.md`)

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

## 4. Complete Visual System Specification

### 4.1 Colour System

#### Dark mode (default)

```
Page base:       #080d18                    ← near-black navy, not pure black
Surface-1:       rgba(255,255,255,0.04)     ← darkest glass panel (cards)
Surface-2:       rgba(255,255,255,0.06)     ← standard glass panel
Surface-3:       rgba(255,255,255,0.09)     ← elevated glass (modals, hover)
Surface-4:       rgba(255,255,255,0.12)     ← highest glass (header, active panel)
Glass border:    rgba(255,255,255,0.09)     ← defines the glass edge
Glass border hi: rgba(255,255,255,0.15)     ← active/hover glass edge
```

Token updates (`src/shared/ui.css`, `:root[data-theme='dark']`):

```css
--sc-color-bg: #080d18;
--sc-color-surface-1: rgba(255, 255, 255, 0.04);
--sc-color-surface-2: rgba(255, 255, 255, 0.06);
--sc-color-surface-3: rgba(255, 255, 255, 0.09);
--sc-color-surface-4: rgba(255, 255, 255, 0.12);
--sc-color-border: rgba(255, 255, 255, 0.09);
--sc-color-border-strong: rgba(255, 255, 255, 0.15);
```

#### Light mode

```
Page base:   #f2f3f5                    ← warm near-neutral (not blue-grey)
Surface-1:   rgba(255,255,255,0.70)     ← cards
Surface-2:   rgba(255,255,255,0.80)     ← elevated panels
Surface-3:   rgba(255,255,255,0.85)     ← modals, overlays
Surface-4:   rgba(255,255,255,0.90)     ← header, highest layer
Glass border: rgba(0,0,0,0.07)
Glass border hi: rgba(0,0,0,0.12)
```

Token updates (`src/shared/ui.css`, `:root` default):

```css
--sc-color-bg: #f2f3f5;
--sc-color-surface-1: rgba(255, 255, 255, 0.7);
--sc-color-surface-2: rgba(255, 255, 255, 0.8);
--sc-color-surface-3: rgba(255, 255, 255, 0.85);
--sc-color-surface-4: rgba(255, 255, 255, 0.9);
```

#### Brand blue: accent only

`#1976d2` stays. It stops filling the header. Appears only for: interactive element focus rings, active/selected state backgrounds (`rgba(25,118,210,0.15)` tint), primary buttons, count badges and pills, link text and active nav indicators, progress indicators and capture state pulse.

#### Tier temperature signals

| Tier        | Accent warmth                      | Decoration                  | Control height   |
| ----------- | ---------------------------------- | --------------------------- | ---------------- |
| Basic (B2C) | `rgba(25,118,210,0.12)` hover tint | Card entrance animation ON  | 44px comfortable |
| Pro         | `rgba(25,118,210,0.08)` hover tint | Card entrance animation ON  | 40px standard    |
| Ultra       | `rgba(25,118,210,0.06)` hover tint | Card entrance animation OFF | 36px compact     |

---

### 4.2 Glass Specification

#### Glass recipe

```css
/* Dark mode glass — standard panel */
.glass-panel {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.09);
}

/* Light mode glass — standard panel */
:root:not([data-theme='dark']) .glass-panel {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(20px) saturate(200%);
  border: 1px solid rgba(0, 0, 0, 0.07);
}

/* Reduced motion — REQUIRED fallback (WCAG 2.2 AA) */
@media (prefers-reduced-motion: reduce) {
  .glass-panel {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    background: var(--sc-color-surface-2);
  }
}
```

#### Glass token group (add to `src/shared/ui.css`)

```css
--sc-glass-blur-sm: blur(12px) saturate(140%);
--sc-glass-blur-md: blur(20px) saturate(160%);
--sc-glass-blur-lg: blur(24px) saturate(180%);
--sc-glass-solid-dark: rgba(8, 13, 24, 0.8);
--sc-glass-solid-light: rgba(255, 255, 255, 0.8);
```

#### Glass per surface

| Surface                  | Blur                        | Background (dark)              | Background (light)             | Notes                                         |
| ------------------------ | --------------------------- | ------------------------------ | ------------------------------ | --------------------------------------------- |
| **Header (sticky)**      | `blur(24px) saturate(180%)` | `rgba(8,13,24,0.80)`           | `rgba(255,255,255,0.82)`       | Scrolling content bleeds through              |
| **Popup header**         | `blur(20px) saturate(160%)` | `rgba(8,13,24,0.85)`           | `rgba(255,255,255,0.88)`       | Constrained surface — heavier opacity         |
| **Popup panels**         | `blur(16px) saturate(150%)` | `rgba(255,255,255,0.04)`       | `rgba(255,255,255,0.65)`       | Inner sections in popup                       |
| **Modals / overlays**    | `blur(20px) saturate(160%)` | `rgba(10,15,28,0.88)`          | `rgba(255,255,255,0.85)`       | Modal backdrop is `rgba(0,0,0,0.5)` scrim     |
| **Dropdowns / tooltips** | `blur(16px) saturate(140%)` | `rgba(14,20,36,0.90)`          | `rgba(255,255,255,0.90)`       | Small surface, heavier opacity for legibility |
| **Card hover overlay**   | `blur(0px)`                 | `rgba(0,0,0,0.48)`             | `rgba(0,0,0,0.36)`             | No blur — action icons need sharp legibility  |
| **Screenshot cards**     | None                        | Solid `rgba(255,255,255,0.05)` | Solid `rgba(255,255,255,0.80)` | Too many cards for GPU — solid only           |

#### Critical performance rule

`backdrop-filter` is applied **only** to: (1) sticky/fixed elements (header, popup header), (2) floating elements above content (modals, dropdowns, tooltips), and (3) at most 5 elements visible simultaneously.

It is **never** applied to scrolling list rows, screenshot card grids, or URL Library rows.

---

### 4.3 Border Radius Scale

```css
/* Update --sc-radius-* in :root */
--sc-radius-xs: 5px; /* inline tags, kbd hints, small badges */
--sc-radius-sm: 10px; /* buttons, inputs, select, pills */
--sc-radius-md: 14px; /* cards, panels, filter bar containers */
--sc-radius-lg: 18px; /* modals, large dropdowns, floating panels */
--sc-radius-xl: 24px; /* popup shell, onboarding cards */
--sc-radius-pill: 999px; /* nav pills, tag chips — unchanged */
```

**Optical nesting rule:** card outer radius 14px + inner thumbnail radius 10px = correct optical nesting. The thumbnail content is visually "inside" the card, not floating on top of it.

---

### 4.4 Elevation System

Replace blue-tinted shadows with physically accurate neutral shadows, layered for depth.

```css
/* Update --sc-elevation-* tokens */
--sc-elevation-0: none;

--sc-elevation-1:
  0 1px 2px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.06); /* inputs, small panels */

--sc-elevation-2:
  0 2px 6px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(0, 0, 0, 0.08); /* default card resting state */

--sc-elevation-3:
  0 4px 12px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.1); /* card hover, active panel */

--sc-elevation-4:
  0 8px 20px rgba(0, 0, 0, 0.14), 0 16px 40px rgba(0, 0, 0, 0.12); /* modals, floating panels */

/* Dark mode overrides — higher opacity for visibility */
:root[data-theme='dark'] {
  --sc-elevation-2: 0 1px 3px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3);
  --sc-elevation-3: 0 2px 8px rgba(0, 0, 0, 0.5), 0 8px 24px rgba(0, 0, 0, 0.36);
}
```

---

### 4.5 Typography

Header title (`header-left` text): `font-size: 15px; font-weight: 700; letter-spacing: -0.01em` — tighter tracking on a product name signals premium.

Filter section labels: `font-size: 10px; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: var(--sc-color-text-faint)` — the "studio label" treatment distinguishes label from control.

Count badges: `font-weight: 700; letter-spacing: 0.01em` — reads confidently, not quietly.

---

### 4.6 Animation System

Functional only. Animations communicate state — they do not perform.

#### Timing tokens (keep existing values)

```
--sc-motion-quick:  120ms   ← micro-interactions (button press, toggle)
--sc-motion-base:   180ms   ← state transitions (card entrance, filter change)
--sc-motion-slow:   240ms   ← panel/modal entrance
--sc-ease:          cubic-bezier(0.2, 0, 0, 1)
--sc-ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1)  ← use sparingly
```

#### The four roadmap animations (DS 2.0 Sprint 1 — unchanged)

1. **Capture start pulse:** 120ms radial glow on capture button
2. **Success shimmer:** 180ms shimmer sweep across button
3. **Queue progress sweep:** linear sweep, non-janky
4. **Command palette entrance:** 140ms `scale(0.97 → 1)` + `opacity(0 → 1)`

#### Additional functional animations (new with v2.0)

| Animation             | Trigger              | Duration                  | Surfaces                                            |
| --------------------- | -------------------- | ------------------------- | --------------------------------------------------- |
| Page entrance         | Surface load         | 150ms                     | All full pages — `opacity(0→1) + translateY(6px→0)` |
| Card entrance stagger | Grid load            | 180ms + 30ms/card (max 6) | Screenshots grid, URL Library list                  |
| Glass panel appear    | Dropdown open        | 120ms                     | `opacity(0→1) + scale(0.97→1)`                      |
| Glass panel dismiss   | Dropdown close       | 90ms                      | `opacity(1→0) + scale(1→0.97)`                      |
| Card hover reveal     | `:hover` on card     | 150ms                     | Action overlay fade-in                              |
| Filter bar update     | Filter value changes | 120ms                     | List crossfade                                      |
| Button press depth    | `:active`            | 80ms                      | `translateY(1px)` on all buttons                    |

#### What does NOT animate

Tab switching (immediate), count badge number changes, form inputs, checkboxes/toggles, and anything behind `prefers-reduced-motion: reduce`.

---

### 4.7 Tier Density via CSS Custom Properties

```css
/* Density scale definitions — add to :root in src/shared/ui.css */
--sc-density-comfortable: 44px; /* Basic tier — relaxed spacing, B2C */
--sc-density-default: 40px; /* Pro tier — standard workspace */
--sc-density-compact: 36px; /* Ultra tier — power-user density */

/* Tier rules on <body data-tier="..."> */
body[data-tier='basic'] {
  --tier-accent-tint: rgba(25, 118, 210, 0.12);
  --tier-card-anim: 1;
  --tier-density: var(--sc-density-comfortable); /* 44px */
}

body[data-tier='pro'] {
  --tier-accent-tint: rgba(25, 118, 210, 0.08);
  --tier-card-anim: 1;
  --tier-density: var(--sc-density-default); /* 40px */
}

body[data-tier='ultra'] {
  --tier-accent-tint: rgba(25, 118, 210, 0.06);
  --tier-card-anim: 0;
  --tier-density: var(--sc-density-compact); /* 36px */
}

/* Animation toggle via calc trick */
.history-card {
  animation: card-in calc(var(--tier-card-anim) * 180ms) ease-out both;
}
/* When --tier-card-anim: 0 → calc(0 * 180ms) = 0ms → animation disabled */
```

**Usage:** `--tier-density` is consumed by any component that needs tier-responsive height:

```css
.sc-btn-md {
  height: var(--tier-density);
}
.url-row {
  min-height: var(--tier-density);
}
```

---

### 4.8 Accessibility Guardrails (non-negotiable)

1. **`prefers-reduced-motion: reduce`** — all transitions `0ms`, all `backdrop-filter` values replaced with solid surface fallbacks. WCAG 2.2 AA requirement.

2. **Minimum contrast on glass:** Text on glass must meet 4.5:1 ratio. Dark glass header with `rgba(255,255,255,0.90)` title ≈ 15:1. Muted nav `rgba(255,255,255,0.55)` ≈ 6:1. Both pass.

3. **Focus ring on glass:** `--sc-focus-glow` must be reinforced to `rgba(100,181,246,0.40)` in dark mode (up from 0.22) for visibility against glass surfaces.

4. **Animation is decorative:** Success/error states communicate via colour and icon. The 180ms shimmer is on top of the state change — not the state change itself.

---

## 5. Component Specifications

### 5.1 Header — The Anchor Moment

The header sets the tone for the entire product. Every surface uses an identical contract:

```html
<header class="sc-header">
  <div class="header-left">[icon] [Title] [count badge]</div>
  <nav class="sc-header-nav" aria-label="Primary">
    <a aria-current="page">Screenshots</a>
    <a>URLs</a>
    <a>Settings</a>
  </nav>
  <div class="header-actions">[page-specific CTAs — max 3 top-level controls]</div>
</header>
```

**Visual specification:**

```
Height:            56px
Background (dark): rgba(8,13,24,0.80) + backdrop-filter: blur(24px) saturate(180%)
Background (light): rgba(255,255,255,0.82) + backdrop-filter: blur(24px) saturate(180%)
Border-bottom:     1px solid rgba(255,255,255,0.07)  [dark] / rgba(0,0,0,0.07) [light]
```

**Nav pill — active state:**

```css
.sc-header-link[aria-current='page'] {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: var(--sc-radius-pill);
  padding: 5px 14px;
  font-weight: 600;
  color: #fff;
}
```

**Nav pill — inactive + hover:**

```css
.sc-header-link:not([aria-current='page']) {
  color: rgba(255, 255, 255, 0.55);
  padding: 5px 12px;
  border-radius: var(--sc-radius-pill);
  transition:
    background 120ms ease,
    color 120ms ease;
}
.sc-header-link:not([aria-current='page']):hover {
  background: rgba(255, 255, 255, 0.07);
  color: rgba(255, 255, 255, 0.9);
}
```

**Count badge:**

```css
.badge {
  background: rgba(25, 118, 210, 0.3);
  border: 1px solid rgba(25, 118, 210, 0.5);
  color: #90caf9;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: var(--sc-radius-pill);
  letter-spacing: 0.02em;
}
```

The count badge is the **only brand-blue element in the header**. It is a precision accent — a branded data point against the dark glass surface.

---

### 5.2 Command Bar (`sc-command-bar`)

A single-row band between the header and filter row. Holds page-level primary actions.

```
Height:     48px (matches one control height + padding)
Background: var(--sc-color-surface-1) with subtle border-bottom
Padding:    0 16px
Max controls: 3 top-level (primary CTA + secondary group/dropdown + destructive, right-aligned)
```

**Screenshots command bar:**

```
[Bulk Select] (ghost, toggles selection mode)              [Clear All] (danger, far right)
```

**Compare button fate:** Compare is removed from the persistent command bar. It appears contextually inside the card hover overlay area only when Bulk mode is active and 2 or more cards are checked. It is not a persistent global action. This eliminates the always-on Compare button that currently sits in the header.

**URL Library command bar:**

```
[+ Add Current Tab] (primary)  [Add All Tabs] (secondary)  [Export ▾] (secondary)  ···  [Clear All] (danger, far right)
```

Export ▾ dropdown contents: Copy · Export TXT · Export CSV · Email · Restore Last Clear (recovery action, bottom of menu with divider).

---

### 5.3 Screenshot Card System

**Resting state:**

```
Outer radius:   14px (--sc-radius-md)
Thumbnail radius: 10px (--sc-radius-sm, overflow: hidden)
Background:     solid (no backdrop-filter)
Shadow:         --sc-elevation-2
Border:         none in dark / 1px rgba(0,0,0,0.06) in light
```

**Hover state:**

```
Card:     translateY(-3px) + --sc-elevation-3
Overlay:  rgba(0,0,0,0.48) over the thumbnail area
Actions:  [compare icon] [↗ open icon] [🗑 delete icon] — 32px icon buttons, centred
          (also triggered on :focus-within for keyboard accessibility)
Transition: 180ms ease-out
Metadata row below card: always visible, never obscured by overlay
```

**Selection state (Bulk mode active):**

```
Checkbox: top-left, brand blue fill
Border-bottom: brand blue 2px
Background: rgba(25,118,210,0.08) tint
```

---

### 5.4 Primary Button

```css
.sc-btn-primary {
  background: var(--sc-color-brand-primary); /* #1976d2 */
  background-image: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(0, 0, 0, 0.04) 100%
  );
  border: 1px solid var(--sc-color-primary-strong); /* #1565c0 */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  font-weight: 600;
  letter-spacing: 0.01em;
  border-radius: var(--sc-radius-sm); /* 10px */
}

.sc-btn-primary:hover {
  background: var(--sc-color-primary-strong);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25);
}

.sc-btn-primary:active {
  transform: translateY(1px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}
```

---

### 5.5 Filter Bar (`sc-filter-bar`)

A shared component used on both Screenshots and URL Library surfaces.

```
Control height:  40px standard (--sc-control-std)
Label style:     10px / 600 weight / 0.07em tracking / uppercase / --sc-color-text-faint
Gap between items: --sc-gap-md
Domain control:  combobox with domain suggestions (not plain <input>)
Breakpoint:      filters stack at narrow viewport
```

---

### 5.6 URL Library Rows

No `backdrop-filter` on list rows. Solid surface backgrounds only.

```
Row height:     var(--tier-density)
Leading icon:   domain favicon (16×16, chrome-extension favicon service, onerror hides gracefully)
Typography:     URL text as primary / domain as secondary caption
Tag chips:      expanded by default on full-page URL Library (room exists); collapsed in popup
Star toggle:    always visible on the row, right-aligned
Note icon:      left of star toggle — inactive state (no note) = faint icon; active (has note) = filled icon
                Click note icon → expands inline 140-char text field below the URL row
                Field closes on blur or Enter; Escape cancels without saving
Selection:      checkbox appears on hover or when Bulk mode is active
```

**Note icon — two states:**

```
Inactive: [🗒] faint, aria-label="Add note"
Active:   [🗒] filled/brand-tinted, aria-label="Edit note (N chars)"
```

The `note` field already exists in the IndexedDB `url_meta` record (`max 140 chars`). This is the first UI surface for it.

---

### 5.7 Popup Glass Treatment

Limit: **two `backdrop-filter` elements maximum** in the popup at any time (the header and one panel). Never applied to list rows.

```
Shell:          standard browser popup frame (no border-radius needed — browser clips natively)
Header:         48px / blur(20px) saturate(160%) / rgba(8,13,24,0.85) [dark]
Tab bar:        rgba(255,255,255,0.06) background / blur(8px) / border-bottom rgba(255,255,255,0.08)
Active tab:     white text + rgba(255,255,255,0.12) pill
Action panels:  lighter glass per the glass-per-surface table
```

---

### 5.8 Popup URL Panel (post-URL-Library redesign)

After the URL Library page exists (Phase 4), the popup URL tab is stripped to capture-only:

```
[ + Add Current Tab URL ]         ← sc-btn-primary
[ Add All Tabs in Window ]        ← sc-btn-secondary

Recently added (last 5, read-only):
  favicon · URL text · star toggle
  (no tag chips, no inline editors in this view)

[ Copy ] [ Export ▾ ]             ← compact export group
[ Clear All ]                     ← sc-btn-danger, right-aligned

[ Open URL Library → ]            ← ghost link, bottom — replaces all view tabs
```

Remove from popup: All / Starred / Today / By Domain view tabs; tag filter dropdown; inline tag chip editors; History panel-swap (Change Log moves to URL Library). The popup URL tab becomes a quick-capture surface, not an organizational one. Performance benefit: removes repeated IndexedDB calls, reduces DOM complexity.

Note: This redesign is **not** a new popup tab. URL Library is accessible via the "Open URL Library →" ghost link within the URL tab, and via the `sc-header-nav` on all full-page surfaces.

---

### 5.9 Empty States

Both Screenshots and URL Library surfaces require a proper empty state:

```
[SVG icon: thematic to the surface, brand blue tint]

No [noun] saved yet
[One sentence of context / CTA direction]

[+ Primary Action Button]  ← same as the command bar primary
```

Container: `sc-state-empty` (existing class, add content inside it).

---

## 6. Master Step-by-Step Implementation Plan

Each phase has an explicit **Figma gate**: no code work in that phase begins until the Figma designs for that phase are complete, reviewed, and approved.

---

### PHASE 0 — Figma Rebuild (prerequisite for everything)

> **Figma gate:** ALL design work below must be completed and approved in Figma before any code in any subsequent phase is touched. This is the single source of truth establishment step.

**0-A: Update the Figma UI Kit**

| Step  | Action                                                                                                                        |
| ----- | ----------------------------------------------------------------------------------------------------------------------------- |
| 0-A-1 | Update colour styles: dark mode surface tokens (Surface-1 through Surface-4), light mode surface tokens, border tokens        |
| 0-A-2 | Update border radius styles: xs=5, sm=10, md=14, lg=18, xl=24                                                                 |
| 0-A-3 | Update elevation/shadow styles: all four elevation levels, dark mode overrides                                                |
| 0-A-4 | Update typography styles: header title tracking (-0.01em), filter label style (10px/600/uppercase/0.07em), badge weight (700) |
| 0-A-5 | Add glass component variants: standard panel, header glass, popup header glass, modal glass, dropdown glass                   |
| 0-A-6 | Add `--sc-glass-*` token documentation to the token page                                                                      |
| 0-A-7 | Update primary button component: gradient overlay + bottom border + grounding shadow                                          |
| 0-A-8 | Update nav pill component: active (frosted pill) + inactive + hover states                                                    |
| 0-A-9 | Update count badge component: brand blue tint treatment for dark header                                                       |

**0-B: Redesign all full-page headers**

| Step  | Action                                                                                                                                                                                        |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0-B-1 | Screenshots header: apply glass dark spec, move nav to position 2 (centre), confirm `header-actions` DOM contract; rename nav link "History" → "Screenshots"                                  |
| 0-B-2 | URL Library header: apply glass dark spec, confirm nav is position 2, confirm `header-actions` is empty (actions move to command bar)                                                         |
| 0-B-3 | Preview header: design `sc-header-nav` into Preview for the first time; design `← Back` ghost button; consolidate Save actions into `[Save ▾]` split-button                                   |
| 0-B-4 | Popup header: apply popup glass spec (blur(20px), constrained opacity)                                                                                                                        |
| 0-B-5 | Settings header: apply glass dark spec and nav contract. Settings is the fourth surface that receives DS 2.0 token migration — it must be redesigned in Figma at the same time, not deferred. |

**0-C: Redesign structural UX surfaces**

| Step  | Action                                                                                                                                                                                                                                                         |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0-C-1 | URL Library command bar: `[+ Add Current Tab]` (primary), `[Add All Tabs]` (secondary), `[Export ▾]` (secondary — Copy/TXT/CSV/Email/Restore inside), `[Clear All]` (danger, far right)                                                                        |
| 0-C-2 | Screenshots command bar: `[Bulk Select]` (ghost), `[Clear All]` (danger, far right)                                                                                                                                                                            |
| 0-C-3 | URL Library tab bar: remove Change Log tab, add `[↗ Change Log]` ghost link right-aligned                                                                                                                                                                      |
| 0-C-4 | URL Library selection bar: design hidden/contextual-only state (appears only when ≥1 selected); design visible state                                                                                                                                           |
| 0-C-5 | URL Library filters: replace plain domain `<input>` with combobox matching Screenshots filter                                                                                                                                                                  |
| 0-C-6 | Profile Usage pills: design Pro-gated version (shows only pills with count > 0); confirm Basic tier renders this row hidden                                                                                                                                    |
| 0-C-7 | URL Notes UI: design note icon on URL rows (inactive/active states), inline 140-char text field expansion, Escape/blur cancel behaviour. This is the first-ever UI for the existing IndexedDB `note` field.                                                    |
| 0-C-8 | Popup URL panel redesign: strip to capture-only layout with "Open URL Library →" ghost link. Remove all view tabs, tag filter, and inline editors from popup. Design both states: current (before URL Library page) and future (after URL Library page ships). |

> **URL Library Architecture Decisions (baked in — not open):**
>
> - URL Library page is accessible to **all tiers including Basic** (Basic sees Add / All view / open / remove; Pro/Ultra see tabs, tags, bulk actions, notes).
> - Popup URL tab **retains capture actions** for all tiers (Add Current Tab, Add All Tabs). It does NOT become capture-only immediately; it adds an "Open URL Library →" entry point and the view tabs are removed after the URL Library page ships.
> - URL Change Log lives as a **ghost link** in the URL Library page (QW-04 / §5.2 spec). It is not removed.
> - URL Library is **not** a third tab in the popup header. It is accessible via the "Open URL Library →" link in the popup URL tab, and via `sc-header-nav` on all full-page surfaces.

**0-D: Redesign card and list surfaces**

| Step  | Action                                                                                                            |
| ----- | ----------------------------------------------------------------------------------------------------------------- |
| 0-D-1 | Screenshot card resting state: 14px radius, no visible border (dark), elevation-2 shadow                          |
| 0-D-2 | Screenshot card hover state: `translateY(-3px)`, overlay with centred icon actions, metadata below always visible |
| 0-D-3 | Screenshot card selection state: checkbox + brand blue bottom border + tinted background                          |
| 0-D-4 | URL Library row: add favicon slot; design tier-density variants (44px/40px/36px)                                  |
| 0-D-5 | Empty states: Screenshots and URL Library — icon + headline + CTA                                                 |

**0-E: Design tier density variants**

| Step  | Action                                                                                        |
| ----- | --------------------------------------------------------------------------------------------- |
| 0-E-1 | Document Basic tier at comfortable density (44px controls, card stagger ON, 0.12 accent tint) |
| 0-E-2 | Document Pro tier at standard density (40px controls, card stagger ON, 0.08 accent tint)      |
| 0-E-3 | Document Ultra tier at compact density (36px controls, card stagger OFF, 0.06 accent tint)    |

**0-F: Review and approval gate**

All Figma frames reviewed by stakeholders. No phase 1 work begins until this sign-off is recorded.

Surfaces covered: Screenshots · URL Library · Preview · Settings · Popup. Onboarding (`onboarding.html`) is out of scope for this design overhaul — it is a one-time first-run flow and carries low visual risk; it inherits token changes automatically from `src/shared/ui.css`.

---

### PHASE 1 — Quick Wins: Visual + UX (v1.10, CSS/HTML only)

> **Figma gate:** Phase 0-A (token styles), 0-B-1/0-B-2 (page headers), 0-C-1 through 0-C-5 (structural UX), and 0-D-1 through 0-D-2 (card resting + hover) must be complete and approved in Figma before phase 1 code begins.

These changes require no JS logic changes, no data model changes, and no behaviour changes. Each is independently deployable and covered by snapshot tests.

| ID        | Change                                                                                                                                                                                         | Source problem | Effort | Risk     |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------ | -------- |
| **QW-01** | Normalise header DOM: `sc-header-nav` always second child of `<header>`; page actions only in `header-actions` div                                                                             | P-01           | XS     | Low      |
| **QW-02** | Collapse 8-button URL Library action row → 3 groups (Add primary · Export ▾ dropdown · Clear All danger)                                                                                       | P-02, P-03     | S      | Low      |
| **QW-03** | Selection bar: hidden by default, revealed only when ≥1 item selected or Select mode toggled. _Note: requires a JS class toggle to show/hide based on selection count — this is not CSS-only._ | P-08           | S      | Very low |
| **QW-04** | Move Change Log out of tabs to right-aligned ghost link `[↗ Change Log]`                                                                                                                       | P-09           | XS     | Very low |
| **QW-05** | Count badge: labelled format `{N} screenshots` / `{N} URLs`; loading shimmer before data arrives                                                                                               | P-04           | XS     | Very low |
| **QW-06** | URL Library domain filter: replace plain `<input>` with combobox matching Screenshots filter                                                                                                   | P-05           | S      | Low      |
| **QW-07** | Profile Usage row: hidden for Basic tier; Pro/Ultra shows only pills with count > 0                                                                                                            | P-06           | XS     | Very low |
| **QW-08** | Capitalisation: standardise to `Clear All` (title case) across all surfaces                                                                                                                    | P-10           | XS     | Zero     |
| **V-01**  | Dark glass header: replace `--sc-header-grad` with `rgba(8,13,24,0.80)` + `backdrop-filter: blur(24px)`                                                                                        | V-diag-01      | XS     | Low      |
| **V-02**  | Page background: `--sc-color-bg: #f2f3f5` (light) / `#080d18` (dark); remove cold blue-grey                                                                                                    | V-diag-02      | XS     | Very low |
| **V-04a** | Border radius: `--sc-radius-md: 14px`, `--sc-radius-sm: 10px`, `--sc-radius-xs: 5px`                                                                                                           | V-diag-05      | XS     | Low      |
| **V-06**  | Typography: header title `font-weight: 700; letter-spacing: -0.01em`; filter labels uppercase/tracked                                                                                          | V-diag-04      | S      | Low      |
| **V-08**  | Active nav: frosted pill `rgba(255,255,255,0.10)` + `border: 1px solid rgba(255,255,255,0.16)`                                                                                                 | V-diag-01      | S      | Very low |
| **V-10**  | Primary button: inner gradient + bottom border + `box-shadow`; `:active` `translateY(1px)`                                                                                                     | —              | S      | Low      |

**Bug and WCAG fixes (Phase 1 — ship alongside Quick Wins):**

> **Pre-completed note (confirmed 2026-03-13):** BF-01 through BF-04 were completed in Sprint 2A/2B/2C prior to this plan being written — confirmed by ADR 0012, ADR 0011, and `docs/implementation-plan-url-library-v2.0.md`. Before Phase 1 code work begins, verify each item against the live codebase. If confirmed present, these items become a **Figma documentation and snapshot baseline step only** — ensure Figma reflects the shipped state — not a fresh code implementation.

| ID        | Change                                                                                                                                                                                                                                                                                                                  | Source                   | Effort | Risk     |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ------ | -------- |
| **BF-01** | "History" naming: rename Screenshots nav link "History" → "Screenshots"; rename popup URL Change Log button "History" → "Change Log"; rename `urlsHistoryView` → `urlChangeLogView`, `urlHistoryListEl` → `urlChangeLogListEl`; update all related microcopy toasts. _(Likely pre-completed — Sprint 2C per ADR 0012.)_ | P-11, pm-findings REC-03 | S      | Low      |
| **BF-02** | URL Change Log panel: add Escape key handler to return to main URL view and restore focus. Required for WCAG 2.2 AA on a currently shipped surface. _(Likely pre-completed — B-02 per implementation plan.)_                                                                                                            | pm-findings REC-07       | XS     | Very low |
| **BF-03** | URL remove flow: call `removeUrlRecordMetadata(url)` after `mutateUrls()` for REMOVE*ONE action. Prevents orphaned IndexedDB records accumulating for deleted URLs. One-line fix — function already exists in `url-repo.js`. *(Likely pre-completed — B-01 per implementation plan.)\_                                  | pm-findings REC-06       | XS     | Very low |
| **BF-04** | `capabilities.js`: add `'url_bulk_actions'` to `PRO_FEATURES` array before URL Bulk Actions ship. Without this, bulk actions render for all tiers including Basic, violating the tier visibility contract. _(Likely pre-completed — B-03 per implementation plan.)_                                                     | pm-findings REC-08       | XS     | Very low |

> **Phase 1 CSS/token clarification:** V-01, V-02, V-04a update token values directly in `src/shared/ui.css` (e.g. `--sc-color-bg: #f2f3f5`; `--sc-radius-md: 14px`). Phase 2 (DS 2.0 Sprint 1) extends and confirms the full token set — it does not re-do Phase 1 work. There is no double-build. Phase 1 may use raw CSS values for backdrop-filter on the header (since `--sc-glass-*` tokens are not yet defined); Phase 2 refactors those raw values into the token group.

**Post-phase 1:** Update snapshot test baselines for all intentional visual changes (V-01 through V-04a, V-08, BF-01). Run `npm run test:docs-policy` to confirm help content parity. ~~Update `docs/ui-handoff.md` with the 6 design principles from §3.2~~ — **done 2026-03-13** (completed during housekeeping pass ahead of Phase 1).

---

### PHASE 2 — DS 2.0 Sprint 1: Token Layer

> **Figma gate:** Phase 0-A (full token styles update), 0-D (all card states), and 0-E (all tier variants) must be complete and approved in Figma before phase 2 code begins.
>
> **Roadmap gate:** This is the DS 2.0 Sprint 1 prerequisite. No v2.0 feature work begins until this sprint is complete (per ADR 0010).

| Step     | Action                                                                                                                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **T-01** | Update `--sc-radius-*` tokens (5/10/14/18/24/999) in `src/shared/ui.css`                                                                                                                                |
| **T-02** | Update `--sc-elevation-*` tokens (layered neutral shadows; dark mode overrides)                                                                                                                         |
| **T-03** | Update `--sc-color-bg` and `--sc-color-surface-{1..4}` for both light and dark modes                                                                                                                    |
| **T-04** | Replace `--sc-header-grad` with dark glass header token group                                                                                                                                           |
| **T-05** | Add `--sc-glass-*` custom property group (`blur-sm`, `blur-md`, `blur-lg`, `solid-dark`, `solid-light`)                                                                                                 |
| **T-06** | Add tier density tokens: `body[data-tier='basic']`, `body[data-tier='pro']`, `body[data-tier='ultra']` rules                                                                                            |
| **T-07** | Establish visual regression snapshot baseline — all subsequent work snapshots against this baseline                                                                                                     |
| **T-08** | Apply density tokens (`--sc-density-comfortable/default/compact`) and `body[data-tier]` rules. Confirm `--tier-density` is consumed by `.sc-btn-md`, `.url-row`, and other height-sensitive components. |

> **DS 2.0 four-surface scope (from roadmap):** Token migration covers popup, history (Screenshots), preview, AND options (Settings). All four must be migrated in Sprint 1. Settings is not optional. Token changes in `src/shared/ui.css` propagate to Settings automatically via the token architecture, but Settings-specific aliases (`--options-*` or similar) must be verified.

---

### PHASE 3 — DS 2.0 Sprint 2: Component Application + Glass

> **Figma gate:** Phase 0-B (all headers), 0-C (all command bars and structural UX), 0-D (all card and list states), and 0-E (tier density variants) must be complete and approved in Figma before phase 3 code begins.

| Step     | Action                                                                                              |
| -------- | --------------------------------------------------------------------------------------------------- |
| **C-01** | Apply glass to `sc-header` on all full-page surfaces (Screenshots, URL Library, Preview, Settings)  |
| **C-02** | Apply glass to popup header and popup panel treatment                                               |
| **C-03** | Apply glass to `sc-modal` and dropdown/tooltip components                                           |
| **C-04** | Apply card hover overlay system to screenshot grid (V-05)                                           |
| **C-05** | Apply elevation system (`--sc-elevation-2` resting, `--sc-elevation-3` hover) to all cards          |
| **C-06** | Apply radius scale to all card, button, and input components (if not already done in Phase 1)       |
| **C-07** | Ship four roadmap animations: capture pulse, success shimmer, queue sweep, palette entrance         |
| **C-08** | Ship supplemental animations: card entrance stagger, glass panel appear/dismiss, button press depth |
| **C-09** | Apply tier density signals via `body[data-tier]` attribute across all surfaces                      |
| **C-10** | Add `prefers-reduced-motion: reduce` fallback to all glass and animation rules                      |
| **C-11** | Validate `--sc-focus-glow` reinforcement on dark glass surfaces                                     |

---

### PHASE 4 — DS 2.0 Sprint 2 (continued): Structural UX Fixes

> **Figma gate:** Phase 0-B-3 (Preview header redesign), 0-C-1 through 0-C-8 (all command bars, structural changes, URL Notes, popup panel redesign) must be complete and approved in Figma before phase 4 code begins.

These changes require the shared token layer from Phase 2 as a dependency.

> **DS 2.0 scope boundary note:** The roadmap explicitly says DS 2.0 Sprint 1 does not include IA or navigation redesign — those decisions come from the Post-Milestone Full Assessment. Phase 4 items are treated as **shared DS 2.0 component additions** (sc-command-bar, sc-filter-bar are reusable components, not IA restructures) and **long-standing UX fixes** (Preview nav, popup URL panel), not as a navigation or IA redesign. If the Post-Milestone Assessment later reveals that the command bar or filter bar are architecturally wrong, they can be revised in v2.1. The decision to proceed here rather than waiting for v2.1 is explicit and logged.

| ID       | Change                                                                                                                                                                                                                                                                                                                                                                                            | Source problem           |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| **S-01** | Introduce `sc-command-bar` component: one-row band below header, present on all full-page surfaces                                                                                                                                                                                                                                                                                                | P-02                     |
| **S-02** | Introduce `sc-filter-bar` shared component: consistent control heights, labels, gaps, breakpoint collapse                                                                                                                                                                                                                                                                                         | P-05                     |
| **S-03** | Preview: integrate `sc-header-nav`; consolidate toolbar (Save ▾ split-button, Preset ▾ dropdown); replace floating left sidebar with slide-in edit panel                                                                                                                                                                                                                                          | P-01 (Preview), P-07     |
| **S-04** | Domain favicons in URL Library rows via Chrome favicon service (V-07)                                                                                                                                                                                                                                                                                                                             | V-diag-06 (partial)      |
| **S-05** | Empty state content: icon + headline + CTA in `sc-state-empty` on all surfaces (V-09)                                                                                                                                                                                                                                                                                                             | —                        |
| **S-06** | Pro-tier filter alignment: Screenshots Profile filter and URL Library Tag filter use same `sc-select` control, same position after domain input, same Pro-gate rendering pattern                                                                                                                                                                                                                  | P-05, P-01               |
| **S-07** | Popup URL panel redesign: strip to capture-only with "Open URL Library →" ghost link; remove view tabs, tag filter, inline editors, History panel-swap. Requires URL Library page (S-01 scaffold) to ship first. _(Code pre-completed — Sprint 2A/2C per ADR 0011/roadmap; Phase 4 work is Figma design + visual system application.)_                                                            | P-12, pm-findings REC-02 |
| **S-08** | URL Notes UI: implement note icon on URL Library rows (inactive/active states), inline 140-char text field, Escape cancel, blur save. First-ever UI for the existing `note` field in `url_meta` IndexedDB store. _(Code pre-completed — Sprint 2B-02 per implementation plan; Phase 4 work is Figma design + DS 2.0 visual treatment application. Verify against live codebase before starting.)_ | P-13, pm-findings REC-05 |

---

## 7. Summary: What Changes and What Does Not

### What this plan changes

Across all four phases, this plan delivers:

**UX consistency (Phase 1 + Phase 3–4)**

- A unified header contract across all four surfaces (popup, Screenshots, URL Library, Preview, Settings)
- Navigation always second child of `<header>` — the same DOM position on every surface
- Bulk-selection UI hidden at rest, visible only when at least one item is checked (Screenshots + URL Library)
- A clean `sc-command-bar` band replacing the 8-button URL Library action row
- A consistent `sc-filter-bar` component across all surfaces that have filters
- Proper empty and loading states on every surface

**Visual identity uplift (Phase 1 + Phase 2)**

- A visual identity that reads as a premium power-user tool rather than a generic Chrome extension
- A complete dark-default glass visual system (glass morphism on sticky/fixed/floating elements only) with solid light-mode support
- Semantic shadow tokens — layered neutral shadows, never blue-tinted; correct dark-mode overrides
- Three distinct tier density experiences (Basic 44 px / Pro 40 px / Ultra 36 px) from one component tree
- A screenshot gallery that shows clean cards at rest and reveals actions only on hover

**Naming and information architecture**

- Resolution of the "History" naming collision across all three meanings: nav link → "Screenshots", popup footer button → "Change Log", URL Library heading language corrected (P-11)
- A focused popup — capture actions only, with an "Open URL Library →" ghost link; browsing, inline editing, and panel-swap removed from the popup frame (P-12, S-07)
- URL Library is Basic-tier and above; popup retains full capture actions for all tiers; Change Log = ghost link in URL Library; URL Library is a dedicated page, not a popup tab

**Net-new UI for existing data (Phase 4)**

- URL Notes UI — note icon on URL Library rows (inactive/active states), inline 140-char text field, first-ever UI surface for the existing `note` field in the `url_meta` IndexedDB store (P-13, S-08)

**WCAG 2.2 AA and keyboard gaps closed (Phase 1)**

- Escape key dismiss on the URL Change Log panel (BF-02)

**Engineering bug fixes baked into Phase 1**

- `url_bulk_actions` added to `capabilities.js` PRO_FEATURES array (BF-03)
- `removeUrlRecordMetadata()` called in the URL remove flow to prevent orphaned IndexedDB metadata (BF-04)
- Correct `prefers-reduced-motion` solid fallback on all glass surfaces — no motion unless user has no preference (BF-01)

### What this plan does not change

- All capture flows, export logic, and underlying data models are untouched (the URL Notes data model already exists — this plan only adds a UI surface for it)
- Tier gating rules are untouched — tiers remain a UX complexity preference, not a paywall (ADR 0009)
- The roadmap sequence is respected: DS 2.0 token migration gates all v2.0 feature work (ADR 0010)
- Token names do not change — values update, names stay stable
- Token name stability: Phase 1 updates existing token values; Phase 2 extends the set; names never regress
- The extension remains free, local-only, with no external connections, and no user tracking
- Onboarding flows are out of scope for this plan

---

## 8. Document Index

This master plan supersedes the three source documents it was built from:

- `docs/ux-consistency-audit-2026-03-13.md`
- `docs/visual-design-uplift-2026-03-13.md`
- `docs/visual-system-direction-2026-03-13.md`

The source documents remain on disk as audit history. This document is the active implementation reference going forward.

**Related documents:**

- `docs/ui-handoff.md` — change policy and Figma node index (must be updated post-Phase 1 with the 6 design principles from §3.2)
- `docs/thecollector-2.0-90-day-roadmap.md` — phase sequencing source of truth
- `docs/dev-workflow.md` — local checks, smoke flow, packaging, and release policy
- `docs/pm-findings-url-library-2026-03-12.md` — URL Library PM audit; P-11/P-12/P-13 and BF-01–BF-04 in this plan originate from that document
- `src/shared/ui.css` — token implementation target

---

_Last updated: 2026-03-13 (housekeeping pass: BF-01–04 and S-07/S-08 pre-completed notes added; post-phase 1 gate updated). All design decisions require Figma-first implementation per `docs/ui-handoff.md` change policy._
