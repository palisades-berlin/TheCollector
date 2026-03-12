# Implementation Plan: URL Library — v2.0 Sprint Work
# Based on: docs/pm-findings-url-library-2026-03-12.md
# Date: 2026-03-12
# Status: DRAFT — pending human review

## PREREQUISITE GATE
Design System 2.0 (ADR 0010) is a hard prerequisite gate: no Sprint 2A/2B/2C URL Collector 2.0 work begins until token migration across popup/history/preview/options is complete and the visual regression baseline is accepted.

## OPEN QUESTIONS
1. Should URL Library be reachable only via `Open URL Library →` in popup URLs, or also from popup top navigation?
- Status: RESOLVED (HUMAN INPUT)
- Decision: 1B — expose URL Library via popup top navigation and `Open URL Library →`, plus full-tab cross-page header nav (`Screenshots · URLs · Settings`).

2. After URL Library ships, should popup URL tab remain quick-capture (add current/add all/recent 5/export), or be replaced by a simple launcher?
- Status: RESOLVED (HUMAN INPUT)
- Decision: keep popup URL tab as quick-capture surface for all tiers (REC-02).

3. Should URL Change Log remain as a sub-tab/drawer inside URL Library, or be removed after URL Library is live?
- Status: RESOLVED (HUMAN INPUT)
- Decision: keep Change Log in URL Library and remove popup panel-swap (REC-03).

4. Is `src/urls/urls.html` the final path and naming convention for the new full-tab URL Library page?
- Status: ANSWERABLE FROM FINDINGS
- Resolution: yes; findings explicitly prescribe `src/urls/urls.html` (REC-01).

5. Is capability key `url_bulk_actions` currently missing from `PRO_FEATURES` and required before feature ship?
- Status: ANSWERABLE FROM FINDINGS
- Resolution: yes; confirmed in `src/shared/capabilities.js` and findings REC-08.

6. Must help surfaces stay in parity for any shipped feature/surface rename?
- Status: ANSWERABLE FROM FINDINGS
- Resolution: yes; mandatory from `docs/dev-workflow.md` Help Rules 1–4.

7. Must all new v2 URL features stay local-only, free-forever, and hide-only gated by tier selector?
- Status: ANSWERABLE FROM FINDINGS
- Resolution: yes; non-negotiable constraints from findings Section 7 and roadmap model.

Resolved decisions for implementation:
1. RESOLVED: URL Library entry uses popup top navigation + `Open URL Library →` button.
2. RESOLVED: keep popup as quick-capture surface and route deep organization to URL Library.
3. RESOLVED: keep URL Change Log, but relocate it from popup panel-swap to URL Library.
4. Use a single header-nav pattern across full-tab surfaces: `Screenshots · URLs · Settings`.

## SPRINT 2A — URL Library Scaffold + Navigation Wiring
### Steps
Execution order (critical path): 2A-01 → (2A-06 + 2A-07 + 2A-08 in parallel) → 2A-02 → 2A-03 → 2A-04 → 2A-05.

1. **2A-01 — Confirm and record Sprint 2A start gate completion (Design System 2.0 accepted).**
- Files affected: `docs/implementation-plan-url-library-v2.0.md` (this plan), `docs/thecollector-2.0-90-day-roadmap.md` (milestone status line), `docs/todo-list.md` (operational tracking entry).
- Findings mapping: prerequisite gate from Section 4 + RULE 7.
- Classification: BOTH ROADMAP + TODO-LIST.
- Dependency: none.

2. **2A-02 — Introduce URL Library full-tab page scaffold as new primary surface for URL organization (Basic base, Pro/Ultra features hidden by capability).**
- Files affected: `manifest.json` (page registration step), `src/urls/urls.html` (new page), `src/urls/urls.js` (new page controller), `src/urls/urls.css` (new page styles), `src/shared/ui.css` (token-consumption only if needed).
- Findings mapping: REC-01, item 11 (manifest registration).
- Classification: ROADMAP UPDATE.
- Dependency: requires 2A-01.

3. **2A-03 — Add first-class `URLs` destination in header navigation across full-tab surfaces.**
- Files affected: `src/history/history.html`, `src/options/options.html`, `src/urls/urls.html`.
- Findings mapping: REC-04, REC-01.
- Classification: ROADMAP UPDATE.
- Dependency: requires 2A-02.

4. **2A-04 — Move Saved URL Views surface ownership from popup to URL Library while preserving existing behavior contract (`All/Starred/Today/By Domain`).**
- Files affected: `src/urls/urls.html`, `src/urls/urls.js`, `src/shared/repos/url-repo.js` (read path reuse only), `src/shared/url-utils.js` (domain grouping reuse).
- Findings mapping: REC-01, roadmap correction item 9.
- Classification: BOTH ROADMAP + TODO-LIST.
- Dependency: requires 2A-02.

5. **2A-05 — Re-scope popup URL panel to quick-capture-only plus `Open URL Library →` entry point without changing core add/copy/export/clear behavior.**
- Files affected: `src/popup/popup.html`, `src/popup/urls-panel.js`, `src/popup/urls/urls-actions.js`, `src/popup/popup.css`.
- Findings mapping: REC-02.
- Classification: ROADMAP UPDATE.
- Dependency: requires 2A-02 and 2A-04.

6. **2A-06 — Add capability key `url_bulk_actions` to Pro gating contract before any bulk action UI ships.**
- Files affected: `src/shared/capabilities.js`, `tests/capabilities.test.mjs`, `docs/thecollector-2.0-90-day-roadmap.md` (feature matrix wording).
- Findings mapping: REC-08.
- Classification: BOTH ROADMAP + TODO-LIST.
- Dependency: requires 2A-01.

7. **2A-07 — Implement keyboard Escape dismiss for URL Change Log on currently shipped surface until popup panel-swap is retired.**
- Files affected: `src/popup/urls/urls-actions.js`, `src/popup/urls/urls-history-view.js`, `tests` (keyboard interaction coverage file to be selected in implementation).
- Findings mapping: REC-07.
- Classification: TODO-LIST ENTRY.
- Dependency: none (can land as early hardening slice).

8. **2A-08 — Fix orphaned URL metadata on remove to keep URL list and IndexedDB metadata consistent.**
- Files affected: `src/popup/urls/urls-actions.js` (remove flow), `src/shared/repos/url-repo.js` (reuse `removeUrlRecordMetadata`), `tests/url-repo.test.mjs` (or URL action integration test file).
- Findings mapping: REC-06.
- Classification: TODO-LIST ENTRY.
- Dependency: none (can land as early hardening slice).

## SPRINT 2B — Rich Features on URL Library Surface
### Steps
Execution order (critical path): 2B-01 + 2B-02 in parallel → 2B-03 → 2B-04 → 2B-05.

1. **2B-01 — Relocate URL Tags UI and tag filter interaction from popup density constraints to full-width URL Library rows.**
- Files affected: `src/urls/urls.html`, `src/urls/urls.js`, `src/urls/urls.css`, `src/shared/repos/url-repo.js` (existing tag persistence contract), `src/shared/capabilities.js` (`url_tags` gate consumption).
- Findings mapping: REC-01, Section 5 surface correction for URL Tags.
- Classification: ROADMAP UPDATE.
- Dependency: requires 2A-02 and 2A-05.

2. **2B-02 — Ship URL Notes UI exclusively in URL Library (140-char inline expandable pattern, popup excluded).**
- Files affected: `src/urls/urls.html`, `src/urls/urls.js`, `src/urls/urls.css`, `src/shared/repos/url-repo.js` (existing note normalize/persist APIs).
- Findings mapping: REC-05.
- Classification: ROADMAP UPDATE.
- Dependency: requires 2A-02.

3. **2B-03 — Ship URL Bulk Actions on URL Library table/list selections with Pro hide-only gate.**
- Files affected: `src/urls/urls.html`, `src/urls/urls.js`, `src/urls/urls.css`, `src/shared/capabilities.js` (consume `url_bulk_actions`), export utility files already used by popup URL export path.
- Findings mapping: REC-01, REC-08.
- Classification: ROADMAP UPDATE.
- Dependency: requires 2A-06 and 2B-01.

4. **2B-04 — Promote URL Change Log into URL Library as sub-tab/drawer and establish focus-return contract from list context.**
- Files affected: `src/urls/urls.html`, `src/urls/urls.js`, `src/popup/urls/urls-history-view.js` (logic reuse or extraction), `src/shared/repos/url-history.js`.
- Findings mapping: REC-01, REC-03.
- Classification: ROADMAP UPDATE.
- Dependency: requires 2A-02 and 2A-07.

5. **2B-05 — Re-run help/docs-policy parity for shipped Sprint 2A/2B user-visible URL surface changes only.**
- Files affected: `docs/help-user-guide.md`, `src/options/options.html` (Help & FAQ), `scripts/check-doc-policy.mjs` (phrase set updates if newly shipped), `CHANGELOG.md`.
- Findings mapping: item 10 + constraints (help parity, docs-policy gate).
- Classification: BOTH ROADMAP + TODO-LIST.
- Dependency: requires 2A-05, 2B-01, 2B-02, 2B-03.

## SPRINT 2C — Naming and Navigation Cleanup
### Steps
Execution order (critical path): 2C-03 in parallel with 2C-01 → 2C-02 → 2C-04 → 2C-05.

1. **2C-01 — Rename user-facing popup `History` label to `Change Log` and align URL operation microcopy consistently.**
- Files affected: `src/popup/popup.html`, `src/popup/urls/urls-actions.js`, `src/popup/urls/urls-history-view.js`, i18n/microcopy locations if present.
- Findings mapping: REC-03.
- Classification: ROADMAP UPDATE.
- Dependency: requires 2B-04.

2. **2C-02 — Rename internal DOM IDs/handles from history-specific names to change-log names to remove future ambiguity.**
- Files affected: `src/popup/popup.html`, `src/popup/urls-panel.js`, `src/popup/urls/urls-actions.js`, `src/popup/urls/urls-history-view.js`, impacted tests/selectors.
- Findings mapping: REC-03.
- Classification: TODO-LIST ENTRY.
- Dependency: requires 2C-01.

3. **2C-03 — Rename screenshot History page title semantics to `Screenshots` while preserving route continuity.**
- Files affected: `src/history/history.html`, any header text source file used by history page.
- Findings mapping: REC-03.
- Classification: ROADMAP UPDATE.
- Dependency: requires 2A-03.

4. **2C-04 — Remove popup panel-swap history mode once URL Library Change Log is live and validated.**
- Files affected: `src/popup/popup.html`, `src/popup/urls-panel.js`, `src/popup/urls/urls-actions.js`, `src/popup/urls/urls-history-view.js` (retire or repurpose).
- Findings mapping: REC-03, REC-02.
- Classification: BOTH ROADMAP + TODO-LIST.
- Dependency: requires 2B-04 and 2C-01.

5. **2C-05 — Complete nomenclature/help cleanup pass for `History` vs `Screenshots` vs `Change Log`.**
- Files affected: `docs/help-user-guide.md`, `src/options/options.html` (Help & FAQ), `docs/thecollector-2.0-90-day-roadmap.md`, `README.md`, `CHANGELOG.md`.
- Findings mapping: REC-03, item 10.
- Classification: BOTH ROADMAP + TODO-LIST.
- Dependency: requires 2C-01, 2C-03, 2C-04.

## BUGS AND DATA INTEGRITY FIXES
### Steps
Execution order (target): B-01 + B-02 + B-03 land in earliest Sprint 2A hardening slice before broad URL Library feature migration.

1. **B-01 (Sprint 2A, urgent hardening) — Fix orphaned metadata on URL remove by invoking metadata deletion in the remove flow and validating no ghost records remain.**
- Files affected: `src/popup/urls/urls-actions.js`, `src/shared/repos/url-repo.js`, `tests/url-repo.test.mjs` and/or popup URL integration test file.
- Findings mapping: REC-06.
- Classification: TODO-LIST ENTRY.
- Dependency: none.

2. **B-02 (Sprint 2A, accessibility hardening) — Add Escape keyboard dismiss for URL Change Log with deterministic focus return target.**
- Files affected: `src/popup/urls/urls-actions.js`, `src/popup/urls/urls-history-view.js`, keyboard accessibility test file.
- Findings mapping: REC-07.
- Classification: TODO-LIST ENTRY.
- Dependency: none.

3. **B-03 (Sprint 2A prerequisite for 2B bulk features) — Add and test `url_bulk_actions` capability gate in shared gating map before any UI render path consumes it.**
- Files affected: `src/shared/capabilities.js`, `tests/capabilities.test.mjs`, roadmap capability matrix entry.
- Findings mapping: REC-08.
- Classification: BOTH ROADMAP + TODO-LIST.
- Dependency: none.

## ROADMAP UPDATE SUMMARY
1. Correct URL Collector 2.0 feature surfaces from `Popup URLs, History` to `URL Library page` for Saved URL Views.
2. Correct URL Collector 2.0 feature surfaces from `Popup URLs, History` to `URL Library page` for URL Tags.
3. Correct URL Collector 2.0 feature surfaces from `Popup URLs, History` to `URL Library page only` for URL Bulk Actions.
4. Correct URL Collector 2.0 feature surfaces from `Popup URLs, History` to `URL Library page only` for URL Notes.
5. Correct Smart URL Collections surface from `History, Sidebar` to `URL Library page` (or `URL Library page + Sidebar` only if product decision is approved).
6. Add explicit Sprint 2A milestone item for `URL Library page scaffold + nav wiring + popup scope reduction`.
7. Add explicit dependency note that 2B features depend on 2A completion and Design System 2.0 gate acceptance.
8. Record naming cleanup outcome: screenshot page labeled `Screenshots`; URL operation log labeled `Change Log`.

## TODO-LIST UPDATE SUMMARY
1. Add operational checklist item: verify Design System 2.0 gate acceptance artifact exists before opening Sprint 2A implementation PRs.
- Done when: gate status is recorded and linked in roadmap + first Sprint 2A PR references it.

2. Add implementation tracking item: create and wire new URL Library page entry points from popup and full-tab header nav.
- Done when: users can open URL Library from popup and from `Screenshots/Settings` nav without dead links.

3. Add hardening item: fix orphaned metadata on URL remove (REC-06).
- Done when: remove action leaves no metadata record for removed URL in indexed store.

4. Add accessibility item: Escape dismiss + focus return for URL Change Log (REC-07).
- Done when: keyboard-only user can enter/exit Change Log and focus returns to origin control.

5. Add gating item: `url_bulk_actions` in capabilities and tests (REC-08).
- Done when: Basic hides bulk actions; Pro/Ultra show it according to existing hide-only contract tests.

6. Add naming migration item: `History` to `Change Log` for URL operation history and `History` to `Screenshots` where applicable.
- Done when: no user-facing ambiguity remains across popup/full-tab/help surfaces.

7. Add docs parity item for each shipped sprint slice.
- Done when: `docs/help-user-guide.md` and `src/options/options.html` FAQ reflect shipped behavior and `npm run test:docs-policy` passes.

## NEW ADRs REQUIRED
1. **ADR: URL Library as canonical URL organizational surface** (required if this redefines roadmap architecture from popup-centric to page-centric ownership).
2. **ADR: URL navigation model and naming semantics** (required if `History`/`Screenshots`/`Change Log` nomenclature and cross-surface nav are standardized as long-term policy).

## HELP DOCUMENTATION IMPACT
1. Sprint 2A: Add/rename navigation destinations (`Screenshots`, `URLs`, `Settings`) and document `Open URL Library →` from popup URLs.
2. Sprint 2A: Update popup URL tab behavior description to quick-capture-only scope; remove references to popup-only view tabs if retired.
3. Sprint 2B: Document URL Notes availability and limits (`140 chars`) on URL Library surface only.
4. Sprint 2B: Document URL Bulk Actions availability and tier visibility (`Pro/Ultra visible`, Basic hidden).
5. Sprint 2B: Document URL Tags and tag filtering on URL Library surface and clarify shared taxonomy contract.
6. Sprint 2C: Replace user-facing `History` references for URL operations with `Change Log`; keep screenshot surface labeled `Screenshots`.
7. Every sprint ship: update both `docs/help-user-guide.md` and `src/options/options.html` Help & FAQ in the same cycle; do not leave one surface stale.
