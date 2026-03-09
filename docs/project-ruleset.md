# THE Collector Project Ruleset

Last updated: 2026-03-09
Source import: `/Users/stefan.baumgartl/Downloads/codex_rules.txt`
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

1. Roadmap source of truth is: [/Users/stefan.baumgartl/ClaudeCode/TheCollector/docs/thecollector-2.0-90-day-roadmap.md](/Users/stefan.baumgartl/ClaudeCode/TheCollector/docs/thecollector-2.0-90-day-roadmap.md).
2. Roadmap constraints are fixed: local-only, no external connections, no tracking.
3. Tier model is hierarchical `Basic -> Pro -> Ultra`; feature visibility is hide-only by tier.
4. 30-day features are Pro-tier; 90-day features are Ultra-tier (planned direction, not guaranteed all/ever).
5. Roadmap features must be technically reliable and product-logical before being treated as done.
6. Before implementing new features, run a structured pre-development review of existing code, related components, dependencies, and roadmap conflict risk; prioritize proactive design over reactive fixes.
7. For long-running or multi-tab workflows, prefer service-worker-owned lifecycle/state over popup-owned state.
8. Roadmap delivery is outcome-gated: a feature is done only when technical acceptance and a predefined product outcome signal are both met.
9. Ship smallest useful slice first (v1), and promote to v2 only after v1 quality/adoption review.
10. Tier value integrity is mandatory: Pro/Ultra features must deliver clear incremental user value over Basic.
11. New roadmap features must not degrade core Basic flows (capture, retrieve, export, settings save).
12. Each roadmap phase requires explicit exit gates (quality + UX + product-fit) before the next phase starts.
13. Premium UX bar is mandatory: first-time clarity and low-friction repeat actions in each primary surface.
14. If quality or clarity targets are missed in-cycle, reduce scope and ship a coherent slice instead of confusing partial UX.
15. v2 work is allowed only when v1 is stable, documented, test-covered, and free of unresolved High/Critical UX defects.
16. Before each roadmap item begins, record dependency/conflict checks against shipped features and active phases.
17. After shipping each roadmap feature, add a short product review note (improved, regressed, next adjustment).

## UX/UI & Design System

1. Keep Figma as UX/UI single source of truth: [THECollector - UI Kit & Screens](https://www.figma.com/design/sECUN6qSqUygWoG7PhC548/THECollector---UI-Kit---Screens?t=UVQ55HTnnPvLrqyo-0).
2. UX/UI must match Figma (tokens, spacing, radii, typography, controls, states).
3. Use and maintain a design-token system with step-by-step refactors.
4. Run and enforce UX/UI calibration for roadmap/UI changes both early during development and at final release gate.

## Testing & Release Gates

1. Keep enterprise-grade quality gates strong: functionality, business logic, security, and stability first.
2. Add/expand tests for gating, privacy/security, and stability as complexity grows.
3. Add local-only guardrails in code for new roadmap features.
4. On every code change, bump version in semantic `1.0.0` scheme and keep version files synchronized.
5. For every GitHub release, include the generated extension ZIP artifact.

## Documentation & Wiki Workflow

1. Keep documentation workflows updated and consistent.
2. Sync GitHub Wiki with every commit/push so it remains the active knowledge surface.
3. On every commit/push, update README after `## Overview` with max five top changes.
4. Every feature add/change must update end-user help page: `/Users/stefan.baumgartl/ClaudeCode/TheCollector/docs/help-user-guide.md`.
5. Before architecture/policy changes are finalized, update ADRs when needed.
6. Keep roadmap/help/ADR/README/wiki updates synchronized within the same feature delivery cycle.
7. From now on, update the help guide whenever necessary to reflect UX, feature, tier, or flow changes.

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
