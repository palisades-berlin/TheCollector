## THE Collector 2.0 — 90-Day Product Evolution Roadmap (Power-User B2C + Freemium)

## Summary

Build a category-defining “research command center” for individuals first, with enterprise rails and cross-browser readiness baked in from day 1.
Goal: make THE Collector feel like a premium Google-grade tool with AI-assisted capture, automation, and visible weekly value.

Locked strategic decisions:

1. Primary focus: **Power-user B2C**.
2. Monetization direction: **Freemium path**.
3. Constraint: preserve current technical quality and keep business logic correctness standards.
4. Execution style: feature flags + progressive rollout + no debt accepted.
5. Privacy/runtime rule: **no external connections, all-local processing, and no user tracking/telemetry export**.
6. Entitlement UX rule: a single Settings selector controls `Basic` / `Pro` / `Ultra`; 30-day features default to **Pro** unless explicitly promoted to **Ultra**, and all 90-day moonshots require **Ultra**.
7. Delivery certainty rule: **Pro** and **Ultra** tracks are intended roadmap directions, but not every listed feature is guaranteed to ship, and some may ship later than this plan (or be deferred).

Premium product delivery guardrails:

1. Outcome-gated delivery: a roadmap item is complete only when technical acceptance and a predefined product outcome signal are both met.
2. Slice-to-scale policy: ship smallest useful slice first (v1), then promote to v2 only after v1 quality and adoption review.
3. Tier value integrity: Pro/Ultra features must provide clear incremental value over Basic.
4. Core UX protection: roadmap work must not degrade core Basic flows (capture, retrieve, export, settings save).
5. Phase exit gates: each phase requires explicit quality + UX + product-fit exits before next phase starts.
6. Premium usability bar: first-time clarity and low-friction repeat actions are mandatory in primary surfaces.
7. De-scope discipline: if quality/clarity targets are missed in-cycle, reduce scope and ship a coherent slice.
8. v1→v2 promotion contract: v2 work proceeds only when v1 is stable, documented, test-covered, and free of unresolved High/Critical UX defects.
9. Pre-start dependency checkpoint: each roadmap item records dependency/conflict checks against shipped features and active phases.
10. Post-release product review: each shipped roadmap feature records what improved, what regressed, and what to adjust next.

North-star outcomes by day 90:

1. WAU: +40% (minimum).
2. D7 retention: +25%.
3. Capture-to-revisit loop completion: +50%.
4. Perceived value uplift: 3x (weekly value report + automation outcomes).
5. Paid conversion readiness: clear premium SKU with $5–10/mo willingness.

### Persisted Roadmap Progress Baseline (as of 2026-03-09)

Implemented roadmap features and current delivery level:

1. Smart Save Profiles: **v1 completed** (`1.9.18` through `1.9.38`) across Popup + Settings + History.
2. Smart Revisit Nudges: **v1 delivered** (`1.9.20`).
3. Bulk Actions: **v1 delivered slice** (`1.9.23`).
4. Weekly Value Report: **v1 delivered slice** (`1.9.24`).
5. Capture Queue + Batch Mode: **v1 delivered slice + hardening fixes** (`1.9.28` through `1.9.33`).
6. Extension Help Page: **v1 delivered slice** (docs + Settings `Help & FAQ` section in `1.9.35`).

Versioning status:

1. Current release baseline: **`1.9.38`**.
2. No roadmap **v2** feature is fully shipped yet.
3. Smart Save Profiles editable management remains planned for a later phase (not in v1 completion scope).

---

## Capability Tier Matrix and Execution Backlog (Basic / Pro / Ultra)

Authoritative visibility contract:

1. `basic` sees only Basic features.
2. `pro` sees Basic + Pro features.
3. `ultra` sees Basic + Pro + Ultra features.
4. Gated features are hidden in UI when unavailable (not rendered disabled).

### Feature-to-Tier Matrix (Current 2.0 planning scope)

| Feature Area   | Feature                                                                                          | Tier  | Primary Surfaces                 | Visibility Rule             |
| -------------- | ------------------------------------------------------------------------------------------------ | ----- | -------------------------------- | --------------------------- |
| Core capture   | Save current page, add note, tags, collection select                                             | Basic | Popup, Sidebar                   | Always visible              |
| Core retrieval | Search, filter, sort, open, copy, delete                                                         | Basic | Sidebar, History                 | Always visible              |
| Core settings  | Account, sync toggle, data import/export, shortcuts base                                         | Basic | Settings                         | Always visible              |
| Core preview   | Save PNG/JPG/PDF, copy image, PDF size select                                                    | Basic | Preview                          | Always visible              |
| Quick wins     | Smart Save Profiles                                                                              | Pro   | Popup, Settings                  | Hidden unless tier >= Pro   |
| Quick wins     | History profile filter                                                                           | Pro   | History, Sidebar                 | Hidden unless tier >= Pro   |
| Quick wins     | Bulk Actions v1                                                                                  | Pro   | History, Sidebar                 | Hidden unless tier >= Pro   |
| Quick wins     | Weekly Value Report (delivered v1: Settings card; Sidebar later)                                 | Pro   | Settings, Sidebar                | Hidden unless tier >= Pro   |
| Quick wins     | Smart Revisit Nudges                                                                             | Pro   | Settings, Popup                  | Hidden unless tier >= Pro   |
| Quick wins     | Capture Queue + Batch Mode (delivered v1: popup queue + sequential run; history expansion later) | Pro   | Popup, History                   | Hidden unless tier >= Pro   |
| Quick wins     | Command Palette (`Cmd/Ctrl+K`)                                                                   | Ultra | Popup, Sidebar, History, Preview | Hidden unless tier >= Ultra |
| Moonshots      | Magic Mode                                                                                       | Ultra | Popup, Sidebar                   | Hidden unless tier >= Ultra |
| Moonshots      | Workflow Automations                                                                             | Ultra | Sidebar, Settings                | Hidden unless tier >= Ultra |
| Moonshots      | Cross-browser core controls                                                                      | Ultra | Settings, Runtime surfaces       | Hidden unless tier >= Ultra |
| Moonshots      | Team Spaces Lite                                                                                 | Ultra | Sidebar, Preview, Settings       | Hidden unless tier >= Ultra |
| Moonshots      | Enterprise Controls v1                                                                           | Ultra | Settings, History                | Hidden unless tier >= Ultra |

Roadmap certainty note:

1. Pro and Ultra tracks are planned roadmap directions.
2. Features listed for Pro/Ultra are candidates and may ship in phases, be deferred, or change scope.
3. Tier model remains fixed even if individual feature timelines shift.
4. Settings IA must be revisited in a later development phase for a second structural calibration pass after additional Pro/Ultra features land.

### Phase Execution Backlog (Decision-Ready)

#### Phase 1: Tier Core (Settings + Capability Layer)

1. Add single authoritative tier setting (`basic | pro | ultra`) with legacy compatibility mapping.
2. Replace independent Pro/Ultra booleans with hierarchical checks.
3. Update Settings UI to one tier selector and inheritance helper copy.
4. Enforce hide-only rendering contract in shared gating helpers.
5. Add migration and tier-visibility tests.

Primary implementation surfaces:

- Shared settings and capability layer.
- Settings UI.

#### Phase 2: Popup + History Gating Integration

1. Wire Popup gated features: Smart Save Profiles, Smart Nudges, Queue/Batch controls, and the Ultra commands entry.
2. Wire History Pro features: profile filter, bulk actions, and associated action bars.
3. Keep all Basic flows unchanged and always visible.
4. Add surface tests for Basic/Pro/Ultra visibility permutations.

Primary implementation surfaces:

- Popup UI/state composition.
- History/Sidebar action composition.

#### Phase 3: Preview + Settings Advanced Gating

1. Preserve all current Preview core export controls as Basic.
2. Gate Ultra add-ons (future Team Spaces and automation-linked actions) by tier.
3. Expose Weekly Value Report and automation settings panels by tier.
4. Add guardrail tests to ensure hidden surfaces are not mounted below required tier.

Primary implementation surfaces:

- Preview action groups and optional advanced panels.
- Settings advanced sections.

#### Phase 4: Moonshot Surface Rollout (Ultra-first behind flags)

1. Introduce Magic Mode, Workflow Automations, Team Spaces Lite, Enterprise Controls v1 behind Ultra plus feature flags.
2. Keep local-only/no-tracking guardrails mandatory for all roadmap code paths.
3. Add integration and policy checks for local-only execution, zero outbound tracking.
4. Gate release of each moonshot by quality/visual/security/performance CI.

Primary implementation surfaces:

- Sidebar and Settings (primary Ultra hubs), with targeted Popup/Preview integration.

#### Phase 5: Settings IA Revisit (Later-Stage)

1. Reassess section grouping and navigation after more roadmap features are implemented.
2. Rebalance “Daily Essentials” vs advanced sections based on real feature density and user workflows.
3. Run a dedicated UX/UI calibration pass for Settings structure and interaction hierarchy.
4. Keep existing behavior contracts and settings schema stable during this IA revisit.

---

## 🚀 30-DAY QUICK WINS

Gating rule for this section:

- Most features listed below are available when the Settings capability tier is `pro` or `ultra`, unless a row explicitly requires `ultra`.
- Roadmap certainty note: items are planned candidates for phased Pro/Ultra rollout, but not all items are guaranteed to ship.

| Feature                                                                                                               | Effort | Impact                                        | Chrome APIs Needed                    |
| --------------------------------------------------------------------------------------------------------------------- | -----: | --------------------------------------------- | ------------------------------------- |
| Smart Save Profiles (one-click presets: “Research”, “Interest”, “Private”)                                            |      M | Faster repeated use, +15% weekly sessions     | `storage`, `contextMenus`, `commands` |
| History profile filter (filter captures by `Research` / `Interest` / `Private`)                                       |      S | Faster retrieval and review in History        | `storage`                             |
| Bulk Actions v1 (delivered slice: history multi-select + bulk download/delete; tag/move later)                        |      M | Power-user lift, +20% task completion speed   | `storage`, `downloads`                |
| Weekly Value Report (local insights: time saved, pages captured, top domains)                                         |      S | Immediate perceived ROI, +10% retention       | `storage`, `alarms`, `notifications`  |
| Smart Revisit Nudges (low-noise reminders based on unfinished items)                                                  |      S | Return frequency increase                     | `alarms`, `notifications`, `storage`  |
| Extension Help Page (end-user help + feature/tier guidance)                                                           |      S | Faster onboarding and fewer support questions | none new (content + docs)             |
| Featured-Ready UX polish pack (store assets, onboarding clarity, permission trust copy)                               |      S | Chrome Web Store featuring probability        | none new (content + design)           |
| Capture Queue + Batch Mode (delivered v1: popup queue + sequential run; capture-all selected/history expansion later) |      M | Major power-user throughput win               | `tabs`, `activeTab`, `scripting`      |
| Zero-friction keyboard command palette (`Cmd/Ctrl+K`)                                                                 |      M | “Ultra” feel, faster action discovery         | `commands`, `storage`                 |

30-day acceptance gates:

1. Popup p95 interactive in under 100ms.
2. No increase in crash/error rate.
3. All new features behind kill-switch flags.
4. Visual parity tests green and accessibility checks pass.
5. All quick-win capabilities are inaccessible unless Settings capability tier meets the required row-level tier.
6. Smart Save Profiles remain fixed presets in v1; user-editable profile management is planned for a later phase.
7. End-user help page is updated whenever a roadmap feature changes UX, flow, or tier availability.

### URL Collector 2.0 Track (Planned)

Purpose: make URL collection a first-class product lane, not only a support feature for screenshots.

#### 30-day URL Collector candidates (Pro unless stated)

| Feature                                                       | Tier  | Surfaces            | Value signal                              |
| ------------------------------------------------------------- | ----- | ------------------- | ----------------------------------------- |
| Saved URL Views (`All`, `Today`, `Starred`, `By Domain`)      | Basic | Popup URLs, History | Faster retrieval and repeat visits        |
| URL tags + quick tag chips                                    | Pro   | Popup URLs, History | Better organization for high-volume users |
| URL bulk actions (`copy/export/delete/open`)                  | Pro   | Popup URLs, History | Higher throughput for power users         |
| URL notes (short context per URL)                             | Pro   | Popup URLs, History | Better context retention                  |
| Command Palette URL actions (`collect`, `copy all`, `export`) | Ultra | Popup, History      | Reduced action time and discoverability   |

#### 90-day URL Collector moonshots (Ultra)

| Feature                                                      | Tier  | Surfaces          | Value signal                    |
| ------------------------------------------------------------ | ----- | ----------------- | ------------------------------- |
| Smart URL Collections (local auto-group by topic/domain)     | Ultra | History, Sidebar  | Reduced manual sorting effort   |
| URL workflow automations (local rules + schedules)           | Ultra | Settings, Sidebar | Repeatable high-value workflows |
| Revisit Queue for URLs (priority inbox for unread/old links) | Ultra | Popup, History    | Better revisit loop completion  |
| URL bundle export packs (research package templates)         | Ultra | History, Preview  | Sharing-ready output quality    |

URL Collector execution constraints:

1. Local-only + no-tracking rules remain mandatory.
2. Basic URL flow must stay fast and unchanged for non-paying users.
3. New URL features must pass the same visual and accessibility gates as capture features.
4. If URL and capture roadmaps conflict, resolve in favor of predictable core flows and data integrity.

### Post-30-Day Full Assessment (Mandatory)

After completing the 30-day feature wave, run a full reassessment before continuing moonshots:

1. UX/UI assessment: visual consistency, design-system parity, accessibility, and interaction clarity across all extension surfaces.
2. User-flow assessment: end-to-end flow quality for capture, organize, retrieve, export, and settings journeys (including edge/error states).
3. Product assessment: feature usefulness, tier clarity (`Basic/Pro/Ultra`), and prioritization adjustments based on observed value and friction.
4. Output: a decision-ready report with concrete remediation actions and roadmap re-prioritization inputs for the next phase.

---

## 🌙 90-DAY MOONSHOTS

Gating rule for this section:

- Every feature listed below is only available when the Settings capability tier is `ultra`.
- Roadmap certainty note: items are planned candidates for Ultra rollout, but not all items are guaranteed to ship.

| Feature                                                                              | Tech Stack                                                             | UX Innovation                            | Revenue Potential                 |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | ---------------------------------------- | --------------------------------- |
| Magic Mode (intent prediction: auto-collection, smart naming, suggested next action) | Intent engine (rules + lightweight local model), no cloud LLM fallback | “Zero-config assistant” in popup/sidebar | High: premium core differentiator |
| Workflow Automations (If-this-then-that inside extension)                            | Local automation runtime + scheduler + action graph                    | Users build repeatable capture pipelines | High: pro tier anchor             |
| Cross-browser core (Edge parity + Firefox compatibility baseline)                    | Adapter layer for browser APIs + build targets                         | Consistent UX beyond Chrome              | Medium: TAM expansion             |
| Team Spaces Lite (shareable bundles + exported board links)                          | Local-first model + signed local share payloads (import/export only)   | Viral collaboration loop                 | High: upsell bridge to B2B        |
| Enterprise Controls v1 (privacy mode, policy presets, audit export)                  | Policy schema + admin config profile + compliance templates            | Trust-first enterprise adoption          | High: B2B revenue lane            |

90-day moonshot release principle:

1. Ship “usable first slice” by day 60.
2. Expand depth by day 90 with local outcome-review gates (no outbound telemetry).
3. Keep all moonshots reversible behind local feature flags.
4. All moonshot capabilities are inaccessible unless Settings capability tier is `ultra`.

---

## 🎨 Design System 2.0

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

### Animations

1. Replace generic motion with purpose-driven transitions:

- capture start pulse (120ms)
- success confetti-lite shimmer (180ms, subtle)
- queued action progress sweep (linear, non-janky)
- command palette entrance (scale + opacity, 140ms)

2. Animation rule: no motion may block primary action path.

### Microcopy

1. Convert status text to “outcome + next step” format.
2. Standardize trust copy for permissions: why needed, what is stored, how to revoke.
3. Add “value language” surfaces: “Saved in 1 click”, “You saved 42 min this week”.
4. Add explicit in-product capability copy: “Pro feature” and “Ultra feature” labels tied to the Settings tier selector.

### Accessibility

1. WCAG 2.2 AA hard requirement.
2. Full keyboard parity for every new feature.
3. Voice and command palette as complementary accessibility channels.
4. Reduced-motion and reduced-transparency modes in settings.

---

## 🏗️ Technical Architecture

### Migration Plan

1. **Phase A (Days 1–20): Platform Foundations**

- Introduce feature-flag framework.
- Add local-only insights schema (privacy-safe, local-first aggregation, no external transmission).
- Build automation/intent interfaces without changing existing flow contracts.
- Add Settings feature gates with a single capability selector (`basic` / `pro` / `ultra`) and deterministic hierarchical checks.

2. **Phase B (Days 21–50): User Value Engines**

- Ship Smart Save Profiles, Bulk Actions, Weekly Value Report.
- Add AI tag suggestion pipeline (local-first).
- Add Ultra commands and queue orchestration.

3. **Phase C (Days 51–75): Monetization + Differentiation**

- Ship Magic Mode beta.
- Introduce premium entitlement checks (non-blocking for free core).
- Add Team Spaces Lite beta sharing primitives.

4. **Phase D (Days 76–90): Enterprise + Scale**

- Policy presets, audit export, data governance controls.
- Cross-browser adapter hardening and release prep.
- Store featuring package finalization.

### Performance Targets

1. Popup first interaction p95: `<80ms`.
2. Command execution latency p95: `<50ms`.
3. Bulk action on 200 items p95: `<400ms`.
4. Background memory budget steady-state: `<35MB`.
5. Bundle size budget:

- core UI bundle `<500KB` compressed equivalent target,
- optional AI providers loaded lazily.

### Testing Strategy

1. Contract tests for message protocol versioning.
2. Deterministic E2E suites for capture, URL flow, bulk operations, automation runs.
3. Visual parity snapshots for all states and themes.
4. Performance CI budgets (fail build on regressions).
5. Chaos tests:

- permission denial,
- storage pressure,
- offline mode,
- tab lifecycle race conditions.

6. Capability gating tests:

- all tiered 30-day features disabled when the required feature tier is OFF,
- all 90-day features disabled when `Ultra` is OFF,
- `Ultra` behavior remains independent and explicit in Settings UX.

7. Privacy tests:

- zero external network calls for roadmap features,
- no tracking identifiers or outbound analytics payloads.

8. Visibility contract:

- tier gating is render-time exclusion (hidden when unavailable), not disabled-state rendering.

9. Local-only guardrail contract:

- roadmap feature actions must use shared guardrails to block external URLs and reject tracking-like payload keys.

---

## 📱 Distribution Strategy

### Chrome Web Store → Featured

1. Produce “Featured readiness packet”:

- premium screenshots, concise benefits, trust/privacy copy, short demo video.

2. Improve listing conversion:

- first 3 screenshots show value loop in 10 seconds.

3. Review velocity plan:

- in-app NPS prompt after success moments only.

### Viral Growth

1. Shareable workflow cards:

- “How I research pages in 2 clicks”.

2. Weekly report social snippets:

- private by default, explicit share toggle.

3. Template marketplace seed:

- 10 high-value save/automation templates.

### Enterprise Motion

1. “Collector for Teams” landing and waitlist.
2. Admin pilot kit:

- policy presets + compliance mapping + deployment guide.

3. B2B funnel:

- individual power users invite teammates,
- upgrade trigger at collaboration threshold.

---

## Important Changes or Additions to Public APIs / Interfaces / Types

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
- `capabilityTier: 'basic' | 'pro' | 'ultra'` (single authoritative entitlement model)
- `proEnabled: boolean` (derived compatibility field, deprecated)
- `ultraEnabled: boolean` (derived compatibility field, deprecated)

3. Data model additions:

- `save_profiles`
- `automation_rules`
- `usage_insights_weekly`
- `team_share_payloads` (if enabled)

4. Backward compatibility:

- all new fields optional with migration defaults,
- versioned schema migration layer,
- rollback-safe feature flags.

---

## Test Cases and Scenarios

1. Install → onboarding archetype detection → first successful capture in under 60 seconds.
2. Bulk-select 200 items → tag/move/export without UI freeze.
3. Magic Mode ON:

- predicts profile,
- user can override in one click,
- override improves next prediction.

4. Automation execution:

- scheduled capture runs,
- failure retries,
- user-readable audit trail.

5. Weekly report generation offline and online.
6. Permission-denied flows always give fallback and recovery path.
7. Cross-browser smoke:

- Chrome and Edge parity mandatory,
- Firefox baseline compatibility for core flows.

8. Accessibility:

- full keyboard, screen reader labels, reduced motion compliance.

---

## Explicit Assumptions and Defaults

1. Existing v1.9.34 quality baseline is stable and preserved.
2. Freemium is introduced without degrading free core utility.
3. All roadmap features are local-only: no external connections and no tracking export.
4. Safari is scoped as a design/feasibility track in 90 days, not guaranteed GA.
5. “Zero technical debt” means:

- no undocumented shortcuts,
- no unflagged risky launches,
- no skipped tests for release candidates.

6. Enterprise compliance starts with automation-friendly controls and auditability, then expands to formal certifications post-90 days.
7. Pro/Ultra availability is planned, but final feature scope and timing remain subject to validation, capacity, and product prioritization.
