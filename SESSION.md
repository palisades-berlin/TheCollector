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
Roadmap ref: [Notion: 90-Day Roadmap](https://www.notion.so/32fcb6782fcf8111aafbe748a4c2a040)
Master plan: [Notion: Design Overhaul Master Plan](https://www.notion.so/32fcb6782fcf8155aec1cb84d3818c00) § PHASE 0

---

## Last session

**Date:** 2026-03-26
**Tool:** Codex

**Done:**

- Synced the THECollector Notion hub current version line to `1.9.98.0`.
- Bumped repo version markers to `1.9.98.0` in the seven versioned files.
- Refreshed `README.md` Top Changes and `CHANGELOG.md` for the checkpoint.
- Kept the Notion Sync Rule, unknown-page rule, and repo/notion handoff alignment intact.
- Ran the full local check suite successfully (`check`, version policy, docs policy, format checks, security policy).
- Synced the wiki `Home.md` to `1.9.98.0` with matching top changes and source mappings.

---

## Do next

**Task (Codex):** Commit and push the checkpoint, then confirm the wiki push in the same working session.

**Blocker status:** none.

---

## Open decisions / blockers

- Figma file `THECollector - UI Kit & Screens` (key `sECUN6qSqUygWoG7PhC548`) remains active authority (ADR 0016).
- ADR 0015 remains historical; all active planning/governance points to ADR 0016.
- Notion is now the single source of truth for all docs: https://www.notion.so/32fcb6782fcf81a5bc9dc9c3ace3c873
- Wiki `Home.md` sync will need to be refreshed for this migration cycle before push.

---

## Active files (last touched)

| File                             | Status                                                                     |
| -------------------------------- | -------------------------------------------------------------------------- |
| `SESSION.md`                     | ✅ Updated for checkpoint and version bump (`1.9.98.0`)                    |
| `CHANGELOG.md`                   | ✅ Added `1.9.98.0` checkpoint entry                                       |
| `manifest.json` / `package.json` | ✅ Version bumped to `1.9.98.0`                                            |
| `README.md`                      | ✅ Top Changes updated for the `1.9.98.0` checkpoint                       |
| `AGENTS.md`, `CLAUDE.md`         | ✅ Full bi-directional NOTION_SYNC_RULE + unknown-page rule added          |
| `CODEX.md`                       | ✅ NOTION_SYNC_RULE + unknown-page rule added                              |
| `WORKFLOW.md`                    | ✅ All opening prompts updated with unknown-page rule                      |
| `docs/marker-sync-contract.json` | ✅ NOTION_SYNC_RULE added; deleted-doc entries removed; empty dirs deleted |

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
Read SESSION.md (Do next + Open decisions sections). Then fetch these Notion pages: Developer Workflow (https://www.notion.so/32fcb6782fcf8117ac25e12e9ac76432), Project Ruleset (https://www.notion.so/32fcb6782fcf813f93d6ed2aa1b8a6aa), 90-Day Roadmap (https://www.notion.so/32fcb6782fcf8111aafbe748a4c2a040), ADRs (https://www.notion.so/32fcb6782fcf81fd9b93da7d29c86084), and UI Handoff (https://www.notion.so/32fcb6782fcf811f904ddacb264806bd) for design-session visibility. Note any Notion changes for Claude or Codex to reconcile. If you encounter a Notion page with no reference in any repo context file and not created in a prior session, read it and flag it to the maintainer before proceeding. Any new documentation must be directed to Notion only — do not create repo files. Your role: research and prompt engineering only. Summarize findings as a concise brief — do not implement anything. If scope or intent is unclear, ask before proceeding.
```

**Claude:**

```
Read CLAUDE.md and SESSION.md. Then fetch these Notion pages: Developer Workflow (https://www.notion.so/32fcb6782fcf8117ac25e12e9ac76432), Project Ruleset (https://www.notion.so/32fcb6782fcf813f93d6ed2aa1b8a6aa), 90-Day Roadmap (https://www.notion.so/32fcb6782fcf8111aafbe748a4c2a040), ADRs (https://www.notion.so/32fcb6782fcf81fd9b93da7d29c86084), and UI Handoff (https://www.notion.so/32fcb6782fcf811f904ddacb264806bd) for design sessions. Compare Notion against repo files — if Notion has changed, update repo to match before starting; if there is a conflict, stop and ask the maintainer. If you encounter a Notion page with no reference in any repo context file and not created in a prior session, read it in full and ask the maintainer how to handle it before proceeding. Any new documentation must be created in Notion only — never as a new repo file. Your role: design (Figma MCP), documentation, ADRs, decisions. Update affected Notion pages during or at session end — do not defer. Check the Tool Router if unsure whether a task belongs here or in Codex. If scope or intent is unclear, ask — do not anticipate.
```

**Codex:**

```
Read CODEX.md, AGENTS.md, and SESSION.md. Then fetch these Notion pages: Developer Workflow (https://www.notion.so/32fcb6782fcf8117ac25e12e9ac76432), Project Ruleset (https://www.notion.so/32fcb6782fcf813f93d6ed2aa1b8a6aa), 90-Day Roadmap (https://www.notion.so/32fcb6782fcf8111aafbe748a4c2a040), ADRs (https://www.notion.so/32fcb6782fcf81fd9b93da7d29c86084), and UI Handoff (https://www.notion.so/32fcb6782fcf811f904ddacb264806bd) for design-session visibility. Compare Notion against repo files — if Notion has changed, update repo to match before starting; if there is a conflict, stop and ask the maintainer. If you encounter a Notion page with no reference in any repo context file and not created in a prior session, read it in full and ask the maintainer how to handle it before proceeding. Any new documentation must be created in Notion only — never as a new repo file. Your role: code, tests, version bumps, git. Update affected Notion pages during or at session end — do not defer. Run the pre-commit checklist before any push. Check the Tool Router if unsure whether a task belongs here or in Claude. If scope or intent is unclear, ask — do not anticipate.
```

<!-- OPENING_PROMPT:END -->

---

_Last updated: 2026-03-26 · Codex (v1.9.98.0 — commit/push checkpoint and Notion hub sync)_
