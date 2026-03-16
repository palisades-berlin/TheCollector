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

**Step 2 — Open your AI tool and paste the opening prompt**

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
Read AGENTS.md and SESSION.md, then continue from the last session. Your role: code, tests, version bumps, git. Check the Tool Router if unsure whether a task belongs here or in Claude. Run the pre-commit checklist before any push. If scope or intent is unclear, ask — do not anticipate.
```

<!-- OPENING_PROMPT:END -->

The AI reads both files and picks up exactly where the last session ended — no re-explaining needed.

---

## During a session

Work normally. The AI handles everything.

---

## Ending a session

**Step 3 — The AI updates `SESSION.md` automatically**

Both Claude (`CLAUDE.md`) and Codex (`AGENTS.md`) have a standing rule to update `SESSION.md` before every commit. You don't need to write anything.

If the AI didn't update it, ask: `Update SESSION.md with what we did and what's next.`

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
