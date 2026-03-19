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

- **DS 2.0 Phase 0-E complete** — new Penpot page "DS 2.0 — Tier Density" created with 3 boards:
  - 0-E-1 · Basic Density ✅ (44px control height, 0% accent tint, stagger OFF)
  - 0-E-2 · Pro Density ✅ (40px control height, 8% accent tint, stagger ON)
  - 0-E-3 · Ultra Density ✅ (36px control height, 12% accent tint, stagger ON)
- Each board has left panel (URL Library row demo at tier height + tint strip + stagger flag) and right panel (4 token spec rows).
- `docs/design-overhaul-master-plan-2026-03-13.md` Phase 0-E all 3 items ✅.
- `docs/ui-handoff.md` DS 2.0 Active Pages table: 0-E row added, synced 03-19.
- `docs/thecollector-2.0-90-day-roadmap.md` item 16 split: 0-E ✅ (item 16), 0-C-6–8 pending (item 17).

---

## Do next

**Task (Claude):** Phase 0-F — review and approval gate before Phase 1 code begins.
See `docs/design-overhaul-master-plan-2026-03-13.md` § Phase 0-F for scope.

**Blocker status:** none — v1.9.97.16 current (docs-only bump for 0-E completion).

---

## Open decisions / blockers

- Penpot file: `THECollector - UI Kit & Screens`, file key `b19dd3d3-9135-8056-8007-bb5e7d6eb5d4`. ✅
- Penpot MCP running at `http://localhost:4401/mcp`. ✅
- Phase 0-A ✅, 0-B ✅, 0-C-1–5 ✅, 0-D-1–5 ✅, 0-E-1–3 ✅ done. Phase 0-F (review gate) next.
- Phase 0-C-6 (Profile Usage pills), 0-C-7 (URL Notes UI), 0-C-8 (Popup URL panel redesign) are **pending** — required for Phase 4 gate, not Phase 1.
- Phase 0-A pending items: 0-A-3 (elevation/shadow), 0-A-5 (glass component variants), 0-A-6 (glass token docs), 0-A-7/8/9 (button/pill/badge components) — required for Phase 2 gate.

---

## Active files (last touched)

| File                                             | Status                                                        |
| ------------------------------------------------ | ------------------------------------------------------------- |
| `CODEX.md`                                       | ✅ Penpot MCP start instructions added                        |
| `CLAUDE.md`                                      | ✅ Penpot MCP start instructions added                        |
| `AGENTS.md`                                      | ✅ Penpot MCP start instructions added                        |
| `WORKFLOW.md`                                    | ✅ Penpot MCP bootstrap/start:all instructions added          |
| `SESSION.md`                                     | ✅ This file                                                  |
| `docs/design-system-rules.md`                    | ✅ DS spec for Phase 0 Penpot rebuild; Figma refs → Penpot    |
| `docs/design-overhaul-master-plan-2026-03-13.md` | ✅ Phase 0-E all 3 items ✅                                   |
| `docs/ui-handoff.md`                             | ✅ DS 2.0 Active Pages table: 0-E row added, synced 03-19     |
| `docs/thecollector-2.0-90-day-roadmap.md`        | ✅ Item 16 split: 0-E ✅ (item 16), 0-C-6–8 pending (item 17) |

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

_Last updated: 2026-03-19 · Claude (Phase 0-E complete ✅; tier density boards Basic/Pro/Ultra; v1.9.97.16)_
