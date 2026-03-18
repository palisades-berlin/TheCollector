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

**Date:** 2026-03-18
**Tool:** Claude (Cowork)

**Done:**

- **DS 2.0 Phase 0-D (partial) complete** — new Penpot page "DS 2.0 — Cards & Rows" created with 5 boards:
  - 0-D-1 · Screenshot Card — Resting State ✅ (3 cards, radius 14px, elevation-2, spec label)
  - 0-D-2 · Screenshot Card — Hover State ✅ (translateY(-3px), elevation-3, overlay, 3×32px icon buttons)
  - 0-D-3 · Screenshot Card — Selected State ✅ (checkbox, brand-blue border-bottom, tinted bg)
  - 0-D-4 · URL Library Rows — Density Variants ✅ (44/40/36px rows, favicon, tag chip, note icon, star)
  - 0-D-5 · Empty States ⚠️ — board + panel frames created; inner content (icon, headline, CTA) not rendering visibly — z-order/rendering fix needed.
- `docs/design-overhaul-master-plan-2026-03-13.md` Phase 0-D status columns updated (0-D-1–4 ✅, 0-D-5 ⚠️).

---

## Do next

**Task (Claude):** Fix 0-D-5 empty states rendering in Penpot — inner content (icon circle, headline, CTA button) invisible despite correct absolute positions. Likely z-order issue: panel background may be covering content. Rebuild 0-D-5 board content from scratch with explicit z-order control (panel bg inserted last → z-bottom).

After fix: confirm 0-D-5 exports show both empty-state panels with visible content, then mark 0-D-5 ✅ in master plan and proceed to **Phase 0-E** (tier density variants).

**Blocker status:** none — v1.9.97.14 current, no version bump needed until code ships.

---

## Open decisions / blockers

- Penpot file: `THECollector - UI Kit & Screens`, file key `b19dd3d3-9135-8056-8007-bb5e7d6eb5d4`. ✅
- Penpot MCP running at `http://localhost:4401/mcp`. ✅
- Phase 0-A ✅, 0-B ✅, 0-C-1–5 ✅, 0-D-1–4 ✅ done. 0-D-5 ⚠️ rendering fix needed.
- Phase 0-C-6 (Profile Usage pills), 0-C-7 (URL Notes UI), 0-C-8 (Popup URL panel redesign) are **pending** — required for Phase 4 gate, not Phase 1.
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
| `docs/design-system-rules.md`                    | ✅ DS spec for Phase 0 Penpot rebuild; Figma refs → Penpot      |
| `docs/design-overhaul-master-plan-2026-03-13.md` | ✅ Phase 0-D-1–4 ✅, 0-D-5 ⚠️ status columns updated            |

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

_Last updated: 2026-03-18 · Claude (Phase 0-D boards 1–4 complete; 0-D-5 rendering fix pending; v1.9.97.15)_
