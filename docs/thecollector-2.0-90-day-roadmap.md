## THE Collector — Product Evolution Roadmap (Power-User, Always Free, Local-Only)

## Summary

Build a category-defining research command center for individuals. THE Collector is **free forever
and local-only** — no backend, no tracking, no accounts, no subscriptions. Goal: make THE Collector
feel like a premium Google-grade tool with intelligent capture, automation, and visible weekly value.

Locked strategic decisions:

1. Primary focus: **Power-user B2C**.
2. Business model: **Always free — no subscriptions, no payments, no paid tiers, ever**.
3. Constraint: preserve current technical quality and keep business logic correctness standards.
4. Execution style: feature flags + progressive rollout + no debt accepted.
5. Privacy/runtime rule: **no external connections, all-local processing, and no user tracking/telemetry export**.
6. Tier model rule: the Settings tier selector (`Basic` / `Pro` / `Ultra`) is a **UX complexity
   preference**, not a paywall. It controls which feature surfaces are visible. All tiers are free.
   Basic = essential features. Pro = standard power-user surface. Ultra = full expert surface.
7. Delivery certainty rule: **Pro** and **Ultra** tracks are intended roadmap directions, but not
   every listed feature is guaranteed to ship, and some may ship later than this plan or be deferred.

Premium product delivery guardrails:

1. Outcome-gated delivery: a roadmap item is complete only when technical acceptance and a predefined product outcome signal are both met.
2. Slice-to-scale policy: ship smallest useful slice first (v1), then promote to v2 only after v1 quality and adoption review.
3. Tier value integrity: Pro/Ultra features must provide clear incremental UX value over Basic. The tier is a complexity ladder, not a revenue gate.
4. Core UX protection: roadmap work must not degrade core Basic flows (capture, retrieve, export, settings save).
5. Phase exit gates: each phase requires explicit quality + UX + product-fit exits before next phase starts.
6. Premium usability bar: first-time clarity and low-friction repeat actions are mandatory in primary surfaces.
7. De-scope discipline: if quality/clarity targets are missed in-cycle, reduce scope and ship a coherent slice.
8. v1→v2 promotion contract: v2 work proceeds only when v1 is stable, documented, test-covered, and free of unresolved High/Critical UX defects.
9. Pre-start dependency checkpoint: each roadmap item records dependency/conflict checks against shipped features and active phases.
10. Post-release product review: each shipped roadmap feature records what improved, what regressed, and what to adjust next.

North-star outcomes by end of roadmap:

1. WAU: +40% (minimum).
2. D7 retention: +25%.
3. Capture-to-revisit loop completion: +50%.
4. Perceived value uplift: 3x (weekly value report + automation outcomes).
5. Chrome Web Store featuring: qualify and apply within v1.10 milestone window.

### Persisted Roadmap Progress Baseline (as of 2026-03-12)

Implemented roadmap features and current delivery level:

1. Smart Save Profiles: **v1 completed** (`1.9.18` through `1.9.38`) across Popup + Settings + History.
2. Smart Revisit Nudges: **v1 delivered** (`1.9.20`).
3. Bulk Actions: **v1 delivered slice** (`1.9.23`).
4. Weekly Value Report: **v1 delivered slice** (`1.9.24`) — Settings card only.
5. Capture Queue + Batch Mode: **v1 delivered slice + hardening fixes** (`1.9.28` through `1.9.33`).
6. Extension Help Page: **v1 delivered slice** (docs + Settings `Help & FAQ` section in `1.9.35`).

Versioning status:

1. Current release baseline: **`1.9.43`**.
2. No roadmap **v2** feature is fully shipped yet.
3. Smart Save Profiles editable management remains planned for v2.0.
4. Command Palette (Cmd/Ctrl+K) remains **unshipped**; user-facing help/docs are aligned to the shipped feature set.

---

## Capability Tier Matrix (Basic / Pro / Ultra — UX Complexity Preference, Always Free)

Authoritative visibility contract:

1. `basic` sees only Basic features.
2. `pro` sees Basic + Pro features.
3. `ultra` sees Basic + Pro + Ultra features.
4. Gated features are hidden in UI when unavailable (not rendered disabled).
5. All tiers are free. The selector controls UX surface complexity, not access to a paid product.

### Feature-to-Tier Matrix (Current planning scope)

| Feature Area      | Feature                                                                      | Tier  | Primary Surfaces                 | Visibility Rule             |
| ----------------- | ---------------------------------------------------------------------------- | ----- | -------------------------------- | --------------------------- |
| Core capture      | Save current page, add note, tags, collection select                         | Basic | Popup, Sidebar                   | Always visible              |
| Core retrieval    | Search, filter, sort, open, copy, delete                                     | Basic | Sidebar, History                 | Always visible              |
| Core settings     | Tier selector, sync toggle, data import/export, shortcuts base               | Basic | Settings                         | Always visible              |
| Core preview      | Save PNG/JPG/PDF, copy image, PDF size select                                | Basic | Preview                          | Always visible              |
| Quick wins        | Smart Save Profiles                                                          | Pro   | Popup, Settings                  | Hidden unless tier >= Pro   |
| Quick wins        | History profile filter                                                       | Pro   | History, Sidebar                 | Hidden unless tier >= Pro   |
| Quick wins        | Bulk Actions v1                                                              | Pro   | History, Sidebar                 | Hidden unless tier >= Pro   |
| Quick wins        | Weekly Value Report (v1: Settings card; v2: popup footer card)               | Pro   | Settings, Popup                  | Hidden unless tier >= Pro   |
| Quick wins        | Smart Revisit Nudges                                                         | Pro   | Settings, Popup                  | Hidden unless tier >= Pro   |
| Quick wins        | Capture Queue + Batch Mode (v1: popup queue + sequential run)                | Pro   | Popup, History                   | Hidden unless tier >= Pro   |
| Quick wins        | Quick Note at Save (post-capture inline note prompt)                         | Pro   | Popup                            | Hidden unless tier >= Pro   |
| Intelligence      | Command Palette (`Cmd/Ctrl+K`)                                               | Ultra | Popup, Sidebar, History, Preview | Hidden unless tier >= Ultra |
| Intelligence      | Omnibox Actions (`tc research`, `tc star`, `tc queue`)                       | Ultra | Omnibox                          | Hidden unless tier >= Ultra |
| Intelligence      | Magic Mode v1 (rule-based domain→profile suggestion)                         | Ultra | Popup, Sidebar                   | Hidden unless tier >= Ultra |
| Intelligence      | Workflow Automations v1 (3–4 preset automation toggles)                      | Ultra | Settings                         | Hidden unless tier >= Ultra |
| Intelligence      | Admin Config Profile (importable JSON for defaults + privacy rules)          | Ultra | Settings                         | Hidden unless tier >= Ultra |
| Monitoring        | Capture Diff as Monitoring (scheduled re-capture + auto-diff + notification) | Ultra | Settings, History                | Hidden unless tier >= Ultra |
| URL Collector 2.0 | Saved URL Views (Starred, Today, By Domain)                                  | Pro   | Popup URLs, History              | Hidden unless tier >= Pro   |
| URL Collector 2.0 | URL Tags (8 pre-populated + free text, chip UI, shared taxonomy)             | Pro   | Popup URLs, History              | Hidden unless tier >= Pro   |
| URL Collector 2.0 | URL Bulk Actions (copy/export/delete/open)                                   | Pro   | Popup URLs, History              | Hidden unless tier >= Pro   |
| URL Collector 2.0 | URL Notes (140-char, inline expand on click)                                 | Pro   | Popup URLs, History              | Hidden unless tier >= Pro   |
| URL Collector 2.0 | Smart URL Collections (domain-grouping view, auto-generated)                 | Ultra | History, Sidebar                 | Hidden unless tier >= Ultra |
| Sharing           | Team Spaces Lite (self-contained ZIP + viewer.html export)                   | Ultra | History, Preview                 | Hidden unless tier >= Ultra |

Roadmap certainty note:

1. Pro and Ultra tracks are planned roadmap directions.
2. Features listed for Pro/Ultra are candidates and may ship in phases, be deferred, or change scope.
3. Tier model remains fixed even if individual feature timelines shift.
4. Settings IA must be revisited after additional Pro/Ultra features land for a structural calibration pass.

---

## Milestone Plan

### v1.10 — Foundation & Distribution (Weeks 1–3)

Goal: Close the gap between shipped features and product promises. Harden tier infrastructure for a free-forever product. Make one focused push at Chrome Web Store featuring.

Implementation backlog:

1. Simplify tier gating for a free product: implement single `capabilityTier` setting as UX complexity selector with no entitlement enforcement. Replace independent Pro/Ultra booleans with hierarchical checks. Update Settings UI to one tier selector and inheritance helper copy.
2. Command Palette discrepancy **resolved**: help/docs now treat Cmd/Ctrl+K as unshipped until implementation lands.
3. Featured-Ready UX Polish Pack: premium store screenshots (first 3 must tell the full value loop in 10 seconds), updated listing copy leading with outcomes not features, and permission trust copy pre-empting "why does this need tabs access?"
4. Weekly Value Report promoted from Settings-only to popup footer card (dismissible, shown for Pro/Ultra).
5. Microcopy pass: convert status text to "outcome + next step" format across all surfaces. Add value language ("Saved in 1 click", "You saved 42 min this week").
6. WCAG 2.2 AA audit and remediation pass on all existing surfaces. Reduced-motion mode if not already live.
7. Edge store submission: verify Chromium/MV3 parity and submit to Edge Add-ons store.
8. Enforce hide-only rendering contract in shared gating helpers. Add migration and tier-visibility tests.

Primary surfaces: Settings, Popup, shared capability layer.

v1.10 acceptance gates:

1. Popup p95 interactive in under 100ms.
2. No increase in crash/error rate.
3. All new features behind kill-switch flags.
4. Visual parity tests green and accessibility checks pass.
5. Tier selector is purely a UX complexity preference — no payment checks, no entitlement enforcement.
6. End-user help page updated for any UX or tier changes in this milestone.

---

### v2.0 — Design System 2.0 + URL Collector 2.0 + v2 Depth (Weeks 3–7)

Goal: Land Design System 2.0 first — token migration across all surfaces is the prerequisite gate for all v2.0 feature work. Then elevate URL collection to a first-class product surface and promote the best v1 features to their full v2 potential. Run the mandatory Post-Milestone Full Assessment before proceeding to v2.1.

Implementation backlog:

**Design System 2.0 — Sprint 1 (prerequisite gate: completes before any feature below ships):**

1. Token migration: introduce semantic token tiers (`--sc-color-surface-{1..4}`, `--sc-color-brand-{primary,accent,success,warning,danger}`, `--sc-motion-{quick,base,slow}`, `--sc-elevation-{0..4}`, `--sc-radius-{xs,sm,md,lg,pill}`, `--sc-density-{compact,default,comfortable}`) across all surfaces: popup, history, preview, and options. All hardcoded color, spacing, and motion values replaced by semantic tokens.
2. Component-level refactor: every existing component updated to consume semantic tokens. No net-new visual redesign in this sprint — this is a system migration, not a redesign. Interaction patterns and information architecture are out of scope here.
3. Ship the 4 scoped animations: capture start pulse (120ms), success shimmer (180ms), queue progress sweep (linear), command palette entrance (140ms).
4. WCAG 2.2 AA remediation pass on the refactored token layer. Reduced-motion and reduced-transparency modes in Settings if not already complete.
5. Visual regression baseline: snapshot all surfaces post-migration. This baseline is the visual acceptance gate for all subsequent v2.0 feature work.

Scope boundary: this sprint migrates the visual system. It does NOT simultaneously redesign interaction patterns, navigation, or information architecture. Those are separate UX strategy decisions, informed by the Post-Milestone Full Assessment.

**URL Collector 2.0 — Sprint 2+ (all built on Design System 2.0):**

6. Saved URL Views: `Starred` (always available, doubles as Revisit Queue), `Today`, `By Domain` (Pro/Ultra). Starred is a flag, not a separate list — it filters the existing URL list.
7. URL Tags: 8 pre-populated tag suggestions seeded from profile names (Research, Interest, Private) plus common tags (reading, follow-up, reference, archive, later). Free-text entry allowed. Chip UI on URL row, collapsed by default, expand on click. Max 10 tags per URL. Shared taxonomy with capture tags. No custom tag management in v1.
8. URL Bulk Actions: copy / export / delete / open. Reuse bulk-action patterns from History Bulk Actions v1.
9. URL Notes: 140-character hard limit. Note icon on the URL row; click to expand inline text field. Never always-visible. Persisted alongside URL metadata in IndexedDB.
10. Smart URL Collections: domain-grouping view only — collapsible sections in "By Domain" view, auto-generated from registered domain. Zero ML, zero user configuration. No topic clustering in v1.

**v2 Promotions — Sprint 2+ (all built on Design System 2.0):**

11. Smart Save Profiles v2: user-editable custom profiles (name + export format + default note). Replaces v1 fixed-preset-only constraint.
12. Bulk Actions v2: bulk tag + bulk move to collection.

**Post-Milestone Full Assessment (mandatory before v2.1):**

1. UX/UI assessment: visual consistency, design-system parity, accessibility, and interaction clarity across all surfaces.
2. User-flow assessment: end-to-end flow quality for capture, organize, retrieve, export, and settings journeys including edge/error states.
3. Product assessment: feature usefulness, tier clarity, and prioritization adjustments based on observed value and friction.
4. Output: a decision-ready report with concrete remediation actions and roadmap re-prioritization inputs for v2.1. This is also the point at which interaction redesign or IA restructuring — if warranted — gets scoped for v2.1 or later.

v2.0 acceptance gates:

1. Design System 2.0 token migration complete across popup, history, preview, and options before any URL Collector 2.0 or v2 Promotion feature ships.
2. URL Collector v2 features fully functional within existing popup URL panel without layout regression.
3. URL tags and capture tags share a single taxonomy — no divergent tag sets.
4. Smart URL Collections domain view uses registered domain (not full hostname).
5. Smart Save Profiles v2: editable profile CRUD in Settings does not break v1 profile IDs in capture history.
6. All new features behind kill-switch flags.
7. Post-Milestone Full Assessment completed and output documented before v2.1 scope is locked.

---

### v2.1 — Intelligence Layer (Weeks 7–11)

Goal: Ship the highest-leverage Ultra differentiators cheaply. Validate demand for ML Magic Mode before committing to a full implementation. Add new power-user primitives from identified opportunities.

Implementation backlog:

1. **Magic Mode v1 (rule-based)**: domain → profile suggestion using a 50-domain seed dictionary. Local capture history progressively improves suggestions over time. No cloud LLM, no local ML model in v1. One-click override. Override improves next suggestion locally. If v1 drives engagement, v2 (local ML) is considered for v3.0.
2. **Workflow Automations v1 (preset toggles)**: 3–4 hardcoded preset automations in Settings, no generic rule builder. Example presets: "Auto-tag captures from a configured domain as Research", "Weekly: export all Research captures as ZIP", "Capture all new tabs in this window on schedule". Each preset is a toggle. Validate demand before building the rule engine.
3. **Quick Note at Save**: 3-second dismissible prompt in popup after successful capture — "Add a note before saving?" with a one-tap dismiss. Significantly increases metadata quality without changing the capture flow. Pro/Ultra.
4. **Omnibox Actions**: `tc research` (queue current tab as Research profile), `tc star` (star current URL), `tc queue` (queue current tab). Native Chrome omnibox API, no new permissions. Ultra.
5. **Admin Config Profile**: importable JSON file in Settings that pre-sets capability tier, export defaults, and privacy rules. Replaces the cut Enterprise Controls v1. Serves compliance-conscious and team-coordinated power users. Ultra.
6. **NPS prompt at success moments only**: post-capture and post-export only — not on open. Drives Chrome Web Store review velocity without being intrusive.

v2.1 acceptance gates:

1. Magic Mode v1 suggestions are dismissible in one tap and never block the capture flow.
2. Workflow Automation presets are individually toggle-gated with kill switches.
3. Omnibox actions complete in under 200ms for queue/star operations.
4. Admin Config Profile import is validated against schema and rejects malformed files gracefully.
5. All v2.1 features are hidden unless tier is Ultra. No regression on Basic or Pro surfaces.
6. NPS prompt fires after success moments only — no cold-open prompts.

---

### v3.0 — Monitoring & Share (Post-Week 11)

Goal: Transform THE Collector from a passive archive into an active monitoring tool. Introduce file-based sharing. Expand to Firefox and deepen automation if v2.1 demand validates it.

Implementation backlog:

1. **Capture Diff as Monitoring**: scheduled re-capture of a saved URL (using existing queue infrastructure) followed by automatic diff. Notification when change is detected. Serves competitive research, price tracking, and documentation change detection. Transforms the tool from archive to radar. Ultra.
2. **Team Spaces Lite MVP**: export a selected set of captures + metadata as a self-contained `.zip` with embedded `viewer.html`. No backend, no account, no import required on the receiving side. File-based sharing only. Ultra.
3. **Magic Mode v2 (local ML)**: consider only if v2.1 rule-based Magic Mode demonstrably drives engagement. Specify model, bundle-size impact, and accuracy threshold before committing.
4. **Workflow Automations v2 (generic rule builder)**: consider only after v2.1 preset automations validate demand. Full local automation runtime with action graph.
5. **Firefox baseline**: non-trivial architecture work required — Firefox MV3 diverges on background service workers and offscreen documents. Schedule after all other milestones are stable.
6. **URL Workflow Automations** (local rules + schedules for URL collection): deferred from URL Collector 2.0 until core URL features prove retention value.

v3.0 entry gates:

1. v2.1 Post-Milestone Assessment completed with clear signals on Magic Mode and Workflow Automations engagement.
2. Magic Mode v2 and Workflow Automations v2 each require explicit demand validation before scoping begins.
3. Firefox scope requires a dedicated architecture spike before committing to timeline.

---

## 🚀 Shipped Quick Wins Reference (v1.9.x)

For historical record — all features below are delivered and stable:

| Feature                       | Shipped In | Tier  | Notes                                       |
| ----------------------------- | ---------- | ----- | ------------------------------------------- |
| Smart Save Profiles v1        | 1.9.18–38  | Pro   | Fixed presets only; editable v2 in v2.0     |
| History Profile Filter        | 1.9.38     | Pro   | Part of Smart Save Profiles completion      |
| Bulk Actions v1               | 1.9.23     | Pro   | Download + delete; tag/move in v2.0         |
| Weekly Value Report v1        | 1.9.24     | Pro   | Settings card only; popup card in v1.10     |
| Smart Revisit Nudges v1       | 1.9.20     | Pro   | Local evaluator, cadence control            |
| Extension Help Page           | 1.9.35     | Basic | Must stay current with every feature change |
| Capture Queue + Batch Mode v1 | 1.9.28–33  | Pro   | Popup queue + sequential run                |

---

## URL Collector 2.0 — Scoped Feature Decisions

All URL Collector 2.0 features are local-only. Basic URL flow must stay fast and unchanged for Basic tier users. New URL features must pass the same visual and accessibility gates as capture features.

### Scoped ⚠️ features — concrete decisions

**URL Tags:**

- Max 10 tags per URL.
- 8 pre-populated suggestions: Research, Interest, Private (from profile names) + reading, follow-up, reference, archive, later.
- Chip UI on the URL row. Collapsed by default; click row to expand tag chips.
- Free-text entry for tags not in the suggestion list.
- Tags share a single taxonomy with capture tags. No separate URL-only tag management.
- No custom tag management UI in v1. The suggestion list is fixed.
- Tag filter in History and in the URL panel.

**URL Notes:**

- 140-character hard limit — enforces concision, maps to a single-line storage field.
- Interaction: note icon (inactive = no note, active = has note) on each URL row. Click to expand an inline text field. Never always-visible.
- Persisted in IndexedDB alongside the URL record.
- Not linked to capture annotations in v1. URL notes and capture notes are independent.

**Smart URL Collections:**

- Domain-grouping view only. No topic clustering, no ML, no user configuration.
- Implementation: collapsible sections in the "By Domain" URL view, auto-generated from the registered domain of each URL.
- Sections are auto-generated — users cannot create, rename, or manually assign domains.
- Ship this as the "By Domain" tab in Saved URL Views. One feature, not two.

**Revisit Queue for URLs:**

- Folded into Saved URL Views. The `Starred` view IS the Revisit Queue.
- Star a URL → it appears in the Starred filtered view. No inbox-zero mechanics, no snooze, no auto-remove.
- No separate "Revisit Queue" feature. This simplification resolves the interaction model ambiguity.

### Removed from URL Collector 2.0 scope

- **URL Bundle Export Packs** — premature without a sharing story. Absorbed by Team Spaces Lite in v3.0 as its output format.
- **URL Workflow Automations** — deferred to v3.0, contingent on core URL features proving retention value.

### URL Collector execution constraints

1. Local-only + no-tracking rules remain mandatory.
2. Basic URL flow must stay fast and unchanged for Basic tier users.
3. New URL features must pass the same visual and accessibility gates as capture features.
4. If URL and capture roadmaps conflict, resolve in favor of predictable core flows and data integrity.

---

## 🌙 Intelligence Layer — Feature Decisions

### Magic Mode

**v1 (rule-based, ships in v2.1):**

- Domain → profile suggestion using a hardcoded 50-domain seed dictionary.
- Local capture history progressively improves suggestions (domain frequency by profile).
- No cloud LLM, no local ML model, no bundle size impact.
- One-click override from suggestion. Override improves next local suggestion.
- Hidden unless tier is Ultra.

**v2 (local ML, v3.0 contingent):**

- Consider only if v1 demonstrably drives engagement. Must specify: model, install-size delta, accuracy threshold, and fallback behavior before scoping.
- No ML investment without v1 demand validation.

### Workflow Automations

**v1 (preset toggles, ships in v2.1):**

- 3–4 hardcoded preset automations in Settings. Toggle-based, no rule builder.
- Preset examples: "Auto-tag captures from [configured domain] as Research", "Weekly: export all Research captures as ZIP", "Capture all new tabs in this window at [configured time]".
- Each preset has its own kill switch.
- Hidden unless tier is Ultra.

**v2 (rule builder, v3.0 contingent):**

- Generic local automation runtime with action graph. Build only after v1 presets validate demand.

### Removed from Intelligence Layer scope

- **Enterprise Controls v1** — cut. Without a backend, "enterprise" is a label, not a product. The Admin Config Profile (v2.1) covers the actual use case: importable JSON for defaults and privacy rules.
- **Cross-browser (Firefox near-term)** — deferred to v3.0. Firefox MV3 diverges on offscreen documents and service workers. Edge parity (v1.10) is a separate, near-zero-cost effort.

---

## 🎨 Design System 2.0

**Sequencing rule:** Design System 2.0 is v2.0 item #1. Token migration across all four surfaces (popup, history, preview, options) must complete before any URL Collector 2.0 or v2 Promotion feature work begins. This prevents double-building: every v2.0 feature is built on the new token system from day one, and v2.1/v3.0 features inherit it without migration cost.

**Scope boundary:** this is a visual system migration, not a simultaneous interaction redesign. Do not combine token migration with navigation restructuring, IA changes, or new interaction patterns. Those decisions are informed by the Post-Milestone Full Assessment at the end of v2.0. See ADR 0010.

### Tokens

1. Introduce semantic token tiers:

- `--sc-color-surface-{1..4}`
- `--sc-color-brand-{primary,accent,success,warning,danger}`
- `--sc-motion-{quick,base,slow}`
- `--sc-elevation-{0..4}`
- `--sc-radius-{xs,sm,md,lg,pill}`
- `--sc-density-{compact,default,comfortable}`

2. Add interaction tokens:

- focus ring intensity, press depth, hover tint, keyboard-outline contrast floor.

3. Add adaptive theme layers:

- light/dark/system plus dynamic accent packs (non-distracting, disable-able).

### Animations (4 specific, no animation framework)

Ship these four animations exactly. Do not build a motion system; build these four transitions:

1. Capture start pulse: 120ms.
2. Success confetti-lite shimmer: 180ms, subtle.
3. Queued action progress sweep: linear, non-janky.
4. Command palette entrance: scale + opacity, 140ms.

Animation rule: no motion may block primary action path.

### Microcopy

1. Convert status text to "outcome + next step" format.
2. Standardize trust copy for permissions: why needed, what is stored, how to revoke.
3. Add "value language" surfaces: "Saved in 1 click", "You saved 42 min this week".
4. Add explicit in-product complexity copy: "Pro feature" and "Ultra feature" labels tied to the Settings tier selector. Do not use payment language.

### Accessibility

1. WCAG 2.2 AA hard requirement.
2. Full keyboard parity for every new feature.
3. Voice and command palette as complementary accessibility channels.
4. Reduced-motion and reduced-transparency modes in settings.

---

## 🏗️ Technical Architecture

### Migration Plan

1. **Phase A (v1.10): Platform Foundations**

- Implement tier gating as UX complexity preference with no payment enforcement.
- Introduce feature-flag framework.
- Add local-only insights schema (privacy-safe, local-first aggregation, no external transmission).
- Build automation/intent interfaces without changing existing flow contracts.
- Add Settings feature gates with a single capability selector (`basic` / `pro` / `ultra`) and deterministic hierarchical checks.

2. **Phase B (v2.0): User Value Engines**

- **First (Sprint 1 gate):** Complete Design System 2.0 token migration across all surfaces (popup, history, preview, options). All hardcoded values replaced by semantic tokens. Visual regression baseline established. No feature work begins until Sprint 1 is complete.
- Then: Ship URL Collector 2.0, Smart Save Profiles v2, Bulk Actions v2 — all built on the new token system from day one.
- Promote Weekly Value Report to popup surface.

3. **Phase C (v2.1): Intelligence Layer**

- Ship Magic Mode v1 (rule-based), Workflow Automations v1 (presets), Quick Note at Save, Omnibox Actions, Admin Config Profile.
- Keep local-only/no-tracking guardrails mandatory for all roadmap code paths.
- Add integration and policy checks for local-only execution, zero outbound tracking.

4. **Phase D (v3.0): Monitoring & Share**

- Capture Diff as Monitoring, Team Spaces Lite MVP, Firefox baseline.
- Magic Mode v2 and Workflow Automations v2 only if v2.1 demand validates them.

### Performance Targets

1. Popup first interaction p95: `<80ms`.
2. Command execution latency p95: `<50ms`.
3. Bulk action on 200 items p95: `<400ms`.
4. Background memory budget steady-state: `<35MB`.
5. Bundle size budget:

- core UI bundle `<500KB` compressed equivalent target,
- optional AI providers (if any) loaded lazily.

### Testing Strategy

1. Contract tests for message protocol versioning.
2. Deterministic E2E suites for capture, URL flow, bulk operations, automation runs.
3. Visual parity snapshots for all states and themes.
4. Performance CI budgets (fail build on regressions).
5. Chaos tests: permission denial, storage pressure, offline mode, tab lifecycle race conditions.
6. Capability gating tests:

- all tiered features disabled when the required tier is not set,
- all Ultra features disabled when tier is not Ultra,
- tier selector behavior remains deterministic and explicit in Settings UX.

7. Privacy tests:

- zero external network calls for any roadmap feature,
- no tracking identifiers or outbound analytics payloads.

8. Visibility contract: tier gating is render-time exclusion (hidden when unavailable), not disabled-state rendering.
9. Local-only guardrail contract: roadmap feature actions must use shared guardrails to block external URLs and reject tracking-like payload keys.

---

## 📱 Distribution Strategy

### Chrome Web Store → Featured

1. Produce "Featured readiness packet":

- premium screenshots (first 3 show value loop in 10 seconds), concise outcome-led benefits, trust/privacy copy, short demo video.

2. Improve listing conversion:

- lead with outcomes ("Capture any page. Find it instantly. Export it anywhere."), not feature lists.

3. Review velocity plan:

- in-app NPS prompt after success moments only (post-capture, post-export). No cold-open prompts.

### Viral Growth

1. Shareable workflow cards:

- "How I research pages in 2 clicks" — file-based, no server, no account.

2. Weekly report social snippets:

- private by default, explicit share toggle.

### Edge Add-ons Store

1. Submit alongside v1.10 featured-readiness push.
2. Edge parity is near-zero marginal effort given Chromium/MV3 base.

---

## Important Planned Changes or Additions to Public APIs / Interfaces / Types

This section defines forward roadmap interfaces for upcoming milestones and is not a statement
that these interfaces are already shipped in the current release baseline.

1. Message protocol additions:

- `AUTOMATION_RUN_REQUEST`
- `AUTOMATION_RUN_RESULT`
- `INTENT_SUGGEST_REQUEST`
- `INTENT_SUGGEST_RESULT`
- `BULK_MUTATE_REQUEST`
- `BULK_MUTATE_RESULT`

2. Settings schema additions:

- `magicModeEnabled: boolean`
- `defaultCaptureProfileId: string | null`
- `notificationCadence: 'low' | 'balanced' | 'high'`
- `themeDynamicAccent: boolean`
- `capabilityTier: 'basic' | 'pro' | 'ultra'` (single authoritative UX complexity model, not a payment gate)
- `proEnabled: boolean` (derived compatibility field, deprecated)
- `ultraEnabled: boolean` (derived compatibility field, deprecated)
- `adminConfigProfile: object | null` (importable JSON config, Ultra)

3. Data model additions:

- `save_profiles` (extended for editable v2 profiles)
- `automation_rules` (preset automations, v2.1)
- `usage_insights_weekly`
- `url_tags` (shared taxonomy with capture tags)
- `url_notes`

4. Backward compatibility:

- all new fields optional with migration defaults,
- versioned schema migration layer,
- rollback-safe feature flags.

---

## Test Cases and Scenarios

1. Install → onboarding archetype detection → first successful capture in under 60 seconds.
2. Bulk-select 200 items → tag/move/export without UI freeze.
3. Magic Mode v1 ON:

- suggests profile from domain,
- user can override in one click,
- override improves next local suggestion.

4. Workflow Automation preset ON:

- preset runs on trigger,
- user-readable activity note in Settings,
- toggle disables immediately.

5. Weekly report generation offline.
6. Permission-denied flows always give fallback and recovery path.
7. Cross-browser smoke:

- Chrome and Edge parity mandatory.
- Firefox baseline in v3.0 only.

8. Accessibility:

- full keyboard, screen reader labels, reduced motion compliance.

9. Quick Note at Save: appears 3 seconds after capture, dismiss does not block next capture.
10. Omnibox: `tc research` queues the current tab and applies Research profile in under 200ms.
11. Capture Diff as Monitoring: scheduled re-capture runs without user interaction; diff result surfaces in History with change indicator.

---

## Explicit Assumptions and Defaults

1. Existing v1.9.38 quality baseline is stable and preserved.
2. The extension is free forever. No monetization, no payment, no subscriptions — ever.
3. All roadmap features are local-only: no external connections and no tracking export.
4. The tier model (Basic / Pro / Ultra) is a UX complexity preference. It controls feature surface visibility, not access rights.
5. Safari is out of scope.
6. "Zero technical debt" means:

- no undocumented shortcuts,
- no unflagged risky launches,
- no skipped tests for release candidates.

7. Magic Mode v2 (local ML) and Workflow Automations v2 (rule builder) are contingent on v2.1 demand validation. They are not scheduled items.
8. Enterprise Controls v1 is permanently cut. Admin Config Profile (v2.1) covers the real use case.
9. URL Bundle Export Packs are permanently cut as a standalone feature. The use case is covered by Team Spaces Lite in v3.0.
10. Firefox compatibility is v3.0 only, after a dedicated architecture spike.
