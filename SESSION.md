# Session State — THE Collector

Attribution: Implemented with Codex AI, Claude, Perplexity assistance and my fantasy.

> **Rule:** Update this file before every `git push`. It is the handoff between machines and AI tools.
> **How to resume:** `git pull` → read this file → paste the opening prompt below to Claude or Codex.

---

## Current sprint

**v2.0 — Design System 2.0 · Phase 0: Figma Rebuild**
Roadmap ref: `docs/thecollector-2.0-90-day-roadmap.md`
Master plan: `docs/design-overhaul-master-plan-2026-03-13.md`

---

## Last session

**Date:** 2026-03-15
**Tool:** Codex

**Done:**

- Implemented full four-part versioning migration (`X.Y.Z.W`) with baseline `1.9.92.0`.
- Added canonical policy ADR:
  - `docs/adr/0014-four-part-versioning-policy.md`.
- Added version-policy enforcement and anti-regression checks:
  - new `scripts/check-version-policy.mjs` (format/lockstep/changelog/tag/bump-rule validation),
  - new `tests/version-policy.test.mjs`,
  - integrated into `package.json` scripts and CI quality workflow.
- Hardened release scripts for explicit four-part versions and `vX.Y.Z.W` tag validation.
- Updated maintainer/ruleset/workflow docs to four-part policy and migration note, preserving historical three-part changelog entries intentionally.

---

## Do next

**Task:** Verify latest GitHub CI/CodeQL runs are green for `1.9.92.0`, then resume blocked-check and Figma unblock tracks.

Where: Figma file `sECUN6qSqUygWoG7PhC548` (`THECollector - UI Kit & Screens`)
What: Phase 0 checklist in master plan §6, steps 0-A through 0-F
Gate: ALL Phase 0 Figma work must be complete and approved before any Phase 1 code begins
First step (GitHub checks track): disable/reconfigure the `Claude` app check integration or branch-check requirements so head commit status can turn fully green.
First step after Figma unblock: 0-A-1 — update colour styles (dark mode surface tokens, light mode surface tokens, border tokens).

**Blocker status:** active — Figma seat/capacity blocker prevents MCP execution (`View` + tool-call limit).

---

## Open decisions / blockers

- Figma permission/capacity blocker:
  - file access must be upgraded to `Editor`
  - MCP plan/call allowance must be sufficient for style update + validation pass
- CI follow-up: if `visual_parity` still fails on GitHub, calibrate only failing snapshots using measured CI diff evidence and sync exception docs in same cycle.
- S-07/S-08 remain code-precompleted; design work stays pending until Figma unblock is resolved.

---

## Active files (last touched)

| File                                             | Status                                             |
| ------------------------------------------------ | -------------------------------------------------- |
| `docs/design-system-rules.md`                    | ✅ New — full DS spec for Phase 0 Figma            |
| `CLAUDE.md`                                      | ✅ Pre-Commit Checklist added                      |
| `AGENTS.md`                                      | ✅ Pre-Commit Checklist added                      |
| `docs/design-overhaul-master-plan-2026-03-13.md` | ✅ Phase 0-A-1 token values remain source of truth |
| `SESSION.md`                                     | ✅ This file                                       |

---

## Opening prompt (paste this to start any session)

**Claude:**

```
Read CLAUDE.md and SESSION.md, then continue from the last session.
```

**Codex:**

```
Read AGENTS.md and SESSION.md, then continue from the last session.
```

---

_Last updated: 2026-03-15 (four-part versioning migration implemented to 1.9.92.0 with ADR 0014 + CI enforcement; pending push verification)_
