# How I Work on This Project — Step by Step

---

## The short version

1. Pull before you start
2. Paste the opening prompt to Claude or Codex
3. Work
4. Push — the AI already updated `SESSION.md`

---

## Session State Rule

<!-- SESSION_RULE:START -->

- **At the end of every session** — before any commit/push — update `SESSION.md` in the repo root with: (1) today's date and tool used, (2) what was completed this session, (3) the exact next task, (4) any open decisions or blockers.
- `SESSION.md` is the handoff file between machines and AI tools. It must always reflect the true current state of the work.
- Keep it short. 5–10 lines under each heading is enough.
<!-- SESSION_RULE:END -->

---

## Starting a session

**Step 1 — Pull the latest from GitHub**

```
git pull
```

Always do this first, on any machine, before touching anything.

---

**Step 1b — Verify Figma MCP access (design sessions only)**

If the session involves design work, verify Figma MCP is authenticated before opening Claude/Codex design workflows:

1. Confirm Figma MCP account/seat access (`whoami` in the toolchain).
2. Confirm the target Figma file/node is reachable for context fetches.
3. If Figma MCP is unavailable, stop and resolve access with the maintainer before design-derived edits.

Skip this step for Perplexity (research) sessions.

---

**Step 2 — Open your AI tool and paste the opening prompt**

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

The AI reads both files and picks up exactly where the last session ended — no re-explaining needed.

---

## During a session

Work normally. The AI handles everything.

---

## Ending a session

**Step 3 — The AI updates Notion, then `SESSION.md`**

Before updating `SESSION.md`, the AI must verify that all affected Notion pages reflect the current state. Any change to architecture, roadmap, workflow policy, or project rules must be committed to Notion in the same session — not deferred.

If the AI didn't update Notion, ask: `Update the relevant Notion pages for what we changed this session.`

Then `SESSION.md` is updated automatically. If it wasn't, ask: `Update SESSION.md with what we did and what's next.`

**Step 4 — Push (when commit/push is requested)**

```
git push
```

`SESSION.md` travels with the push. The next session on any machine picks it up automatically.

---

## Switching machines

1. `git pull`
2. Paste the opening prompt (Claude or Codex version above)
3. Continue

No other setup needed.

---

## One rule

**Always end in a synced state.**

If you made a requested commit/push, push before switching machines so `SESSION.md` and docs are not stranded. If no commit/push was requested, keep a clean handoff state (`git status` + pull-on-next-machine discipline).

## Credit Note

Implemented with Codex AI, Claude, Perplexity assistance and my fantasy.

---

_That's the whole system._
