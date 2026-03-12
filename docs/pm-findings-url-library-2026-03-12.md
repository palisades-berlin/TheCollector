# PM Findings: URL Features Architecture & URL Library Proposal

# THE Collector — v1.9.47

# Date: 2026-03-12

# Author: Principal PM Analysis

# Status: RECOMMENDATION — input for v2.0 scoping

---

## METADATA

```
product: THE Collector
version_analyzed: 1.9.47
analysis_date: 2026-03-12
scope: URL Collector 2.0 feature placement, IA restructuring, bugs
target_milestone: v2.0 (URL Collector 2.0 sprint)
files_read:
  - src/popup/urls/urls-history-view.js
  - src/shared/repos/url-repo.js
  - src/shared/capabilities.js
  - src/history/history.html
  - docs/thecollector-2.0-90-day-roadmap.md
  - docs/ui-qa-audit.md
  - docs/adr/0009-always-free-local-only-product-model.md
```

---

## SECTION 1: CURRENT STATE AUDIT

### 1.1 What is shipped in v1.9.47

The following URL Collector 2.0 features are live:

| Feature                                             | Location                             | Status                                 |
| --------------------------------------------------- | ------------------------------------ | -------------------------------------- |
| Saved URL Views (All / Starred / Today / By Domain) | Popup URL panel — 4 view tabs        | SHIPPED                                |
| URL Tags (chip UI, 8 presets + free text, max 10)   | Popup URL panel — inline per row     | SHIPPED                                |
| URL Starring                                        | Popup URL panel — toggle per row     | SHIPPED                                |
| URL Change Log ("History" button)                   | Popup URL panel — panel-swap subview | SHIPPED                                |
| URL Notes (140-char)                                | IndexedDB data model only            | DATA MODEL ONLY — NO UI                |
| URL Bulk Actions                                    | Not implemented                      | MISSING — also missing capability gate |
| Smart URL Collections (By Domain grouping)          | Popup URL panel — By Domain tab      | SHIPPED (basic)                        |

### 1.2 What the screenshot History page contains

File: src/history/history.html

- Full-tab extension page
- Screenshot grid with thumbnail cards
- Filter bar: Domain, Date From, Date To, Export Type, Profile (Pro)
- Profile usage summary pills
- Bulk actions: Compare, Download, Delete
- Header nav: History | Settings
- NO URL features of any kind

### 1.3 The popup URL panel is doing four simultaneous jobs

1. CAPTURE TOOL — Add Current Tab, Add All Tabs, Clear
2. BROWSABLE LIBRARY — All / Starred / Today / By Domain view tabs + tag filter
3. INLINE EDITOR — tag chip editor per row, star toggle per row
4. CHANGE LOG VIEWER — "History" panel-swap showing add/remove operation snapshots

This is structurally overloaded for a 400px-wide height-constrained popup.

### 1.4 The URL data model (url-repo.js)

Storage architecture:

- URL list: chrome.storage.local key "urls" (plain string array)
- URL metadata: IndexedDB "the-collector-url-meta" / store "url_meta"
- URL change log: separate store via url-history.js
- Undo snapshot: chrome.storage.local key "urlsUndoSnapshot"

URL metadata record shape:

```
{
  normalizedUrl: string,   // key
  url: string,             // original
  createdAt: number,       // timestamp ms
  updatedAt: number,       // timestamp ms
  starred: boolean,
  tags: string[],          // max 10, max 24 chars each
  note: string             // max 140 chars — NO UI EXISTS YET
}
```

IndexedDB indexes: "starred", "createdAt"

---

## SECTION 2: IDENTIFIED PROBLEMS

### 2.1 CRITICAL — Naming collision on "History"

The word "History" currently means three different things:

| Usage                                       | What it actually is                              |
| ------------------------------------------- | ------------------------------------------------ |
| "History" — header nav link in history.html | Screenshot History page (full-tab)               |
| "History" — button in popup URL footer      | URL Change Log (add/remove operation snapshots)  |
| "History" — roadmap surface reference       | Conceptual URL Library page (does not exist yet) |

This is a UX debt item that gets worse with every new URL feature added.

### 2.2 HIGH — No dedicated URL Library page exists

The roadmap table lists "Popup URLs, History" as primary surfaces for URL Collector 2.0 features. However:

- The screenshot History page has zero URL features
- "History" in the roadmap table was aspirational placeholding for a URL Library page that was never built
- All URL organizational features are popup-bound with no full-tab destination

### 2.3 HIGH — URL Notes have a complete data model but zero UI

url-repo.js implements full note support (normalizeUrlNote, 140-char limit, IndexedDB persistence). The capability is in the roadmap. But there is no UI surface anywhere — no note icon, no inline field, no note indicator. Building this in the popup would be extremely cramped given existing row density with tag chips.

### 2.4 HIGH — url_bulk_actions capability gate is missing

capabilities.js PRO_FEATURES array:

```
['smart_save_profiles', 'bulk_actions_v1', 'weekly_value_report',
 'smart_revisit_nudges', 'featured_ready_ux_pack', 'capture_queue_batch_mode',
 'saved_url_views', 'url_tags']
```

"url_bulk_actions" is NOT in this list. When URL Bulk Actions ship, there is no existing gate for them. The capability key must be added before that feature ships.

### 2.5 MEDIUM — Orphaned metadata on URL removal

When a URL is removed from the list (data-action="remove" in the popup), the code mutates the URL list via mutateUrls() but never calls removeUrlMetadata(url). The function exists in url-repo.js (line 331: removeUrlRecordMetadata) but is not called in the remove flow. Every removed URL leaves an orphaned IndexedDB record containing its star state and tags. Over time, a high-volume user accumulates ghost metadata.

### 2.6 MEDIUM — URL Change Log has no keyboard dismiss (WCAG gap)

The URL Change Log panel-swap (urlsHistoryView / urlsMainViewEl toggle) is triggered by a button but there is no Escape key handler to return to the main URL panel. The product has a hard WCAG 2.2 AA requirement. This is a keyboard navigation gap on a currently shipped surface.

### 2.7 LOW — "Today" view edge case

isSameLocalDay(record.createdAt, now) uses the metadata createdAt timestamp, which is set when ensureUrlMetadata() first processes the URL — not necessarily at the exact moment the user added it. If popup was open across midnight, classification can drift. Known imprecision, not a blocking bug.

### 2.8 LOW — By Domain view is severely cramped in popup

Collapsible domain-grouped sections with URL rows, tag chips, and action buttons inside a 400px popup at max-height is near the usability floor. This view's information density requires a full-tab surface.

---

## SECTION 3: RECOMMENDATIONS

### REC-01 — Create a dedicated URL Library page (PRIORITY: HIGH, TARGET: v2.0 Sprint 2A)

Build src/urls/urls.html as a full-tab extension page.

This page is the permanent home for all URL organizational features, directly analogous to history.html for screenshots.

Proposed page structure:

```
HEADER
  - Title: "URL Library"  +  count badge
  - Nav: Screenshots · URLs · Settings
  - Bulk Actions toolbar (Pro): Select All | Copy | Export | Delete

FILTER BAR
  - Domain text input
  - Tag filter dropdown
  - Date From / Date To
  - View type toggle

VIEW TABS
  - All
  - Starred
  - Today
  - By Domain (collapsible domain sections — has room here)

URL ROWS (full-width)
  - Domain favicon
  - URL text (truncated with full title tooltip)
  - Tag chips (expanded by default — room exists)
  - Star toggle
  - Note icon (inactive = no note / active = has note) → click expands inline 140-char field
  - Open button
  - Remove button

CHANGE LOG (sub-tab or drawer)
  - The current popup "URL History" panel, promoted here
  - Operation snapshots: Added / Removed / Clear / Restore

EMPTY STATES
  - Per view (All empty / No starred / No items today / No domains)

PAGINATION
  - Load more (20-per-page pattern, reuse existing URL change log pagination)
```

Acceptance criteria:

- All URL metadata (star, tags, notes) readable and writable from this page
- URL Bulk Actions (copy, export CSV/TXT, delete) work on selection
- By Domain view renders collapsible sections with registered domain grouping
- URL Notes UI surfaces for the first time (data model already exists)
- Page opens from popup "Open URL Library →" button
- Page opens from header nav on screenshot History page

### REC-02 — Rebuild popup URL panel as capture-only surface (PRIORITY: HIGH, TARGET: v2.0 Sprint 2A)

After URL Library page exists, strip the popup URL panel to:

```
POPUP URL TAB — AFTER
  [ Add Current Tab URL ]          ← keep
  [ Add All Tabs in Window ]       ← keep

  Recently added (last 5, read-only)
    - URL text + star toggle (star is useful in the moment of adding)
    - No tag chips, no inline editors

  [ Copy ] [ TXT ] [ CSV ] [ Email ]    ← keep
  [ Clear All ]                          ← keep
  [ Open URL Library → ]                 ← NEW — replaces History button + all view tabs
```

Remove from popup:

- All / Starred / Today / By Domain view tabs
- Tag filter dropdown
- Inline tag chip editors
- History panel-swap (URL Change Log moves to URL Library page)

Performance benefit: removes repeated IndexedDB calls, reduces DOM complexity, helps meet <80ms p95 popup target.

### REC-03 — Fix the "History" naming collision (PRIORITY: MEDIUM, TARGET: v2.0 Sprint 2C)

| Current                                         | Rename to                   | Location             |
| ----------------------------------------------- | --------------------------- | -------------------- |
| "History" button (popup URL footer)             | "Change Log"                | Popup URL footer     |
| urlsHistoryView DOM ID                          | urlChangeLogView            | Internal DOM         |
| urlHistoryListEl                                | urlChangeLogListEl          | Internal DOM         |
| "URL history cleared" toast                     | "Change log cleared"        | Microcopy            |
| history.html page title "THE Collector History" | "THE Collector Screenshots" | history.html <title> |

The screenshot History page keeps its URL. Only the popup button label and internal IDs change.

### REC-04 — Add "URLs" to the header nav (PRIORITY: MEDIUM, TARGET: v2.0 Sprint 2A)

Current nav in history.html: History | Settings

Proposed nav: Screenshots · URLs · Settings

This nav pattern should be consistent across history.html, the new urls.html, and options.html. It makes the URL Library discoverable without requiring users to find it through the popup.

### REC-05 — Build URL Notes in URL Library, not in popup (PRIORITY: MEDIUM, TARGET: v2.0 Sprint 2B)

The data model is complete. The UI belongs on the URL Library page, not the popup. The roadmap scoped URL Notes to "Popup URLs, History" — this recommendation changes that surface to "URL Library page only."

Rationale: 140-char inline expand on a full-width URL Library row is workable. The same pattern in a 400px popup row already crowded with tag chips is not.

### REC-06 — Fix orphaned metadata on URL removal (PRIORITY: MEDIUM, TARGET: v1.9.x or v2.0 Sprint 2A)

In the URL remove action handler, add a call to removeUrlRecordMetadata(url) after the URL is removed from the list. This is a one-line data integrity fix. The function already exists in url-repo.js.

Suggested location: wherever mutateUrls() is called for the REMOVE_ONE action type.

### REC-07 — Add keyboard dismiss to URL Change Log panel (PRIORITY: MEDIUM, TARGET: v1.9.x)

Add an Escape key handler to the URL Change Log panel-swap. When the Change Log view is visible, pressing Escape should call showHistoryView(false) and return focus to the URL main view. Required for WCAG 2.2 AA keyboard parity on a currently shipped surface.

### REC-08 — Add url_bulk_actions to capabilities.js before shipping (PRIORITY: HIGH, TARGET: before URL Bulk Actions ship)

Add 'url_bulk_actions' to PRO_FEATURES in src/shared/capabilities.js. Without this, URL Bulk Actions will have no capability gate and will render for all tiers including Basic, violating the tier visibility contract and its test suite.

---

## SECTION 4: SEQUENCING WITHIN v2.0

All recommendations sequence within the existing v2.0 plan. Design System 2.0 (ADR 0010) prerequisite gate is respected — the URL Library page is built on the new token system from day one.

```
Sprint 2A — URL Library scaffold + navigation wiring
  - New urls.html page with header nav
  - Move All / Starred / Today / By Domain to URL Library
  - "Open URL Library" entry point in popup
  - Popup URL panel stripped to capture-only
  - Add url_bulk_actions to capabilities.js (REC-08)
  - Fix orphaned metadata on remove (REC-06)
  - Fix keyboard dismiss on Change Log (REC-07)

Sprint 2B — Rich features on URL Library surface
  - URL Tags + Tag Filter (moved from popup, full-width rows)
  - URL Notes UI (surfaces existing data model for first time)
  - URL Bulk Actions (table-level selection, impossible in popup)
  - Smart URL Collections (By Domain collapsibles, room to breathe)

Sprint 2C — Naming and navigation cleanup
  - Rename URL "History" → "Change Log" throughout
  - Move Change Log view into URL Library as sub-tab
  - Remove panel-swap from popup
  - Update all microcopy and DOM IDs
  - Update help-user-guide.md and options.html Help & FAQ section (per Help Rule 3)
```

Each sprint is independently shippable. 2B requires 2A. 2C can be parallelized with 2B.

---

## SECTION 5: ROADMAP TABLE CORRECTIONS NEEDED

The following roadmap table entries need surface corrections when v2.0 scope is locked:

| Feature               | Current surface in roadmap | Corrected surface                                  |
| --------------------- | -------------------------- | -------------------------------------------------- |
| Saved URL Views       | Popup URLs, History        | URL Library page                                   |
| URL Tags              | Popup URLs, History        | URL Library page (with minimal star-only in popup) |
| URL Bulk Actions      | Popup URLs, History        | URL Library page only                              |
| URL Notes             | Popup URLs, History        | URL Library page only                              |
| Smart URL Collections | History, Sidebar           | URL Library page                                   |

---

## SECTION 6: OPEN QUESTIONS FOR SCOPING

1. Should the URL Library page be accessible from the popup header directly (a third tab in the popup top nav alongside Capture and URLs), or only via an "Open URL Library →" button within the URL panel? The former reduces friction; the latter keeps the popup simpler.

2. Should the URL Library page replace the popup URL tab entirely for Pro/Ultra users (i.e., the popup URL tab becomes "Open URL Library" only), or should the popup retain the capture actions (Add Current Tab, Add All Tabs) as a genuinely useful quick-capture surface for all tiers?

3. The URL Change Log (operation snapshots) is currently the only "history" for URLs. Should it stay as a sub-tab in the URL Library page, or should it be removed entirely in favor of the richer URL Library itself as the organizational surface?

4. For Basic tier users: should they see the URL Library page with Basic features only (Add, All view, open/remove), or should URL Library itself be a Pro+ feature with Basic users limited to the popup URL panel only?

---

## SECTION 7: CONSTRAINTS THAT MUST NOT CHANGE

Per ADR 0009 and project CLAUDE.md:

- Always free, local-only, no external connections
- No tracking, no telemetry export
- Tier selector (Basic/Pro/Ultra) is UX complexity preference, not a paywall
- All new features behind kill-switch flags
- Help docs (help-user-guide.md + options.html Help & FAQ) must stay in sync with shipped features
- check-doc-policy.mjs gate must not be bypassed

---

END OF FINDINGS

```

```
