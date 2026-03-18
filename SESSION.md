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

**v2.0 — Design System 2.0 · Phase 0: Figma Rebuild**
Roadmap ref: `docs/thecollector-2.0-90-day-roadmap.md`
Master plan: `docs/design-overhaul-master-plan-2026-03-13.md`

---

## Last session

**Date:** 2026-03-18
**Tool:** Claude (Cowork)

**Done:**

- **DS 2.0 Phase 0-B complete** — new Penpot page "DS 2.0 — Headers" (5 boards: Screenshots, URL Library, Preview, Popup, Settings).
- **DS 2.0 Phase 0-C complete** — new Penpot page "DS 2.0 — Command Bars" (5 items):
  - 0-C-1 URL Library command bar (primary + 2× secondary + danger).
  - 0-C-2 Screenshots command bar (ghost + danger).
  - 0-C-3 URL Library tab bar (4 filter tabs + `↗ History` ghost link).
  - 0-C-4 Selection bar: hidden state (muted placeholder) + visible state (3 selected × Deselect / Tag ▾ / Copy / Delete).
  - 0-C-5 URL Library filters (DOMAIN / DATE FROM / DATE TO / TYPE comboboxes).
- All boards: dark bg + glass surface fill applied; all exports verified visually.
- v1.9.97.13 bumped, docs updated, pushed.

---

## Do next

**Task (Claude):** DS 2.0 Phase 0-D — card & row states in Penpot:

- Screenshot card: resting / hover / selected states
- URL Library row: 4 item variants

**Pre-task:** Bump to `1.9.97.14` (docs-only), run checks, commit + push.

**Blocker status:** none.

---

## Open decisions / blockers

- Penpot file: `THECollector - UI Kit & Screens`, file key `b19dd3d3-9135-8056-8007-bb5e7d6eb5d4`. ✅
- Penpot MCP running at `http://localhost:4401/mcp`. ✅
- Phase 0-A ✅, 0-B ✅, 0-C-1–5 ✅ done. Phase 0-D (card/row states) is next.
- Phase 0-C-6 (Profile Usage pills), 0-C-7 (URL Notes UI), 0-C-8 (Popup URL panel redesign) are **pending** — required for Phase 4 gate, not Phase 1. Defer until after 0-D and 0-E.
- Phase 0-A pending items: 0-A-3 (elevation/shadow), 0-A-5 (glass component variants), 0-A-6 (glass token docs), 0-A-7/8/9 (button/pill/badge components) — required for Phase 2 gate.

---

## Active files (last touched)

| File                                             | Status                                                          |
| ------------------------------------------------ | --------------------------------------------------------------- |
| `CODEX.md`                                       | ✅ Output And Token Discipline extended (phase detection, etc.) |
| `CLAUDE.md`                                      | ✅ Output And Response Discipline section added                 |
| `AGENTS.md`                                      | ✅ Conditional triggers + CODEX.md pointer added                |
| `WORKFLOW.md`                                    | ✅ Codex opening prompt updated to include CODEX.md             |
| `SESSION.md`                                     | ✅ This file                                                    |
| `docs/design-system-rules.md`                    | ✅ New — full DS spec for Phase 0 Figma                         |
| `docs/design-overhaul-master-plan-2026-03-13.md` | ✅ Phase 0-A-1 token values remain source of truth              |

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

_Last updated: 2026-03-18 · Claude (DS 2.0 Phase 0 progress documented across all repo docs; v1.9.97.14)_
