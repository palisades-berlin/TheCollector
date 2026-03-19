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

**v2.0 — DS 2.0 Design Phase Reset (Figma-first governance)**
Roadmap ref: `docs/thecollector-2.0-90-day-roadmap.md`
Master plan: `docs/design-overhaul-master-plan-2026-03-13.md` § PHASE 0

---

## Last session

**Date:** 2026-03-19
**Tool:** Codex

**Done:**

- Completed full housekeeping remediation cycle across local docs/config surfaces (approved audit findings only).
- Added `.github/PULL_REQUEST_TEMPLATE.md`; updated stale PR-template reference in `docs/repo-assessment-2026-03-13.md`.
- Updated `CONTRIBUTING.md` to active Figma-first authority (ADR 0016).
- Synchronized `CODEX.md` sprint/watchouts with current reset state (Phase 0 restart-required; Phase 1 blocked).
- Corrected historical ID labeling in `docs/ui-handoff.md` to `Penpot Import ID (historical)`.
- Added marker-sync helper script (`scripts/sync-marker-blocks.mjs`) and npm command `sync:marker-blocks`; documented helper in `docs/marker-sync-contract.md`.
- Updated pre-commit checklist wording drift (`AGENTS.md`, `CLAUDE.md`) from `README ## Overview` to `README ## Top Changes`.
- Synced the GitHub wiki `Home.md` for the same housekeeping cycle.
- Version bumped to `1.9.97.21` (docs-only).

---

## Do next

**Task (Codex):** Commit/push the housekeeping remediation cycle in the main repo.

**Blocker status:** none for this docs/config cycle; local checks are green and wiki sync is complete.

---

## Open decisions / blockers

- Figma file `THECollector - UI Kit & Screens` (key `sECUN6qSqUygWoG7PhC548`) remains active authority (ADR 0016).
- ADR 0015 remains historical; all active planning/governance points to ADR 0016.
- This cycle is docs/config-only and intentionally avoids runtime behavior changes.
- Wiki `Home.md` sync is complete for this working session.

---

## Active files (last touched)

| File                                 | Status                                                                     |
| ------------------------------------ | -------------------------------------------------------------------------- |
| `SESSION.md`                         | ✅ Session state refreshed for housekeeping cycle (`1.9.97.21`)            |
| `CHANGELOG.md`                       | ✅ Added `1.9.97.21` housekeeping remediation entry                        |
| `manifest.json` / `package.json`     | ✅ Version bumped to `1.9.97.21`                                           |
| `README.md`                          | ✅ Version + Top Changes refreshed for housekeeping cycle                  |
| `AGENTS.md`, `CLAUDE.md`             | ✅ Version bump + checklist wording corrected (`## Top Changes`)           |
| `CODEX.md`                           | ✅ Current Sprint + Watchouts aligned to ADR 0016 reset state              |
| `CONTRIBUTING.md`                    | ✅ Source-of-truth guidance switched to Figma (ADR 0016)                   |
| `docs/ui-handoff.md`                 | ✅ Historical column renamed to `Penpot Import ID (historical)`            |
| `docs/repo-assessment-2026-03-13.md` | ✅ Marked as historical snapshot/non-authoritative; PR template path fixed |
| `.github/PULL_REQUEST_TEMPLATE.md`   | ✅ Added minimal PR checklist template                                     |
| `scripts/sync-marker-blocks.mjs`     | ✅ Added canonical->mirror marker sync helper                              |
| `docs/marker-sync-contract.md`       | ✅ Added helper command note (`npm run sync:marker-blocks`)                |

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

_Last updated: 2026-03-19 · Codex (v1.9.97.21 — housekeeping remediation cycle complete; docs/config aligned; checks pending local run)_
