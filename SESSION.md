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
**Tool:** Codex + Claude

**Done:**

- (Codex) Created `CODEX.md` as Codex-only working memory; docs-only bump to `1.9.97.11`.
- (Claude) Reviewed and extended `CODEX.md` Output And Token Discipline and added `## Output And Response Discipline` to `CLAUDE.md`.
- (Claude) Updated Codex opening prompt in `WORKFLOW.md` and `SESSION.md` to include `CODEX.md`.
- (Claude) Added conditional pre-commit triggers for `CLAUDE.md`, `CODEX.md`, and `AGENTS.md` changes to both `CLAUDE.md` and `AGENTS.md`.
- Ran the required pre-commit checks: version policy local, docs policy, session format, and format check.
- Pending: commit, sync the wiki `Home.md`, and push the `1.9.97.11` docs-only release bump.

---

## Do next

**Task (Codex):** Commit, sync the wiki `Home.md`, and push the `1.9.97.11` docs-only release bump.

**Blocker status:** none for this docs-only release cycle.

---

## Open decisions / blockers

- None for the current docs-only release cycle.

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
| Design · Figma edits · token work                      | Claude     |
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
Read CLAUDE.md and SESSION.md, then continue from the last session. Your role: design (Figma MCP), documentation, ADRs, decisions. Check the Tool Router if unsure whether a task belongs here or in Codex. If scope or intent is unclear, ask — do not anticipate.
```

**Codex:**

```
Read CODEX.md, AGENTS.md, and SESSION.md, then continue from the last session. Your role: code, tests, version bumps, git. Check the Tool Router if unsure whether a task belongs here or in Claude. Run the pre-commit checklist before any push. If scope or intent is unclear, ask — do not anticipate.
```

<!-- OPENING_PROMPT:END -->

---

_Last updated: 2026-03-18 · Claude (output discipline rules for CLAUDE.md + CODEX.md; WORKFLOW.md + SESSION.md opening prompt sync)_
