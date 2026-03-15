# Visual System Direction — THE Collector v2.0

**Date:** 2026-03-13
**Author:** Principal UX/UI Designer
**Status:** Design direction — Figma-first, implement after DS 2.0 Sprint 1
**Aesthetic:** Apple/iOS glass · Linear precision · dark default

---

## Design Intention

The target is a **dark-default, glass-layered, expressive-radius** visual system that serves two distinct audiences without forking the design language:

- **Basic (B2C):** Approachable, warm, individual power-user. A tool that feels personal and polished.
- **Pro / Ultra (B2B):** Dense, neutral, workspace-grade. A tool that signals professional control.

Both share the same component system, token layer, and glass vocabulary. The difference is expressed through subtle density, temperature, and decoration signals — not a separate visual identity.

The closest existing reference: **macOS Sequoia in dark mode** — frosted sidebars, precise typography, glass panels behind scrolling content, functional animations that never perform.

---

## 1. Colour System

### 1.1 Dark mode (default)

The page is deep near-black navy. Glass surfaces float above it. Brand blue is used as a precision accent — never as a fill.

```
Page base:        #080d18   ← near-black navy, not pure black
Surface-1:        rgba(255,255,255,0.04)  ← darkest glass panel (cards)
Surface-2:        rgba(255,255,255,0.06)  ← standard glass panel
Surface-3:        rgba(255,255,255,0.09)  ← elevated glass (modals, hover)
Surface-4:        rgba(255,255,255,0.12)  ← highest glass (header, active panel)

Glass border:     rgba(255,255,255,0.09)  ← defines the glass edge
Glass border hi:  rgba(255,255,255,0.15)  ← active/hover glass edge
```

**Update to existing tokens:**

```css
/* Dark mode token updates in :root[data-theme='dark'] */
--sc-color-bg: #080d18;
--sc-color-surface-1: rgba(255, 255, 255, 0.04);
--sc-color-surface-2: rgba(255, 255, 255, 0.06);
--sc-color-surface-3: rgba(255, 255, 255, 0.09);
--sc-color-surface-4: rgba(255, 255, 255, 0.12);
--sc-color-border: rgba(255, 255, 255, 0.09);
--sc-color-border-strong: rgba(255, 255, 255, 0.15);
```

### 1.2 Light mode (secondary)

Glass over warm near-white. The frosted effect reads distinctly lighter and more editorial than dark mode — closer to iPadOS in light theme.

```
Page base:        #f2f3f5   ← warm near-neutral (not blue-grey)
Surface-1:        rgba(255,255,255,0.70)  ← cards
Surface-2:        rgba(255,255,255,0.80)  ← elevated panels
Surface-3:        rgba(255,255,255,0.85)  ← modals, overlays
Surface-4:        rgba(255,255,255,0.90)  ← header, highest layer

Glass border:     rgba(0,0,0,0.07)
Glass border hi:  rgba(0,0,0,0.12)
```

**Update to existing tokens:**

```css
/* Light mode token updates in :root (default) */
--sc-color-bg: #f2f3f5;
--sc-color-surface-1: rgba(255, 255, 255, 0.7);
--sc-color-surface-2: rgba(255, 255, 255, 0.8);
--sc-color-surface-3: rgba(255, 255, 255, 0.85);
--sc-color-surface-4: rgba(255, 255, 255, 0.9);
```

### 1.3 Brand blue: accent only

`#1976d2` stays. It stops filling the header. It becomes the precision accent for:

- Interactive element focus rings
- Active/selected state backgrounds (`rgba(25,118,210,0.15)` tint)
- Primary buttons (the only filled brand-colour surface)
- Count badges and pills
- Link text and active nav indicators
- Progress indicators and capture state pulse

**Nowhere else.** The header is no longer blue. Blue appearing in the content area becomes a meaningful signal — "this is interactive, this is selected, this is brand."

### 1.4 Tier temperature signals

| Tier        | Accent warmth                         | Decoration                  | Density                     |
| ----------- | ------------------------------------- | --------------------------- | --------------------------- |
| Basic (B2C) | `rgba(25,118,210,0.12)` tint on hover | Card entrance animation ON  | Comfortable (44px controls) |
| Pro         | `rgba(25,118,210,0.08)` tint on hover | Card entrance animation ON  | Standard (40px controls)    |
| Ultra       | `rgba(25,118,210,0.06)` tint on hover | Card entrance animation OFF | Compact (36px controls)     |

Ultra users get less animation and less decoration by default — they already know the product. This is not a feature gate; it's a density preference aligned with power-user expectations.

---

## 2. Glass Specification

Glass is applied using `backdrop-filter: blur() saturate()` on semi-transparent surfaces. It requires the element to visually overlap other content to be meaningful.

### 2.1 Glass recipe

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

/* Reduced motion / accessibility fallback — REQUIRED */
@media (prefers-reduced-motion: reduce) {
  .glass-panel {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    background: var(--sc-color-surface-2); /* solid fallback */
  }
}
```

### 2.2 Glass per surface

| Surface                  | Blur                        | Background (dark)              | Background (light)             | Notes                                         |
| ------------------------ | --------------------------- | ------------------------------ | ------------------------------ | --------------------------------------------- |
| **Header (sticky)**      | `blur(24px) saturate(180%)` | `rgba(8,13,24,0.80)`           | `rgba(255,255,255,0.82)`       | Scrolling content bleeds through              |
| **Popup header**         | `blur(20px) saturate(160%)` | `rgba(8,13,24,0.85)`           | `rgba(255,255,255,0.88)`       | Constrained surface — heavier opacity         |
| **Popup panels**         | `blur(16px) saturate(150%)` | `rgba(255,255,255,0.04)`       | `rgba(255,255,255,0.65)`       | Inner sections in popup                       |
| **Modals / overlays**    | `blur(20px) saturate(160%)` | `rgba(10,15,28,0.88)`          | `rgba(255,255,255,0.85)`       | Modal backdrop is `rgba(0,0,0,0.5)` scrim     |
| **Dropdowns / tooltips** | `blur(16px) saturate(140%)` | `rgba(14,20,36,0.90)`          | `rgba(255,255,255,0.90)`       | Small surface, heavier opacity for legibility |
| **Card hover overlay**   | `blur(0px)`                 | `rgba(0,0,0,0.48)`             | `rgba(0,0,0,0.36)`             | No blur — action icons need sharp legibility  |
| **Screenshot cards**     | None                        | Solid `rgba(255,255,255,0.05)` | Solid `rgba(255,255,255,0.80)` | Too many cards for GPU — solid surfaces only  |

**Critical performance rule:** `backdrop-filter` is only applied to elements that are:

1. Sticky/fixed (header, popup header)
2. Floating above content (modals, dropdowns, tooltips)
3. A small number of elements (≤ 5 visible simultaneously)

It is **never** applied to scrolling list rows, screenshot cards in a grid, or URL Library rows. These use solid surfaces with layered shadows.

---

## 3. Border Radius Scale

The expressive radius language runs from tight (inline elements) to generous (large surfaces).

```css
/* Update --sc-radius-* tokens in :root */
--sc-radius-xs: 5px; /* inline tags, kbd hints, small badges */
--sc-radius-sm: 10px; /* buttons, inputs, select, pills */
--sc-radius-md: 14px; /* cards, panels, filter bar containers */
--sc-radius-lg: 18px; /* modals, large dropdowns, floating panels */
--sc-radius-xl: 24px; /* popup shell, onboarding cards */
--sc-radius-pill: 999px; /* nav pills, tag chips — unchanged */
```

**Card outer radius 14px + inner thumbnail radius 10px = correct optical nesting.**
The thumbnail inside the card has a slightly smaller radius than the card shell, which creates visual depth (the content is "inside" the card, not floating on top of it).

**Popup shell:** `border-radius: 24px` (only when rendered as a standalone window, not in the browser popup frame — the browser clips the popup natively, so this only matters for screenshots, prototypes, and any future standalone window mode).

---

## 4. Elevation System

Replace blue-tinted shadows with physically accurate neutral shadows, layered for depth.

```css
/* Update --sc-elevation-* tokens */
--sc-elevation-0: none;

--sc-elevation-1:
  0 1px 2px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.06); /* subtle — inputs, small panels */

--sc-elevation-2:
  0 2px 6px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(0, 0, 0, 0.08); /* default card resting state */

--sc-elevation-3:
  0 4px 12px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.1); /* card hover, active panel */

--sc-elevation-4:
  0 8px 20px rgba(0, 0, 0, 0.14), 0 16px 40px rgba(0, 0, 0, 0.12); /* modals, floating panels */
```

**Dark mode shadow adjustment:** shadows on dark surfaces need higher opacity to be visible against near-black:

```css
:root[data-theme='dark'] {
  --sc-elevation-2: 0 1px 3px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3);
  --sc-elevation-3: 0 2px 8px rgba(0, 0, 0, 0.5), 0 8px 24px rgba(0, 0, 0, 0.36);
}
```

---

## 5. Animation System

Functional only. Animations communicate state — they do not perform.

### 5.1 Token map (already in DS 2.0 — keep as-is)

```
--sc-motion-quick:  120ms   ← micro-interactions (button press, toggle)
--sc-motion-base:   180ms   ← state transitions (card entrance, filter change)
--sc-motion-slow:   240ms   ← panel/modal entrance
```

```
--sc-ease:        cubic-bezier(0.2, 0, 0, 1)       ← standard ease-out
--sc-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1) ← subtle spring (use sparingly)
```

### 5.2 The four roadmap animations (DS 2.0 Sprint 1 — unchanged)

These are already scoped in the roadmap. Implement exactly as specified:

1. **Capture start pulse:** 120ms radial glow on the capture button — signals the action fired
2. **Success shimmer:** 180ms subtle shimmer sweep across the button — confirms completion
3. **Queue progress sweep:** linear sweep, non-janky — communicates batch progress
4. **Command palette entrance:** 140ms scale + opacity — `transform: scale(0.97) → 1`, opacity 0→1

### 5.3 Additional functional animations (new with v2.0)

These are additions justified by the glass + dark system:

| Animation                 | Trigger                     | Duration                                     | Easing   | Surfaces                                               |
| ------------------------- | --------------------------- | -------------------------------------------- | -------- | ------------------------------------------------------ |
| **Page entrance**         | Surface load                | 150ms                                        | ease-out | All full pages — `opacity: 0 → 1, translateY(6px → 0)` |
| **Card entrance stagger** | Grid load                   | 180ms base + 30ms per card (max 6 staggered) | ease-out | Screenshots grid, URL Library list                     |
| **Glass panel appear**    | Dropdown/tooltip open       | 120ms                                        | ease-out | `opacity: 0 → 1, scale(0.97 → 1)`                      |
| **Glass panel dismiss**   | Dropdown/tooltip close      | 90ms                                         | ease-in  | `opacity: 1 → 0, scale(1 → 0.97)`                      |
| **Card hover reveal**     | `:hover` on screenshot card | 150ms                                        | ease-out | Action overlay fade in                                 |
| **Filter bar update**     | Filter value changes        | 120ms                                        | ease-out | List crossfade on result change                        |
| **Button press depth**    | `:active`                   | 80ms                                         | ease-in  | `translateY(1px)` — all buttons                        |

### 5.4 What does NOT animate

- Tab switching (immediate — instant visual response is faster)
- Count badge number changes (just update — no count-up animation)
- Form inputs
- Checkboxes/toggles beyond the existing system-level transitions
- Anything behind `prefers-reduced-motion: reduce`

---

## 6. Header: The Anchor Moment

The header is the highest-impact single surface. It sets the tone for the entire product.

### Specification

```
Dark mode resting:
┌─────────────────────────────────────────────────────────────────┐
│ [icon] THE Collector Screenshots  [47 screenshots]              │  ← left
│                [Screenshots]  [URLs]  [Settings]                │  ← centre
│                                        [Bulk]  [Clear All]      │  ← right
└─────────────────────────────────────────────────────────────────┘
  Background: rgba(8,13,24,0.80) + backdrop-filter: blur(24px)
  Border-bottom: 1px solid rgba(255,255,255,0.07)
  Height: 56px (up from ~48px — more breath)
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

**Nav pill — inactive state:**

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

**Count badge on dark header:**

```css
.badge {
  background: rgba(25, 118, 210, 0.3); /* brand blue tint */
  border: 1px solid rgba(25, 118, 210, 0.5);
  color: #90caf9; /* brand-accent text */
  font-size: 11px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: var(--sc-radius-pill);
  letter-spacing: 0.02em;
}
```

The count badge is the **only brand-blue element in the header.** It reads as a branded data point against the dark glass surface — a small precision accent.

---

## 7. Screenshot Card System

The card is where the product shows its quality to first-time users.

### Resting state

```
┌─────────────────────────┐
│                         │  ← rounded corners: 14px outer
│    [thumbnail image]    │  ←   10px inner radius
│                         │
├─────────────────────────┤
│  bz-berlin.de           │
│  3/13/2026 · 3004×1882  │
└─────────────────────────┘

Background: solid (no backdrop-filter on cards)
Shadow: --sc-elevation-2
Border: none in dark mode / 1px rgba(0,0,0,0.06) in light mode
```

### Hover state

```
┌─────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░ │  ← overlay: rgba(0,0,0,0.48)
│   [compare] [↗] [🗑]   │  ← 32px icon buttons, centred
│ ░░░░░░░░░░░░░░░░░░░░░░ │     (also on :focus-within)
├─────────────────────────┤
│  bz-berlin.de           │
│  3/13/2026 · 3004×1882  │  ← metadata always visible, never obscured
└─────────────────────────┘

Card: translateY(-3px) + shadow escalates to --sc-elevation-3
Transition: 180ms ease-out
```

The Compare / Open / Delete buttons become **icon-only** within the hover overlay. Text labels are retained as `aria-label` attributes. This is the standard used by Google Photos, Figma, and Notion gallery.

**Selection state (Bulk mode active):**

```
┌─────────────────────────┐
│ [✓]                     │  ← checkbox top-left, brand blue fill
│    [thumbnail image]    │
│                         │
│  ─────────────────────  │  ← bottom border: brand blue 2px
└─────────────────────────┘
  background: rgba(25,118,210,0.08)   ← subtle brand tint on selected
```

---

## 8. Popup Glass Treatment

The popup is 400px wide and height-constrained. Full glass treatment makes it feel like an iOS widget — premium but not heavy.

### Structure

```
┌────────────────────────────┐  ← popup shell: no border-radius
│ ░░░░ GLASS HEADER ░░░░░░░ │  ← blur(20px), height 48px
│ [icon] Capture  [URLs]     │
│ ─────────────────────────  │  ← 1px rgba(255,255,255,0.07) divider
│                            │
│  [glass action panel]      │  ← inner panels: lighter glass
│  ─────────────────         │
│  [glass capture controls]  │
│                            │
└────────────────────────────┘
```

**Performance constraint:** the popup renders in a tight browser frame. Limit to **two `backdrop-filter` elements maximum**: the header and one panel at a time (if a modal/overlay is open). Never apply blur to the list rows.

**Segmented tabs in popup:** the tab bar gets a glass panel treatment — `rgba(255,255,255,0.06)` background, `backdrop-filter: blur(8px)`, border-bottom `rgba(255,255,255,0.08)`. Active tab: white text + `rgba(255,255,255,0.12)` pill.

---

## 9. Tier Visual Signals

Same token system. Subtle rendering differences tied to `data-tier` attribute on `<body>`:

```css
/* Basic — B2C: warmer, more breathing room */
body[data-tier='basic'] {
  --tier-accent-tint: rgba(25, 118, 210, 0.12);
  --tier-card-anim: 1; /* card entrance stagger ON */
  --tier-density: var(--sc-density-comfortable); /* 44px */
}

/* Pro — standard workspace */
body[data-tier='pro'] {
  --tier-accent-tint: rgba(25, 118, 210, 0.08);
  --tier-card-anim: 1; /* card entrance stagger ON */
  --tier-density: var(--sc-density-default); /* 40px */
}

/* Ultra — power workspace */
body[data-tier='ultra'] {
  --tier-accent-tint: rgba(25, 118, 210, 0.06);
  --tier-card-anim: 0; /* stagger OFF — they know the product */
  --tier-density: var(--sc-density-compact); /* 32px */
}
```

The card entrance stagger is toggled via CSS:

```css
.history-card {
  animation: card-in calc(var(--tier-card-anim) * 180ms) ease-out both;
}
```

When `--tier-card-anim: 0`, `calc(0 * 180ms) = 0ms` → animation effectively disabled.

This gives Ultra users a faster, denser, no-ceremony experience without creating a separate component tree.

---

## 10. Accessibility Guardrails

All glass and animation decisions must respect these non-negotiable rules:

1. **`prefers-reduced-motion: reduce`** — all transitions become `0ms`, all `backdrop-filter` values are replaced with solid surface fallbacks. This is a WCAG 2.2 AA requirement already in the roadmap.

2. **Minimum contrast on glass:** Text on glass surfaces must meet 4.5:1 contrast ratio. The dark glass header with `rgba(255,255,255,0.90)` title text = ~15:1. Muted nav link text `rgba(255,255,255,0.55)` = ~6:1 on the dark header. Both pass.

3. **Glass-to-focus-ring coordination:** The `--sc-focus-glow` ring must be visible against glass surfaces. On dark glass, the current `rgba(100,181,246,0.22)` glow may need reinforcement — increase to `rgba(100,181,246,0.40)` in dark mode.

4. **No animations on critical state feedback** — success/error states communicate via colour and icon, never via animation alone. The 180ms shimmer is decorative on top of the state change, not the state change itself.

---

## 11. Implementation Sequence

### DS 2.0 Sprint 1 — Token layer (prerequisite for everything)

1. Update `--sc-radius-*` tokens (14/10/5/18/24/999)
2. Update `--sc-elevation-*` tokens (layered neutral shadows)
3. Update `--sc-color-bg` and `--sc-color-surface-{1..4}` for both modes
4. Update `--sc-header-grad` → dark glass header specification
5. Add `--sc-glass-*` custom property group for blur/saturation values:
   ```css
   --sc-glass-blur-sm: blur(12px) saturate(140%);
   --sc-glass-blur-md: blur(20px) saturate(160%);
   --sc-glass-blur-lg: blur(24px) saturate(180%);
   --sc-glass-solid-dark: rgba(8, 13, 24, 0.8);
   --sc-glass-solid-light: rgba(255, 255, 255, 0.8);
   ```
6. Add tier density tokens (`body[data-tier]` rules)
7. Establish visual regression baseline — **all subsequent work snapshots against this baseline**

### DS 2.0 Sprint 2 — Component application

8. Apply glass to `sc-header` and popup header
9. Apply glass to `sc-modal` and dropdown components
10. Apply card hover overlay system to screenshot grid
11. Apply radius scale to all card/button/input components
12. Apply elevation system to cards and panels
13. Ship the four roadmap animations (capture pulse, success shimmer, queue sweep, palette entrance)
14. Ship supplemental animations (card entrance stagger, glass panel appear/dismiss, button press depth)
15. Apply tier density signals via `body[data-tier]` attribute

### Popup glass — concurrent with Sprint 2

16. Apply glass header to popup
17. Apply glass panel treatment to popup segmented tabs and action blocks

---

## What This System Looks Like

When complete:

- Opening the extension feels like opening a macOS panel — the header is frosted glass, the brand icon sits on it cleanly, the nav pills are subtle and precise
- The screenshot grid has clean cards that float with real shadows — no borders, no blue-tinted glow. Hover reveals the actions from within a translucent overlay
- Dropdowns and tooltips are small glass panels that appear with a fast 120ms scale animation
- Brand blue appears only where it matters: the primary button, active nav indicator, count badge, and selection state. Its scarcity makes every appearance meaningful
- Ultra users see a slightly denser, quieter version of the same product — no entrance animations, more compact controls. It feels like a professional workspace rather than a consumer app

---

_All changes go to Figma first (per `docs/ui-handoff.md` change policy). Token updates are applied in `src/shared/ui.css` only — surface layers consume them automatically via aliases._
