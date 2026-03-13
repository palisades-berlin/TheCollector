# Visual Design Uplift — THE Collector
**Date:** 2026-03-13
**Author:** Principal UX/UI Designer
**Scope:** Why it looks cheap, and what to fix — ordered by visual impact
**Token system:** `src/shared/ui.css` (DS 2.0 semantic layer already in place — use it)

---

## Why It Looks Cheap Right Now

The token system is solid. The font (Poppins) is a good choice. The colour vocabulary exists. The problem is not the raw ingredients — it's how they're assembled. Six specific compounding issues create the "developer prototype" reading:

### Issue 1 — The header gradient is a visual cliché

```css
/* Current */
--sc-header-grad: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
```

This is the **standard 2016 Material Design blue gradient** — recognisable as the default for thousands of Chrome extensions, admin dashboards, and internal tools. It is not wrong, but it signals "generic app" immediately. The brand is stronger than this gradient suggests.

### Issue 2 — The page background is blue-tinted grey

```css
--sc-color-bg: #f0f4f8;
```

`#f0f4f8` is a cold blue-grey that reads as a legacy enterprise dashboard. It makes the white cards feel blue-tinged rather than clean. The effect is that the entire page has a subtle institutional coldness.

### Issue 3 — Card elevation is nearly invisible

```css
--sc-elevation-4: 0 4px 16px rgba(25, 118, 210, 0.12);  /* card shadow */
--sc-color-border-card: #ecf1f6;                          /* card border */
```

A blue-tinted shadow at 12% opacity, combined with a very light border, produces a card that barely lifts off the background. Cards need to breathe and float. The current treatment makes the screenshot grid read as a flat grid of bordered boxes rather than a gallery of lifted items.

### Issue 4 — Typography has no weight contrast

The type scale is: `18px / 15px / 13px / 11px`. The range is 7px across four levels. This compression means there is no typographic moment that commands authority — everything reads at roughly the same visual weight. Premium tools use contrast, not compression.

The header title (`font-size: 15px; font-weight: 600; letter-spacing: 0.3px`) is not large or authoritative enough to anchor the page. It reads as a label, not a product name.

### Issue 5 — Border radius feels dated

```css
--sc-r-sm: var(--sc-radius-xs);  /* = 4px */
--sc-r-md: var(--sc-radius-md);  /* = 8px */
```

`--sc-r-sm` resolves to 4px — very sharp. 8px on cards was standard in 2020-2022. In 2025-2026, premium products (Linear, Vercel, Arc, Raycast) use 10–12px on cards and components, with tighter corners reserved for inline elements only. The current treatment makes every surface look slightly boxy.

### Issue 6 — Screenshot card hover state is visually inert

The cards in the grid have Compare/Open/Delete buttons rendered **always visible** below the thumbnail. This means the grid constantly shows 3 buttons per card, regardless of intent. Premium gallery interfaces (Google Photos, Notion gallery, Figma) hide per-item actions until hover, creating a clean resting state and a purposeful interaction moment on hover.

---

## Solutions: Highest Impact First

---

### V-01 — Replace the header gradient with a dark premium surface

**Impact:** The single biggest visual improvement available. ★★★★★
**Effort:** XS — two token value changes
**Risk:** Low — requires snapshot test updates only

The strongest signal of a premium power-user tool is a **dark header against a light content area**. This is the pattern used by Linear, Vercel dashboard, Zed, Clerk, Liveblocks, and Arc. It immediately reads as a professional tool, not a template.

Proposed header surface token:

```css
/* In :root — replace --sc-header-grad */
--sc-header-grad: linear-gradient(160deg, #0f1c35 0%, #0a1628 100%);

/* Optional: add a bottom border for definition */
/* .sc-header: border-bottom: 1px solid rgba(255,255,255,0.07); */
```

The brand blue (`#1976d2`) does not disappear — it becomes the accent colour used throughout the content area: active nav indicators, primary buttons, filter focus rings, selected states, the count badge. This is more sophisticated than filling the header with it.

**What changes on-screen:**
- Header: deep navy, not blue gradient. Brand icon and title read clearly at full white opacity.
- Nav links: unchanged (already use `--sc-color-on-brand-high`)
- Count badge: add a subtle brand-blue tint: `background: rgba(25, 118, 210, 0.25)` — it becomes a small brand accent dot in the dark header
- Header action buttons (`btn-clear`): the existing on-brand border treatment works well on the dark surface without changes

**Dark mode:** the dark mode token `--sc-header-grad: linear-gradient(135deg, #0f3d7c 0%, #0a2d63 100%)` can also deepen to `linear-gradient(160deg, #080f1c 0%, #060c18 100%)` for a cohesive feel.

---

### V-02 — Warm and lighten the page background

**Impact:** Removes the institutional coldness. ★★★★☆
**Effort:** XS — one token change
**Risk:** Very low

```css
/* Current */
--sc-color-bg: #f0f4f8;   /* cold blue-grey */

/* Proposed */
--sc-color-bg: #f5f6f8;   /* near-neutral, very slightly warm */
```

The difference is subtle but perceptible: the current value is noticeably blue-tinted; `#f5f6f8` is closer to neutral, making white cards read as genuinely white rather than slightly blue-white. This also makes the brand blue pop more distinctly when it appears in interactive elements.

For the card surface, ensure `--sc-color-surface-1: #ffffff` (already set — good). The contrast between `#f5f6f8` background and `#ffffff` cards is clean and clear.

---

### V-03 — Increase card elevation and remove the visible border

**Impact:** Cards go from flat boxes to floating items. ★★★★☆
**Effort:** S — token + CSS update
**Risk:** Low — visual only, no behaviour change

**Screenshot card resting state:**

```css
/* Current */
--sc-elevation-4: 0 4px 16px rgba(25, 118, 210, 0.12);   /* blue-tinted, too subtle */

/* Proposed — replace with layered neutral shadow */
--sc-elevation-4:
  0 1px 3px rgba(0, 0, 0, 0.07),
  0 4px 12px rgba(0, 0, 0, 0.07);
```

Layered shadows (one tight, one spread) produce a more physically believable elevation than a single shadow. Remove the coloured tint — neutral black shadows work in both light and dark themes without needing overrides.

**Remove the card border in resting state:** The `--sc-color-border-card: #ecf1f6` border adds visual noise without adding definition when a proper shadow is present. The border can stay for accessibility/high-contrast environments but should be `rgba(0,0,0,0)` in the default light theme.

**Screenshot card hover state:**

```css
/* Proposed */
.history-card:hover {
  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.09),
    0 8px 24px rgba(0, 0, 0, 0.11);
  transform: translateY(-2px);   /* --sc-lift-y: -2px already defined */
}
```

The combination of shadow growth + 2px lift is a satisfying, premium hover signal. The transition uses the existing `--sc-t-mid: 180ms` token — no new values needed.

---

### V-04 — Increase card and component border radius

**Impact:** Modernises every component on screen. ★★★★☆
**Effort:** S — token value changes
**Risk:** Low — purely cosmetic

```css
/* Current */
--sc-radius-md: 8px;    /* used on cards */
--sc-radius-sm: 6px;    /* used on buttons */
--sc-radius-xs: 4px;    /* used as --sc-r-sm */

/* Proposed */
--sc-radius-md: 10px;   /* cards, modals, dropdowns */
--sc-radius-sm: 7px;    /* buttons, inputs, pills */
--sc-radius-xs: 4px;    /* keep — inline tags, badges */
```

`8px → 10px` on cards is the difference between "dated flat design" and "2025 premium app". This single change affects every card surface simultaneously via the token system.

**Screenshot thumbnail frame:** add `border-radius: 6px; overflow: hidden` to the thumbnail image container specifically, creating a tighter inner corner that frames the screenshot as a proper image item (not a raw image dump).

---

### V-05 — Hover-reveal card actions for the screenshot grid

**Impact:** Grid transforms from a busy button matrix to a clean gallery. ★★★★☆
**Effort:** M — CSS + small HTML addition (no JS behaviour change)
**Risk:** Low — actions remain accessible on focus-within

**Current:** Compare / Open / Delete buttons are always visible below each thumbnail. A 4-card row shows 12 buttons constantly.

**Proposed — hover overlay pattern:**

```
Resting state:
┌────────────────┐
│                │
│  [thumbnail]   │
│                │
└────────────────┘
  bz-berlin.de
  3/13/2026 · 3004×1882px

Hover state:
┌────────────────┐
│ ░░░░░░░░░░░░░░ │  ← semi-transparent overlay (rgba(0,0,0,0.45))
│  [🔍] [↗] [🗑] │  ← icon buttons centred in overlay
│ ░░░░░░░░░░░░░░ │
└────────────────┘
  bz-berlin.de
  3/13/2026 · 3004×1882px
```

The overlay appears on `:hover` and `:focus-within` (keyboard accessible). Buttons remain below the card for touch/keyboard fallback if needed. The domain + metadata line below the card always stays visible — this is important contextual information that should not hide.

The three actions reduce to icon buttons at 32px within the overlay — no text labels needed in this context (Compare = compare icon, Open = external link icon, Delete = trash icon). Labels remain as `aria-label` attributes.

---

### V-06 — Establish clear typographic hierarchy

**Impact:** Pages gain visual authority and scanability. ★★★☆☆
**Effort:** S — token updates only
**Risk:** Low

**Page title in header:** currently `font-size: 15px; font-weight: 600; letter-spacing: 0.3px`.

Proposed changes (header `.header-left` text):
```css
font-size: 15px;
font-weight: 700;             /* stronger — up from 600 */
letter-spacing: -0.01em;      /* tight tracking on a product name = premium */
```

**Filter section labels** (currently `font-weight: 500; font-size: 13px` or similar):

```css
font-size: 10px;
font-weight: 600;
letter-spacing: 0.07em;
text-transform: uppercase;
color: var(--sc-color-text-faint);
```

This is the "studio label" treatment — small, all-caps, tracked. It creates a clear visual break between the label and the control below it, making the filter bar feel like a toolbar rather than a web form.

**Count badges:** use `font-weight: 700` and `letter-spacing: 0.01em`. The badge should read confidently, not quietly.

---

### V-07 — Add domain favicons to URL Library rows

**Impact:** Transforms a plain text list into a rich data surface. ★★★☆☆
**Effort:** M — HTML + CSS, no new permissions needed
**Risk:** Low — uses Chrome's built-in favicon service (`chrome://favicon/size/16@2x/`)

Every modern URL/bookmark tool (Arc, Raindrop.io, Toby, Command E) shows domain favicons. Without them, a URL list is just text. With them, it becomes a visual library.

```html
<img
  class="url-favicon"
  src="chrome-extension://[id]/_favicon/?pageUrl=[encoded-url]&size=16"
  width="16"
  height="16"
  alt=""
  aria-hidden="true"
  onerror="this.style.display='none'"
/>
```

The `onerror` fallback hides the image gracefully if a favicon cannot be retrieved. No external network calls are required — Chrome handles favicon lookup from its local cache. This is entirely consistent with the local-only policy.

---

### V-08 — Active nav link: pill indicator instead of opacity bump

**Impact:** Navigation becomes spatially clear and distinctive. ★★★☆☆
**Effort:** S — CSS only
**Risk:** Very low

```css
/* Current — active state is just higher opacity text */
.sc-header-link[aria-current='page'] {
  /* likely just: color: rgba(255,255,255,1.0) vs rgba(255,255,255,0.74) */
}

/* Proposed — frosted pill */
.sc-header-link[aria-current='page'] {
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: var(--sc-radius-pill);
  padding: 4px 12px;
  color: #fff;
  font-weight: 600;
}

.sc-header-link:not([aria-current='page']) {
  color: rgba(255, 255, 255, 0.65);
  padding: 4px 10px;      /* same geometry, no background */
}

.sc-header-link:not([aria-current='page']):hover {
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.08);
  border-radius: var(--sc-radius-pill);
}
```

This is the pattern used by Vercel's dashboard nav, Arc's sidebar, and Linear's workspace switcher. The frosted pill reads clearly against any dark header surface and scales to the dark mode without additional overrides.

---

### V-09 — Empty state: illustration + headline + CTA

**Impact:** Turns a dead end into an inviting moment. ★★★☆☆
**Effort:** M — HTML + SVG + CSS (no JS changes)
**Risk:** Very low

**Current URL Library empty state:**
```
No URLs found for this view.
```

**Proposed:**
```
[SVG icon: small link/chain illustration, brand blue tint]

No URLs saved yet
Add your first URL from any tab to start building your library.

[+ Add Current Tab URL]   ← primary button, same as the one in the command bar
```

Same pattern for Screenshots empty state. The existing `sc-state-empty` class is the right container — it just needs content inside it.

---

### V-10 — Refine the primary button

**Impact:** Every primary action feels more intentional. ★★★☆☆
**Effort:** S — CSS token adjustments
**Risk:** Low

The current primary button likely uses a flat `#1976d2` background. Proposed refinements:

```css
.sc-btn-primary {
  background: var(--sc-color-brand-primary);         /* #1976d2 */
  /* Add a subtle inner gradient for depth */
  background-image: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(0, 0, 0, 0.04) 100%
  );
  border: 1px solid var(--sc-color-primary-strong);  /* #1565c0 — defines the edge */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);          /* grounding shadow */
  font-weight: 600;
  letter-spacing: 0.01em;
}

.sc-btn-primary:hover {
  background: var(--sc-color-primary-strong);         /* #1565c0 */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25);
}

.sc-btn-primary:active {
  transform: translateY(1px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}
```

The inner gradient + border edge + grounding shadow transforms a flat blue rectangle into a button that looks physically pressable. The `:active` `translateY(1px)` is the final signal — it gives tactile satisfaction on click.

---

## Summary: Prioritised Implementation Order

### Immediate (v1.10 — no DS 2.0 required, CSS-only)

| ID | Change | Impact | Effort |
|---|---|---|---|
| V-01 | Dark premium header | ★★★★★ | XS |
| V-02 | Warm page background | ★★★★☆ | XS |
| V-04 | Increase border radius (md: 8→10, sm: 6→7) | ★★★★☆ | XS |
| V-08 | Active nav pill indicator | ★★★☆☆ | S |
| V-06 | Typography: tighter tracking on title, uppercase filter labels | ★★★☆☆ | S |
| V-10 | Primary button: gradient + border + grounding shadow | ★★★☆☆ | S |

**These six changes alone will move the product from "developer prototype" to "premium tool" visually. Together they take 2–3 hours of CSS work and zero JS changes.**

### v2.0 Sprint 1 — alongside Design System 2.0 token migration

| ID | Change | Impact | Effort |
|---|---|---|---|
| V-03 | Card elevation: layered neutral shadows, remove visible border | ★★★★☆ | S |
| V-05 | Hover-reveal card actions in screenshot grid | ★★★★☆ | M |
| V-09 | Empty states: icon + headline + CTA | ★★★☆☆ | M |
| V-07 | Domain favicons in URL Library rows | ★★★☆☆ | M |

---

## What This Does Not Change

- No token names change — all proposals use existing token variables or update their values.
- No JS behaviour changes.
- No component renaming.
- Tier gating and feature flags are untouched.
- Dark mode is enhanced, not broken — the dark header deepens, the shadow system works in both themes without overrides.
- All changes are CSS/HTML — zero risk to capture/export/storage flows.
- Snapshot tests will need updating for V-01 through V-04 (intentional visual changes) — this is expected and manageable.

---

## The Reference Aesthetic

For Figma work: the target is the product category occupied by **Linear** (information density + dark header), **Vercel dashboard** (clean card grid + frosted active states), and **Raycast** (precise typography + hover affordances). The common thread: confident typography, dark/neutral chrome, clean card surfaces that float, and brand colour used as an accent rather than a fill.

The product already has the right structure. It needs the right finish.
