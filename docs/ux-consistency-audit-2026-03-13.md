# UX/UI Consistency Audit — THE Collector

**Date:** 2026-03-13
**Author:** Principal UX/UI Designer
**Status:** RECOMMENDATION — input for v1.10 and v2.0 scoping
**Surfaces audited:** Screenshots (history.html) · URL Library (urls.html) · Preview (preview.html)
**Figma source of truth:** `sECUN6qSqUygWoG7PhC548` (`THECollector - UI Kit & Screens`)

---

## Executive Summary

Three shipped surfaces share a design language but not a design system. Each page was grown independently, producing four compounding problems:

1. **Navigation is structurally inconsistent** — its position, DOM role, and sibling elements differ across every surface.
2. **Action layers are stacked without hierarchy** — the URL Library stacks 4 distinct control rows before the user reaches content.
3. **Button role is ambiguous** — primary, secondary, and tertiary actions are rendered at the same visual weight in dense bars.
4. **Preview is an island** — it uses a floating icon sidebar that exists nowhere else in the product.

None of these require a full redesign. Most can be resolved through targeted, low-risk incremental fixes — and several can ship before Design System 2.0 lands.

---

## Problem Inventory

Severity: 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low

### P-01 🔴 Navigation: different structure on every surface

| Surface     | Nav position                              | Nav siblings                              | Nav DOM role                   |
| ----------- | ----------------------------------------- | ----------------------------------------- | ------------------------------ |
| Screenshots | Inside `.header-actions` div (right side) | Compare, Bulk, Clear All                  | `<nav>` inside actions wrapper |
| URL Library | Direct child of `<header>` (right side)   | None — actions moved below to a card      | `<nav>` standalone             |
| Preview     | Own link group in toolbar (left side)     | PDF size, Save PNG/JPG/PDF, Copy, Presets | No `<nav>` element             |

**Impact:** Users cannot build a spatial memory for navigation. Each page re-teaches the layout. The Preview page is the most severe case — it has no consistent nav to the other surfaces at all.

---

### P-02 🔴 URL Library: 4 control layers before content

Current layer stack, top to bottom:

```
Layer 1 — Header       (Logo · Nav)
Layer 2 — Quick Actions (8 buttons: Add, Add All, Copy, TXT, CSV, Email, Restore, Clear All)
Layer 3 — Filters       (Domain · Tag · From · To)
Layer 4 — Tab bar       (All · Starred · Today · By Domain · Change Log)
Layer 5 — Selection bar (0 selected · Select Visible · Clear · Copy · Open · TXT · CSV · Delete)
Layer 6 — Content
```

Five control rows before a single URL is visible. This is the single largest usability problem in the product.

---

### P-03 🟠 Button role is undefined in dense bars

The URL Library quick-actions row renders 8 buttons. Of those:

- 1 is `sc-btn-primary` (Add Current Tab URL) ✓
- 1 is `sc-btn-secondary` (Add All Tabs) ✓
- 5 are unstyled `sc-btn` (Copy, TXT, CSV, Email, Restore) — no role signal
- 1 is `sc-btn-danger` (Clear All) ✓

The 5 unlabelled `sc-btn` buttons are export actions that belong together conceptually but are rendered as peer siblings with the add and clear actions. They have no grouping, no secondary weight, and no way to distinguish them from primary operations at a glance.

In the Screenshots header, Compare/Bulk/Clear All are all `btn-neutral sc-btn-sm` — same weight as each other, even though Compare and Bulk are different interaction modalities (selection toggles vs. destructive).

---

### P-04 🟠 Header title and badge pattern is inconsistent

| Surface     | Title text                                | Count badge                                                                 |
| ----------- | ----------------------------------------- | --------------------------------------------------------------------------- |
| Screenshots | `THE Collector Screenshots`               | `<span class="badge sc-pill" id="count">` — no text by default              |
| URL Library | `THE Collector URL Library`               | `<span class="sc-pill" id="urlCount">0 URLs</span>` — always shows "0 URLs" |
| Preview     | `THE Collector` + URL + date + dimensions | No badge — metadata is inline in a flat string                              |

The Screenshots badge is unlabelled (just a number). The URL Library badge always shows "0 URLs" on load (reads as an error state until the data loads). The Preview surface abandons the badge pattern entirely and spreads metadata inline across the toolbar.

---

### P-05 🟠 Filters: different controls, different order, different visual treatment

| Surface     | Filter controls (left→right)                                                               |
| ----------- | ------------------------------------------------------------------------------------------ |
| Screenshots | Domain (combobox) · From (date) · To (date) · Export Type (select) · Profile (select, Pro) |
| URL Library | Domain (input) · Tag (select) · From (date) · To (date)                                    |

Screenshots uses a custom combobox for Domain. URL Library uses a plain `<input>`. Both are for the same concept (filter by domain) but behave and render differently. The date pair is in different positions. There is no shared visual rhythm between the two filter bars — they were built independently.

---

### P-06 🟠 Profile Usage pills: orphaned summary pattern

The Screenshots page has a `PROFILE USAGE` row with `Research: 1 · Interest: 0 · Private: 0` pills. This pattern exists only on this one surface, is not present on the URL Library, and has no equivalent on Preview. For Basic tier users (no profiles), this row displays zeros across the board — adding noise with no value. For Pro/Ultra users, it has marginal value but competes visually with the filter bar directly above it.

---

### P-07 🟡 Preview surface: floating left sidebar has no precedent

The Preview page is the only surface with a floating vertical icon panel on the left edge. This panel contains: copy, grid, split-view, ESD marker, bug, QR, info, close icons. None of these icons are labelled. The panel uses hover-revealed state and has no analogue on any other surface. Users switching from Screenshots or URL Library have no mental model for this pattern.

---

### P-08 🟡 Selection/bulk pattern is inconsistent between surfaces

- Screenshots: Bulk mode is activated by a "Bulk" toggle button in the header. When active, the page enters a modal-ish selection mode.
- URL Library: The selection bar ("0 selected · Select Visible · Clear · Copy · Open · TXT · CSV · Delete") is **always rendered**, even when nothing is selected and no selection mode has been activated. It occupies a full row of space at all times, is visually similar to the tab bar above it, and provides zero affordance for when it becomes active.

---

### P-09 🟡 Change Log is architecturally misplaced as a tab

The URL Library has 5 tabs: All · Starred · Today · By Domain · **Change Log**. The first four tabs filter the same data set (URL records). Change Log is a fundamentally different content type — it's an audit trail of add/remove operations, not a view of URLs. Placing it as a peer tab implies it is another way to view URLs, which it is not. Users tab through it expecting filtered URL results and see something structurally different.

---

### P-10 🟢 "Clear all" vs "Clear All" capitalisation

Screenshots header: `Clear all` (sentence case)
URL Library quick-actions: `Clear All` (title case)
URL Library selection bar: `Clear` (single word)

Three different labels for the same concept family across two pages.

---

## Solutions: Quick Wins (ship with v1.10, no DS 2.0 required)

These are CSS/HTML changes only. No behaviour changes, no data-flow changes. Each is independently deployable.

---

### QW-01 — Normalise the header DOM structure across Screenshots and URL Library

**Problem:** P-01
**Effort:** XS — pure HTML restructure, no JS, no behaviour change
**Risk:** Low — visual only, covered by existing snapshot tests

Both pages should share an identical header contract:

```
<header class="sc-header">
  <div class="header-left">
    [icon] [Title] [count badge]
  </div>
  <nav class="sc-header-nav" aria-label="Primary">
    <a>Screenshots</a>
    <a>URLs</a>
    <a>Settings</a>
  </nav>
  <div class="header-actions">          ← page-specific CTAs only
    [page action buttons]
  </div>
</header>
```

The nav is always the centre element. Page-specific actions (Compare, Bulk, Clear All on Screenshots; nothing needed on URLs once QW-02 is applied) live in `header-actions` on the right. This makes the nav spatially stable across pages.

**URL Library currently has no `header-actions` div** — the actions are in a card below the header. Screenshots has the nav _inside_ `header-actions`. Swap both to the contract above.

---

### QW-02 — Collapse the 8-button URL Library action row into 3 logical groups

**Problem:** P-02, P-03
**Effort:** S — HTML + CSS only, no logic change
**Risk:** Low

Current: `[Add Current Tab] [Add All Tabs] [Copy] [TXT] [CSV] [Email] [Restore Last Clear] [Clear All]` — 8 flat buttons.

Proposed: `[+ Add Current Tab URL] [Add All Tabs ▾]` · `[Export ▾]` · `[Clear All]`

Specifically:

- **Primary capture group (left):** `sc-btn-primary` for "Add Current Tab URL". "Add All Tabs in Window" becomes `sc-btn-secondary`.
- **Export dropdown (centre):** Collapse Copy / TXT / CSV / Email into a single `[Export ▾]` `sc-btn-secondary` dropdown. These are all export modalities — they belong in one menu. "Restore Last Clear" moves into this dropdown as a recovery action (it is not a frequently used primary action).
- **Destructive action (right, far):** `[Clear All]` stays as `sc-btn-danger`, separated from the export group by a spacer. Spatial distance reinforces its destructive nature.

Result: 3 visible controls + 1 dropdown instead of 8 flat buttons. This eliminates Layer 2 complexity immediately.

---

### QW-03 — Make the selection bar appear only when items are selected

**Problem:** P-08
**Effort:** S — CSS `display:none` / JS class toggle
**Risk:** Very low — purely additive show/hide

The "0 selected · Select Visible · Clear · Copy · Open · TXT · CSV · Delete" bar should be hidden by default and revealed only when at least one item is selected (or when a "Select" mode is entered). This matches the macOS Finder, Google Drive, and iOS bulk-edit pattern — the selection toolbar is contextual, not persistent.

Initial state: hidden. Transition: slides down (or fades in) when selection count > 0, or when "Select" mode is toggled.

Add a single "Select" button to the tab bar row (far right, ghost style) to enter selection mode explicitly — mirroring the Screenshots "Bulk" button pattern. This also unifies the two surfaces' bulk-action entry points.

---

### QW-04 — Move Change Log out of the tab bar

**Problem:** P-09
**Effort:** XS — relabelling + minor layout
**Risk:** Very low

Replace the Change Log tab with a small "Change Log" link or icon-button (ghost, far right of the tab row). It remains accessible but is no longer presented as a peer view alongside All/Starred/Today/By Domain.

```
[All] [Starred] [Today] [By Domain]          [↗ Change Log]
```

The right-aligned ghost link makes it discoverable without implying it is a URL filter view.

---

### QW-05 — Fix the count badge to always show a labelled count

**Problem:** P-04
**Effort:** XS — HTML + JS
**Risk:** Very low

Screenshots badge: `<span>47</span>` (unlabelled number)
→ Change to: `47 screenshots` (matches URL Library pattern and gives screen readers context)

URL Library badge: shows `0 URLs` immediately on load (reads as empty/error before data arrives)
→ Change to: show a loading shimmer/skeleton state, then `N URLs` once loaded

Both badges should use the same `sc-pill` class and the same text format: `{N} {noun}`.

---

### QW-06 — Unify domain filter to same control type on both pages

**Problem:** P-05
**Effort:** S — replaces plain `<input>` on URL Library with the combobox pattern from Screenshots
**Risk:** Low — additive UX improvement

The Screenshots domain filter uses a combobox that auto-suggests previously captured domains. The URL Library domain filter is a plain `<input>`. Apply the same combobox pattern on URL Library so the interaction is identical. Both already have domain data available in their respective storage layers.

---

### QW-07 — Gate the Profile Usage pills row behind Pro tier and collapse zeros

**Problem:** P-06
**Effort:** XS — CSS/JS tier check
**Risk:** Very low

Two changes:

1. Hide the Profile Usage row entirely for Basic tier users (zero value, visible noise).
2. For Pro/Ultra users: only show pills with count > 0. A pill reading "Interest: 0" communicates nothing useful.

This removes a full visual row from the Screenshots page for Basic users, and for Pro/Ultra users it becomes signal (only used profiles are shown).

---

### QW-08 — Consistent capitalisation for destructive actions

**Problem:** P-10
**Effort:** XS — copy change
**Risk:** Zero

Standardise to: `Clear All` (title case) across all surfaces. Update Screenshots header (`Clear all` → `Clear All`). Update URL Library selection bar (`Clear` → `Clear selection`).

---

## Solutions: v2.0 Structural Fixes (require Design System 2.0 token layer)

These changes require the semantic token system that Design System 2.0 delivers (per ADR 0010 and the roadmap gate). Do not attempt these before Sprint 1 of v2.0 is complete.

---

### S-01 — Introduce a consistent "command bar" layer below the header

**Problem:** P-02 (primary), P-01 (secondary)
**Target:** v2.0 Sprint 1–2

Design System 2.0 should define a `sc-command-bar` component — a single-row band between the header and filter row that holds page-level primary actions. It is:

- Present on every full-page surface (Screenshots, URL Library, Settings)
- Always one row tall
- Always the same height, padding, and border treatment
- Holds at most 3 top-level controls (primary CTA, secondary group/dropdown, destructive action)

With this in place:

- **Screenshots command bar:** `[Bulk Select]` (ghost) `[Clear All]` (danger)
- **URL Library command bar:** `[+ Add Current Tab]` (primary) `[Add All Tabs]` (secondary) `[Export ▾]` (secondary) · · · `[Clear All]` (danger, far right)

Compare moves to a contextual appearance in the card grid (when 2 items are checked) — it is not a persistent global action.

---

### S-02 — Unified filter bar component

**Problem:** P-05
**Target:** v2.0 Sprint 1

Define `sc-filter-bar` as a shared component with:

- Consistent control heights (40px standard, matching `--sc-control-std`)
- Consistent label typography (`--sc-font-xs`, muted)
- Consistent gap between filter items (`--sc-gap-md`)
- Standard breakpoint collapse (filters stack at narrow viewport)

Screenshots filter bar and URL Library filter bar become instances of this component. The domain combobox is the shared standard (QW-06 begins this before DS 2.0, the token migration completes it).

---

### S-03 — Preview: integrate nav and reduce toolbar layers

**Problem:** P-01 (Preview), P-07
**Target:** v2.0 Sprint 1

The Preview surface currently lacks a navigation link back to Screenshots or URLs. It has a "History" link that navigates back to history.html — this is functional but non-obvious and the link is named inconsistently with the page title ("THE Collector Screenshots").

Proposed Preview header contract:

```
[← Back]    [Screenshots] [URLs] [Settings]    [PDF Size ▾] [Save ▾] [Copy]    [Preset ▾]
```

- "← Back" is a ghost button that returns to the previous surface (browser history back).
- The standard `sc-header-nav` is present — Preview joins the same navigation shell as the other pages.
- "Save ▾" collapses Save PNG / Save JPG / Save PDF into one split-button or dropdown. This removes 2 buttons from the toolbar.
- "Preset ▾" moves Preset: Email / Preset: Docs / Preset: PDF Auto into a dropdown. These are shortcuts for the Save action, not independent actions — they should be subordinate to it visually.

Floating left sidebar: replace with a slide-in panel triggered by an "Edit tools" button in the edit toolbar. The floating panel is a spatial anti-pattern that breaks the visual layer model. The edit toolbar below the header is already the correct location for tool access.

---

### S-04 — Profile filter alignment between Screenshots and URL Library

**Problem:** P-01 (Pro-tier filter inconsistency)
**Target:** v2.0 Sprint 2

Screenshots has a Profile filter (Pro, visible as a `<select>` in the filter bar). URL Library has a Tag filter. Both are Pro tier features that filter list content. They should use the same `sc-select` control, same placement (after domain input), and same Pro-gate rendering pattern.

---

## Design Principles Going Forward

These principles should be added to `docs/ui-handoff.md` as implementation guardrails:

**1. One nav, always in the same place.**
Every full-page surface renders `sc-header-nav` as the second child of `<header>`. No exceptions. Preview is not exempt.

**2. The header contains navigation. The command bar contains actions.**
Page-specific CTAs do not live in the header. The header is for identity (logo + title + badge) and navigation only. Actions live in the command bar below the header.

**3. Max 3 visible top-level actions per surface.**
If a surface needs more than 3 top-level actions, group related ones into a dropdown. The user's eye should land on one primary action per surface on first view.

**4. Contextual UI is hidden until needed.**
Selection bars, bulk action toolbars, and inline editors appear only when triggered. Persistent zero-state UI (e.g. "0 selected") is noise, not affordance.

**5. Tabs filter one data type. Different data types use different navigation patterns.**
Tabs in a tablist must all operate on the same data set. An audit log (Change Log) is not a tab alongside All / Starred / Today — it gets its own entry point.

**6. Destructive actions have spatial separation.**
"Clear All" is always right-aligned and separated from other actions by a visual gap or spacer. It never sits adjacent to an export or copy button.

---

## Implementation Sequence

### Phase 1 — Quick Wins (v1.10, ship now, no DS 2.0 required)

| ID    | Change                                                    | Effort | Risk     |
| ----- | --------------------------------------------------------- | ------ | -------- |
| QW-01 | Normalise header DOM structure                            | XS     | Low      |
| QW-04 | Move Change Log out of tabs                               | XS     | Very low |
| QW-05 | Fix count badge labels                                    | XS     | Very low |
| QW-07 | Gate Profile pills behind Pro + hide zeros                | XS     | Very low |
| QW-08 | Capitalisation consistency                                | XS     | Zero     |
| QW-02 | Collapse 8-button action row → 3 groups + Export dropdown | S      | Low      |
| QW-03 | Selection bar: contextual only                            | S      | Very low |
| QW-06 | Domain combobox on URL Library                            | S      | Low      |

### Phase 2 — DS 2.0 Structural (v2.0 Sprint 1, after token migration)

| ID   | Change                                                | Effort | Risk   |
| ---- | ----------------------------------------------------- | ------ | ------ |
| S-02 | Unified `sc-filter-bar` component                     | M      | Low    |
| S-01 | `sc-command-bar` component + apply to all pages       | M      | Low    |
| S-03 | Preview nav integration + toolbar consolidation       | L      | Medium |
| S-04 | Pro-tier filter alignment (Screenshots ↔ URL Library) | S      | Low    |

---

## What This Does Not Change

- All business logic, capture flows, and data models are untouched.
- Tier gating rules are untouched.
- The roadmap sequence (DS 2.0 before v2.0 feature work) is respected.
- No net-new features are introduced. These are consistency and reduction changes only.
- The Figma file remains the source of truth. Each structural change above requires a corresponding Figma update before code implementation (per `docs/ui-handoff.md` change policy).

---

_Next step: validate the header contract and command bar structure in Figma before implementing QW-01 and QW-02. The remaining quick wins can be implemented directly from this spec._
