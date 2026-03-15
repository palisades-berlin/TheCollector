# Session State — THE Collector

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

- Confirmed latest GitHub Actions CI and CodeQL runs are green on commit `748fa2d` after visual calibration fix.
- Investigated remaining red/pending indicator and isolated non-CI cause:
  - third-party `Claude` check suite is stuck in `queued` with zero check-runs on latest commit.
- Applied docs-only trust-signal clarity update:
  - README coverage badge now explicitly indicates threshold semantics (`Coverage Gate ≥90% lines`).
- Ran local docs gate:
  - `npm run test:docs-policy` passed.
- Figma unblock status unchanged: MCP still blocked by seat/plan limits; Phase 0-A-1 remains pending.

---

## Do next

**Task:** Resolve stuck third-party `Claude` queued check in GitHub app settings, then resume Figma unblock track.

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

_Last updated: 2026-03-15 (CI green confirmed; queued third-party check isolated; README coverage badge semantics clarified; Figma unblock still pending)_
