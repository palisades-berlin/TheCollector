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

**Date:** 2026-03-13
**Tool:** Codex

**Done:**
- Executed Phase 0 access-unblock validation package for Figma:
  - `mcp__figma__whoami` confirms authenticated user but current seat is `View` on starter plan.
  - first and follow-up read attempts (`mcp__figma__get_metadata`) both fail with MCP plan/call-limit error.
- Result: unblock checkpoint failed (`permission + capacity` not satisfied), so 0-A-1 token style updates were not executed.
- Applied stop-rule from plan: carry blocker forward and update session handoff instead of forcing partial design work.

---

## Do next

**Task:** Unblock Figma execution capability, then run Phase 0-A-1.

Where: Figma file `sECUN6qSqUygWoG7PhC548` (`THECollector - UI Kit & Screens`)
What: Phase 0 checklist in master plan §6, steps 0-A through 0-F
Gate: ALL Phase 0 Figma work must be complete and approved before any Phase 1 code begins
First step after unblock: 0-A-1 — update colour styles (dark mode surface tokens, light mode surface tokens, border tokens)

**Blocker status:** active — Figma seat/capacity blocker prevents MCP execution (`View` + tool-call limit).

---

## Open decisions / blockers

- Figma permission/capacity blocker:
  - file access must be upgraded to `Editor`
  - MCP plan/call allowance must be sufficient for style update + validation pass
- S-07/S-08 remain code-precompleted; design work stays pending until Figma unblock is resolved.

---

## Active files (last touched)

| File | Status |
|---|---|
| `docs/design-system-rules.md` | ✅ New — full DS spec for Phase 0 Figma |
| `CLAUDE.md` | ✅ Pre-Commit Checklist added |
| `AGENTS.md` | ✅ Pre-Commit Checklist added |
| `docs/design-overhaul-master-plan-2026-03-13.md` | ✅ Phase 0-A-1 token values remain source of truth |
| `SESSION.md` | ✅ This file |

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

*Last updated: 2026-03-13 (Figma unblock validation run; 0-A-1 pending on seat + MCP capacity upgrade)*
