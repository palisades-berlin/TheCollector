# ADR 0010: Design System 2.0 as v2.0 First Item

- **Status:** accepted
- **Date:** 2026-03-11
- **Deciders:** Product, Engineering

---

## Context

THE Collector's v2.0 milestone introduces significant new UI surface area: URL Collector 2.0
(Saved Views, URL Tags, URL Notes, URL Bulk Actions, Smart URL Collections), Smart Save Profiles
v2, and Bulk Actions v2. In parallel, the Design System 2.0 work — semantic token formalization
across all surfaces — was listed as one item among many in the v2.0 backlog.

The question: when should the Design System 2.0 token migration happen relative to feature work?

---

## Decision

**Design System 2.0 is v2.0 Sprint 1 and is a prerequisite gate for all v2.0 feature work.**

No URL Collector 2.0 feature and no v2 Promotion feature may begin implementation until the
Design System 2.0 token migration is complete and a visual regression baseline is established.

---

## Rationale

**Avoid double-building.** Building new features on top of the old hardcoded-value system and
then migrating them to semantic tokens is twice the work. Every v2.0 feature built after the
migration is built on the correct foundation from day one.

**v2.1 and v3.0 inherit, not migrate.** Intelligence Layer, Workflow Automations, and Monitoring
features should land into an already-stable, token-based codebase. If Design System 2.0 slips
to v2.1, those features must be built on the old system and then migrated while simultaneously
delivering new AI/automation complexity — a fragile combination.

**Visual regression baseline.** Completing the migration first produces a clean visual snapshot
of all surfaces. This snapshot becomes the acceptance gate for every subsequent v2.0 feature:
new features pass if they use tokens and do not regress the baseline, not by ad-hoc review.

---

## Scope Boundary

Design System 2.0 Sprint 1 covers:

- Semantic token introduction (`--sc-color-*`, `--sc-motion-*`, `--sc-elevation-*`,
  `--sc-radius-*`, `--sc-density-*`) across popup, history, preview, and options surfaces.
- Component-level refactor: all existing components consume semantic tokens.
- The 4 scoped animations (capture pulse 120ms, success shimmer 180ms, queue sweep, palette
  entrance 140ms).
- WCAG 2.2 AA remediation on the refactored token layer.
- Visual regression baseline snapshots for all surfaces.

Design System 2.0 Sprint 1 explicitly excludes:

- Interaction pattern redesign.
- Information architecture restructuring.
- Navigation model changes.
- New UX flows or screen layouts.

These out-of-scope decisions are informed by the Post-Milestone Full Assessment at the end of
v2.0, not done in parallel with the token migration.

---

## Consequences

- v2.0 timeline must treat Sprint 1 as a hard prerequisite. Feature sprints begin only after
  Sprint 1 acceptance gates are met.
- The Post-Milestone Full Assessment at end of v2.0 is the correct point to scope any
  interaction or IA redesign work for v2.1 or later.
- All v2.1 and v3.0 features inherit the Design System 2.0 token layer without a migration
  cost.
- Figma remains the UX/UI single source of truth (see `docs/project-ruleset.md`). Design tokens
  in code must align with the Figma token definitions at the point of migration.
