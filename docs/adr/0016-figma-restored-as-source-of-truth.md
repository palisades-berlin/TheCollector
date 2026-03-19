# ADR 0016 — Figma Restored as UX/UI Source of Truth

**Date:** 2026-03-19
**Status:** accepted
**Supersedes:** ADR 0015 — Penpot Replaces Figma as Design Source of Truth
**Deciders:** Stefan (maintainer)

---

## Context

ADR 0015 temporarily moved UX/UI authority from Figma to Penpot due tooling and access constraints during DS 2.0 design-phase work.

The project now resumes Figma as the single authoritative design source for UX/UI governance, planning, and implementation mapping.

Penpot work completed during the ADR 0015 window remains part of historical project record and must not be rewritten.

---

## Decision

**Figma is restored as the active UX/UI single source of truth effective immediately.**

- Active governance, planning, and handoff documents must reference Figma as authoritative.
- DS 2.0 design-phase progress is reset to restart/pending under Figma current-state planning.
- ADR 0015 is superseded and retained as historical context only.

---

## Consequences

- `AGENTS.md`, `CLAUDE.md`, `CODEX.md`, `WORKFLOW.md`, and core handoff/policy docs are updated to Figma-first authority.
- Roadmap and master design planning no longer treat Penpot completion as an active gate pass.
- Historical changelog/session entries describing Penpot work remain intact as historical record.
- No runtime feature behavior changes are introduced by this governance reversal.
