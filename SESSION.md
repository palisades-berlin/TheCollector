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

**Key discussion:** To prevent recurring CI breakage, SESSION formatting must be auto-stabilized (`format:session`) and enforced consistently across CI + maintainer checklists.

**Done:**

- Added `npm run format:session` (`prettier --write SESSION.md`) in `package.json`.
- Wired `format:session` into CI quality flow and local `npm run check` before `format:check`.
- Updated pre-commit checklist docs (`AGENTS.md`, `CLAUDE.md`, `docs/dev-workflow.md`) to include `format:session`.
- Moved `README.md` `## Behind the Build` section to a prominent top position.
- Bumped to `1.9.97.0` (tooling/ops hardening + docs sync).

---

## Do next

**Task:** Verify green GitHub CI + CodeQL runs for `1.9.97.0`, then resume Phase 0 Figma unblock and execute `0-A-1` color style tokens.

Where: Figma file `sECUN6qSqUygWoG7PhC548` (`THECollector - UI Kit & Screens`)
What: Phase 0 checklist in master plan §6, steps 0-A through 0-F
Gate: ALL Phase 0 Figma work must be complete and approved before any Phase 1 code begins
First step (GitHub checks track): confirm `1.9.97.0` quality job remains green with `format:session` hardening enabled.
First step after Figma unblock: 0-A-1 — update colour styles (dark mode surface tokens, light mode surface tokens, border tokens).

**Blocker status:** active — Figma seat/capacity blocker prevents MCP execution (`View` + tool-call limit).

---

## Open decisions / blockers

- Figma permission/capacity blocker:
  - file access must be upgraded to `Editor`
  - MCP plan/call allowance must be sufficient for style update + validation pass
- CI follow-up: if `visual_parity` fails on GitHub, calibrate only failing snapshots using measured CI diff evidence and sync exception docs in same cycle.
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

## SESSION.md field guide

| Field                         | Required        | Purpose                                                                    |
| ----------------------------- | --------------- | -------------------------------------------------------------------------- |
| **Date / Tool**               | Always          | Who ran the session                                                        |
| **Key discussion**            | When useful     | One line — mid-session decision or pivot not captured in any commit or ADR |
| **Done**                      | Always          | What was completed                                                         |
| **Do next**                   | Always          | Exact next task                                                            |
| **Open decisions / blockers** | When applicable | Unresolved questions or hard blockers                                      |

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

_Last updated: 2026-03-15 (SESSION formatting hardening + README prominence update; bumped to 1.9.97.0, pending push verification)_
