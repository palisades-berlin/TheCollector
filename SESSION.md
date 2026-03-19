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

- Restored the dark premium visual baseline in the shared tokens and main surfaces so the extension opens on the documented dark default.
- Reinstated the documented Poppins stack and pushed the shared surfaces closer to the glass-layered dark recipe from the visual direction docs.
- Marked the legacy design-system docs explicitly as historical snapshots so the active target is unambiguous.
- Grouped the Preview toolbar into labeled browse/export/preset/zoom clusters for clearer hierarchy.
- Split URL Library bulk actions into primary selection controls and secondary operations.
- Reworked the History files overlay and compare card controls into a more gallery-like, frosted utility panel.
- Regenerated the Playwright visual snapshots for the new baseline and confirmed the parity suite passes.
- Kept the DS 2.0 Phase 0 surface work intact while correcting the visual direction back toward the documented Apple/Linear-style premium baseline.
- Completed the docs-only housekeeping cleanup: versioned handoff docs are now aligned at `1.9.99.1`, the repo assessment snapshot is archived, and policy wording now says `README.md ## Top Changes`.
- Validation passed: version policy, docs policy, format check, lint, and type checks all succeeded after the cleanup.

---

## Do next

**Task (Codex):** Commit/push the docs-only housekeeping cleanup, then sync the wiki Home.md in the same working session.

**Blocker status:** none currently blocking capture or the docs-only commit.

---

## Open decisions / blockers

- Figma file `THECollector - UI Kit & Screens` (key `sECUN6qSqUygWoG7PhC548`) remains active authority (ADR 0016).
- ADR 0015 remains historical; all active planning/governance points to ADR 0016.
- Browser-captured shell work is still in progress and should keep reflecting back into Figma as slices are completed.
- The browser shim now covers `chrome.storage.sync` and `chrome.permissions` for standalone local captures.
- Wiki `Home.md` sync will need to be refreshed for this housekeeping cycle before push.

---

## Active files (last touched)

| File                                         | Status                                                                                    |
| -------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `SESSION.md`                                 | ✅ Session state refreshed for toolbar hierarchy refinement and housekeeping (`1.9.99.1`) |
| `CHANGELOG.md`                               | ✅ Added `1.9.99.1` docs-only housekeeping entry                                          |
| `manifest.json` / `package.json`             | ✅ Version bumped to `1.9.99.1`                                                           |
| `README.md`                                  | ✅ Version + Top Changes refreshed for housekeeping cleanup                               |
| `AGENTS.md`, `CLAUDE.md`, `CODEX.md`         | ✅ Version bump + current version synchronized (`1.9.99.1`)                               |
| `docs/archive/repo-assessment-2026-03-13.md` | ✅ Moved to `docs/archive/` and inbound references updated                                |
| `CONTRIBUTING.md`                            | ✅ Source-of-truth guidance switched to Figma (ADR 0016)                                  |
| `docs/ui-handoff.md`                         | ✅ Historical column renamed to `Penpot Import ID (historical)`                           |
| `docs/archive/repo-assessment-2026-03-13.md` | ✅ Marked as historical snapshot/non-authoritative; PR template path fixed                |
| `.github/PULL_REQUEST_TEMPLATE.md`           | ✅ Added minimal PR checklist template                                                    |
| `scripts/sync-marker-blocks.mjs`             | ✅ Added canonical->mirror marker sync helper                                             |
| `docs/marker-sync-contract.md`               | ✅ Added helper command note (`npm run sync:marker-blocks`)                               |

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

_Last updated: 2026-03-19 · Codex (v1.9.99.1 — docs-only housekeeping cleanup; CODEX and maintainer policy sync; repo assessment archived)_
