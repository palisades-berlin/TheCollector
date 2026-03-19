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

**v1.10 — Phase 1: Quick Wins Visual + UX (Codex)**
Roadmap ref: `docs/thecollector-2.0-90-day-roadmap.md`
Master plan: `docs/design-overhaul-master-plan-2026-03-13.md` § PHASE 1

---

## Last session

**Date:** 2026-03-19
**Tool:** Claude (Cowork)

**Done:**

- **Full housekeeping audit** (OMISSIONS, DUPLICATES, CONTRADICTIONS across all root `.md` files and `docs/`):
  - O-1: Created `docs/codex-prompt-help-faq-regeneration.md` (referenced 4× but missing).
  - O-2/C-4: `docs/architecture.md` — `non-fatal.js` annotated as removed.
  - C-2/C-3: `SESSION.md` sprint heading + active files table updated.
  - C-5: `docs/project-ruleset.md` Rule 4 — TypeScript claim replaced with JSDoc annotation truth.
  - C-6: `README.md` `## Top Changes` rewritten for v1.9.97.18 state.
  - Systemic fix: phase-gate alignment sweep row added to pre-commit checklist in `CLAUDE.md`, `AGENTS.md`, `docs/project-ruleset.md`.
  - Figma→Penpot residue cleaned up: `ui-handoff.md`, `ui-qa-audit.md`, `visual-design-uplift.md`, `design-system-rules.md`.
  - `docs/thecollector-2.0-90-day-roadmap.md` corrections and Phase 0-F item added.
  - `CODEX.md` Current Sprint section added with Phase 1 scope and two pre-tasks.
- **Test suite audit** — all 30 tests cross-referenced against source files, ADRs, and policy docs:
  - T-1/T-2: Figma→Penpot migration in `check-ui-calibration-contract.mjs` and `tests/visual/ui-parity.spec.mjs` — confirmed as Codex pre-tasks (already in CODEX.md).
  - T-3: `docs/architecture.md` visual regression threshold description corrected (inaccurate `maxDiffPixels <= 2` claim removed).
- **Version bumped to `1.9.97.19`** (docs-only W bump). CHANGELOG backfilled for .18; .19 entry added.

---

## Do next

**Task (Codex):** Phase 1 — Quick Wins: Visual + UX (v1.10, CSS/HTML only).
See `docs/design-overhaul-master-plan-2026-03-13.md` § PHASE 1 for full scope (QW-01 through QW-08, V-01, V-02, V-04a, V-06, V-08, V-10, BF-01 through BF-04).

**Blocker status:** none — Phase 0 gate passed ✅. v1.9.97.19 current. All docs aligned.

---

## Open decisions / blockers

- Penpot file: `THECollector - UI Kit & Screens`, file key `b19dd3d3-9135-8056-8007-bb5e7d6eb5d4`. ✅
- Penpot MCP running at `http://localhost:4401/mcp`. ✅
- Phase 0 fully complete: 0-A ✅, 0-B ✅, 0-C-1–5 ✅, 0-D-1–5 ✅, 0-E-1–3 ✅, 0-F ✅. Phase 1 code next (Codex).
- Phase 0-C-6 (Profile Usage pills), 0-C-7 (URL Notes UI), 0-C-8 (Popup URL panel redesign) are **pending** — required for Phase 4 gate, not Phase 1.
- Phase 0-A pending items: 0-A-3 (elevation/shadow), 0-A-5 (glass component variants), 0-A-6 (glass token docs), 0-A-7/8/9 (button/pill/badge components) — required for Phase 2 gate.

---

## Active files (last touched)

| File                                             | Status                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------ |
| `SESSION.md`                                     | ✅ This file — updated for v1.9.97.19                                          |
| `CHANGELOG.md`                                   | ✅ .18 entry backfilled (full alignment pass); .19 entry added                 |
| `manifest.json` / `package.json`                 | ✅ Version bumped to 1.9.97.19                                                 |
| `CODEX.md`                                       | ✅ Version bumped; Current Sprint section current                              |
| `CLAUDE.md`                                      | ✅ Version bumped; phase-gate checklist row present                            |
| `AGENTS.md`                                      | ✅ Version bumped; phase-gate checklist row present                            |
| `README.md`                                      | ✅ Version bumped; Top Changes current                                         |
| `docs/architecture.md`                           | ✅ non-fatal.js annotated removed; visual regression threshold corrected (T-3) |
| `docs/project-ruleset.md`                        | ✅ Rule 5 added; phase-gate rule 13 added; Rule 4 JSDoc correction (C-5)       |
| `docs/codex-prompt-help-faq-regeneration.md`     | ✅ Created — Help & FAQ HTML regeneration procedure (O-1)                      |
| `docs/thecollector-2.0-90-day-roadmap.md`        | ✅ Phase 1 unblocked; item 16 version fixed; item 18 (0-F) added               |
| `docs/design-system-rules.md`                    | ✅ Phase 0/Phase 1 direction note updated; section 8 heading corrected         |
| `docs/design-overhaul-master-plan-2026-03-13.md` | ✅ Phase 0-F sign-off; Phase 1 Penpot gate marked passed                       |
| `docs/ui-handoff.md`                             | ✅ Figma Node column annotated as archived ref                                 |
| `docs/ui-qa-audit.md`                            | ✅ Figma Sync Status section marked superseded (ADR 0015)                      |
| `docs/visual-design-uplift-2026-03-13.md`        | ✅ "For Figma work" → "For Penpot work"                                        |
| `WORKFLOW.md`                                    | ✅ Penpot plugin connect steps + Codex Desktop MCP note added                  |

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

_Last updated: 2026-03-19 · Claude (v1.9.97.19 — housekeeping audit O-1/C-1–C-6 complete; test suite audit 30 tests, T-3 fixed; version bumped across all 6 files; CHANGELOG backfilled; all local, uncommitted)_
