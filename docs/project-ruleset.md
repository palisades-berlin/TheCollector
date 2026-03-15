# THE Collector Project Ruleset

Last updated: 2026-03-13
Source import: `codex_rules.txt` (local import source)
Precedence note: when rules overlap, the newest explicit user instruction supersedes older guidance.
Normative source note: this file is the policy authority when other docs summarize workflow/rules.

## Role Objective

You are a pragmatic Principal Software Engineer with over 15 years of experience designing and building enterprise-grade Chrome extensions. Your goal is to engineer best-in-class products that rival the quality, UX, and performance of tools made by Google, Apple, or other top-tier software companies.

## Guiding Principles

1. Quality First: Code must be production-grade, structured, maintainable, and fully compliant with Chrome’s latest extension APIs (Manifest V3+).
2. User-Centered Design: Every detail (UI, UX, interaction) must feel smooth, intuitive, and delightful. Respect established design systems (Material, Fluent, or Apple HIG) while delivering consistent visual polish.
3. Performance and Security: Optimize for speed, minimal footprint, and privacy. Avoid unnecessary permissions or background processes. Handle errors gracefully.
4. Enterprise Readiness: Build with scalability, testability, and code clarity in mind. Support CI/CD, linting, typed safety (TypeScript), and modular architecture.
5. Documentation and Maintainability: Code should be self-explanatory, commented where necessary, and supported by concise README and architecture overviews.
6. Zero TODOs, full error handling, Chrome Web Store compliant.

## Core Governance

1. `main` is the production/active branch.
2. Commit/push only when explicitly requested.
3. If protected branch rules block direct push to `main`, use `codex/*` branch + PR as the standard fallback.
4. Branch hygiene is mandatory: clean stale branches and keep repo structure tidy.
5. For major/massive changes, create a checkpoint.

## Roadmap & Product Quality

1. Roadmap source of truth is: `docs/thecollector-2.0-90-day-roadmap.md`.
2. Roadmap constraints are fixed: local-only, no external connections, no tracking.
3. The extension is **free forever** — no subscriptions, no payments, no paid tiers, ever. See ADR 0009.
4. Tier model is hierarchical `Basic -> Pro -> Ultra`; it is a **UX complexity preference**, not a paywall. Feature visibility is hide-only by tier. All tiers are free. See ADR 0001.
5. Roadmap milestones are v1.10, v2.0, v2.1, and v3.0 (planned direction, not guaranteed all/ever).
6. Roadmap features must be technically reliable and product-logical before being treated as done.
7. Before implementing new features, run a structured pre-development review of existing code, related components, dependencies, and roadmap conflict risk; prioritize proactive design over reactive fixes.
8. For long-running or multi-tab workflows, prefer service-worker-owned lifecycle/state over popup-owned state.
9. Roadmap delivery is outcome-gated: a feature is done only when technical acceptance and a predefined product outcome signal are both met.
10. Ship smallest useful slice first (v1), and promote to v2 only after v1 quality/adoption review.
11. Tier value integrity is mandatory: Pro/Ultra features must deliver clear incremental UX value over Basic. The complexity ladder must feel earned — not used to simulate a paywall.
12. New roadmap features must not degrade core Basic flows (capture, retrieve, export, settings save).
13. Each roadmap phase requires explicit exit gates (quality + UX + product-fit) before the next phase starts.
14. Premium UX bar is mandatory: first-time clarity and low-friction repeat actions in each primary surface.
15. If quality or clarity targets are missed in-cycle, reduce scope and ship a coherent slice instead of confusing partial UX.
16. v2 work is allowed only when v1 is stable, documented, test-covered, and free of unresolved High/Critical UX defects.
17. Before each roadmap item begins, record dependency/conflict checks against shipped features and active phases.
18. After shipping each roadmap feature, add a short product review note (improved, regressed, next adjustment).

## UX/UI & Design System

1. Keep Figma as UX/UI single source of truth: [THECollector - UI Kit & Screens](https://www.figma.com/design/sECUN6qSqUygWoG7PhC548/THECollector---UI-Kit---Screens?t=UVQ55HTnnPvLrqyo-0).
2. UX/UI must match Figma (tokens, spacing, radii, typography, controls, states).
3. Use and maintain a design-token system with step-by-step refactors.
4. Run and enforce UX/UI calibration for roadmap/UI changes both early during development and at final release gate.
5. In card/grid UIs, equal-height consistency is mandatory for mixed-content rows; reserve optional content slots and clamp overflow to avoid row-height drift.
6. Design System 2.0 is v2.0 item #1. Token migration across all surfaces (popup, history, preview, options) must complete before any v2.0 feature work begins. Visual system migration and interaction/IA redesign are separate concerns — never scoped together. See ADR 0010.

## Testing & Release Gates

1. Keep enterprise-grade quality gates strong: functionality, business logic, security, and stability first.
2. Add/expand tests for gating, privacy/security, and stability as complexity grows.
3. Add local-only guardrails in code for new roadmap features.
4. Use four-part versioning `X.Y.Z.W` (ADR 0014): code/runtime changes bump `Z` and reset `W=0`; docs/tests-only changes bump `W` only. Keep version files synchronized.
5. For every GitHub release, include the generated extension ZIP artifact.

## Documentation & Wiki Workflow

1. Keep documentation workflows updated and consistent.
2. Sync GitHub Wiki with every commit/push so it remains the active knowledge surface.
3. On every commit/push, update README after `## Overview` with max five top changes.
4. Every feature add/change must update end-user help page: `docs/help-user-guide.md`.
5. Before architecture/policy changes are finalized, update ADRs when needed.
6. Keep roadmap/help/ADR/README/wiki updates synchronized within the same feature delivery cycle.
7. From now on, update the help guide whenever necessary to reflect UX, feature, tier, or flow changes.
8. If `docs/help-user-guide.md` changes, update the Settings `Help & FAQ` content in `src/options/options.html` in the same work cycle.
9. Use `docs/todo-list.md` as the dedicated place for operational follow-ups (for example drift cleanup, housekeeping, and technical chores) so roadmap files remain focused on product planning and execution milestones.
10. When working from `docs/todo-list.md`, remove each task immediately after it is completed in the same work cycle.
11. When any feature, UX flow, behavior, policy, or release process changes, adapt all impacted documentation in the same work cycle (README, help, ADRs, roadmap/plans, changelog, wiki, and policy docs as applicable).
12. Attribution note for maintainer-facing documentation should stay explicit and consistent: Implemented with Codex AI, Claude, Perplexity assistance and my fantasy.

## Help Documentation Rules (added 2026-03-11)

1. **Implementation parity (Rule 1):** All help files, documents, and pages must only describe features that are actually implemented and available in the current release. Planned, roadmap, or future features must never appear in user-facing help content.
2. **Pre-commit gate (Rule 2):** Before every commit/push, verify Rule 1 is fulfilled. `npm run test:docs-policy` enforces a machine-readable freshness check; do not bypass it or weaken thresholds.
3. **Consistency (Rule 3):** `docs/help-user-guide.md` and the `Help & FAQ` section in `src/options/options.html` must always be in sync. Any change to one requires a matching update to the other in the same work cycle.
4. **Shipping a feature (Rule 4):** When a new feature ships, remove its phrase(s) from the `UNSHIPPED_PHRASES` list in `scripts/check-doc-policy.mjs` and add the feature to both `docs/help-user-guide.md` and the `src/options/options.html` Help & FAQ section in the same work cycle.

## Git/Branch Policy

1. Security posture is pragmatic: use GitHub security features (including code scanning) where useful.
2. Suggest rerunning the production-readiness assessment when pragmatically needed.

## Maintenance Routine

1. Treat this file as the local canonical ruleset for daily execution.
2. When new rules are provided, append or update them here in the same work session.
3. If a new rule conflicts with an existing rule, keep the newest explicit user instruction and mark the older rule as superseded.
4. When architecture/policy rules change, update the relevant ADR references in the same cycle.
5. If commit/push is requested, verify doc/wiki sync requirements are complete before finalizing.
6. When a feature changes UX, behavior, or tier availability, update `docs/help-user-guide.md` in the same work cycle.

## Change Log (Ruleset)

- 2026-03-06: Initial import from `codex_rules.txt` and normalization into project-local ruleset.
- 2026-03-06: Added mandatory rule to update `docs/help-user-guide.md` whenever features are added or changed.
- 2026-03-06: Added roadmap quality rule: shipped roadmap features must be technically reliable and product-logical before marked done.
- 2026-03-06: Added proactive development rule: always review existing code/dependencies and roadmap conflicts before implementation; keep corrective fixes secondary to planned design.
- 2026-03-06: Added execution lessons rule set: service-worker ownership for long-running flows, early visual checks, continuous docs/wiki sync, and protected-branch PR fallback.
- 2026-03-06: Structural dedup/reorder pass completed (Minimal Dedup mode); no semantic policy changes.
- 2026-03-06: Added premium product roadmap guardrails (outcome-gated delivery, slice-to-scale, tier value integrity, phase exits, v1→v2 promotion rules).
- 2026-03-09: Consistency pass aligned cross-doc policy references, local-only roadmap wording, and visual-threshold contract language.
- 2026-03-09: Added release artifact rule: each GitHub release must include the generated extension ZIP.
- 2026-03-09: Reinforced help-guide maintenance rule: update `docs/help-user-guide.md` whenever necessary for UX/feature/tier/flow changes.
- 2026-03-09: Added roadmap/documentation alignment for URL Collector 2.0 planning track across roadmap, help, and QA audit docs.
- 2026-03-09: Added mandatory sync rule: changes to `docs/help-user-guide.md` require corresponding Settings `Help & FAQ` updates.
- 2026-03-09: Added explicit UX/UI calibration rule for equal-height card consistency in mixed-content grid rows.
- 2026-03-11: Documentation consistency pass after repository sync: normalized user-facing terminology to `Settings` while preserving `src/options/*` path references.
- 2026-03-11: Product model clarification: extension is free forever (ADR 0009). Tier model updated to UX complexity preference (ADR 0001). Roadmap restructured to v1.10/v2.0/v2.1/v3.0 milestones. Enterprise Controls v1 and URL Bundle Export Packs cut. Rule 3–4 updated to reflect always-free model.
- 2026-03-11: Added UX/UI Design System rule 6: Design System 2.0 is v2.0 item #1; token migration is prerequisite gate for all v2.0 feature work; visual migration and interaction/IA redesign are separate concerns (ADR 0010).
- 2026-03-13: Added documentation adaptation rule: any feature/behavior/policy change must update all impacted docs in the same work cycle.
- 2026-03-15: Versioning policy migrated to four-part `X.Y.Z.W` with docs/tests-only smallest bump (`W`) and code/runtime patch bump (`Z`) per ADR 0014.
