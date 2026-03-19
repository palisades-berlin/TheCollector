# Session State — THE Collector

Attribution: Implemented with Codex AI, Claude, Perplexity assistance and my fantasy.

> **Rule:** Update this file before every `git push`. It is the handoff between machines and AI tools.
> **How to resume:** `git pull` → read this file → check the Tool Router → paste the opening prompt for the right tool.

---

## Session State Rule

<!-- SESSION_RULE:START -->

- **At the end of every session** — before any commit/push — update `SESSION.md` in the repo root with: (1) today's date and tool used, (2) what was completed this session, (3) the exact next task, (4) any open decisions or blockers.
- `SESSION.md` is the handoff file between machines and AI tools. It must always reflect the true current state of the work.
- Keep it short. 5–10 lines under each heading is enough.
<!-- SESSION_RULE:END -->

---

## Current sprint

**v2.0 — Design System 2.0 · Phase 0: Penpot Rebuild**
Roadmap ref: `docs/thecollector-2.0-90-day-roadmap.md`
Master plan: `docs/design-overhaul-master-plan-2026-03-13.md`

---

## Last session

**Date:** 2026-03-19
**Tool:** Claude (Cowork)

**Done:**

- **DS 2.0 Phase 0-F complete** — full Phase 0 review and approval gate passed.
  - All 5 Phase 0 Penpot pages verified: Component Library (18 boards), Headers (5 boards), Command Bars (6 boards), Cards & Rows (5 boards), Tier Density (3 boards).
  - Spec compliance confirmed: glass fills, nav active pill, tier height annotations, stagger signals.
  - Stray `0-D-1` ghost on DS 2.0 — Headers page removed.
  - Sign-off recorded in `docs/design-overhaul-master-plan-2026-03-13.md`.
- **Phase 0 is fully complete. Phase 1 code may proceed (Codex task).**

---

## Do next

**Task (Codex):** Phase 1 — Quick Wins: Visual + UX (v1.10, CSS/HTML only).
See `docs/design-overhaul-master-plan-2026-03-13.md` § PHASE 1 for full scope (QW-01 through QW-08, V-01, V-02, V-04a, V-06, V-08, V-10, BF-01 through BF-04).

**Blocker status:** none — Phase 0 gate passed ✅. v1.9.97.17 current.

---

## Open decisions / blockers

- Penpot file: `THECollector - UI Kit & Screens`, file key `b19dd3d3-9135-8056-8007-bb5e7d6eb5d4`. ✅
- Penpot MCP running at `http://localhost:4401/mcp`. ✅
- Phase 0 fully complete: 0-A ✅, 0-B ✅, 0-C-1–5 ✅, 0-D-1–5 ✅, 0-E-1–3 ✅, 0-F ✅. Phase 1 code next (Codex).
- Phase 0-C-6 (Profile Usage pills), 0-C-7 (URL Notes UI), 0-C-8 (Popup URL panel redesign) are **pending** — required for Phase 4 gate, not Phase 1.
- Phase 0-A pending items: 0-A-3 (elevation/shadow), 0-A-5 (glass component variants), 0-A-6 (glass token docs), 0-A-7/8/9 (button/pill/badge components) — required for Phase 2 gate.

---

## Active files (last touched)

| File                                             | Status                                                     |
| ------------------------------------------------ | ---------------------------------------------------------- |
| `CODEX.md`                                       | ✅ Penpot MCP start instructions added                     |
| `CLAUDE.md`                                      | ✅ Penpot MCP start instructions added                     |
| `AGENTS.md`                                      | ✅ Penpot MCP start instructions added                     |
| `WORKFLOW.md`                                    | ✅ Penpot MCP bootstrap/start:all instructions added       |
| `SESSION.md`                                     | ✅ This file                                               |
| `docs/design-system-rules.md`                    | ✅ DS spec for Phase 0 Penpot rebuild; Figma refs → Penpot |
| `docs/design-overhaul-master-plan-2026-03-13.md` | ✅ Phase 0-F sign-off recorded; Phase 0 complete           |

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

<!-- TOOL_ROUTER:START -->

## Tool Router

Not sure which tool to reach for? Use this table.

| Task type                                              | Tool       |
| ------------------------------------------------------ | ---------- |
| Research · external docs · best-practice lookup        | Perplexity |
| Prompt engineering · drafting governance text          | Perplexity |
| Design · Penpot edits · token work                     | Claude     |
| ADRs · documentation · policy decisions                | Claude     |
| Interactive decisions · open-ended Q&A                 | Claude     |
| Code changes · refactoring · new features              | Codex      |
| Tests · version bumps · pre-commit checks · git / push | Codex      |

**Pipeline:** Perplexity researches → Claude designs & documents → Codex implements & ships.

**Standing rule — all tools:** When uncertain about scope, intent, or ownership — ask. Do not anticipate, assume, or proceed speculatively.

<!-- TOOL_ROUTER:END -->

---

<!-- OPENING_PROMPT:START -->

## Opening prompt (paste this to start any session)

**Perplexity:**

```
Read SESSION.md (Do next + Open decisions sections). Your role: research and prompt engineering only. Summarize findings as a concise brief for Claude or Codex to act on — do not implement anything. If the scope or intent of a task is unclear, ask before proceeding.
```

**Claude:**

```
Read CLAUDE.md and SESSION.md, then continue from the last session. Your role: design (Penpot MCP), documentation, ADRs, decisions. Check the Tool Router if unsure whether a task belongs here or in Codex. If scope or intent is unclear, ask — do not anticipate.
```

**Codex:**

```
Read CODEX.md, AGENTS.md, and SESSION.md, then continue from the last session. Your role: code, tests, version bumps, git. Check the Tool Router if unsure whether a task belongs here or in Claude. Run the pre-commit checklist before any push. If scope or intent is unclear, ask — do not anticipate.
```

<!-- OPENING_PROMPT:END -->

---

_Last updated: 2026-03-19 · Claude (housekeeping: CODEX.md version fix, master plan footer, WORKFLOW.md Codex Desktop MCP note; v1.9.97.18)_
