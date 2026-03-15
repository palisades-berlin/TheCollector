# How I Work on This Project — Step by Step

---

## The short version

1. Pull before you start
2. Paste the opening prompt to Claude or Codex
3. Work
4. Push — the AI already updated `SESSION.md`

---

## Starting a session

**Step 1 — Pull the latest from GitHub**

```
git pull
```

Always do this first, on any machine, before touching anything.

---

**Step 2 — Open your AI tool and paste the opening prompt**

**If using Claude:**

```
Read CLAUDE.md and SESSION.md, then continue from the last session.
```

**If using Codex:**

```
Read AGENTS.md and SESSION.md, then continue from the last session.
```

The AI reads both files and picks up exactly where the last session ended — no re-explaining needed.

---

## During a session

Work normally. The AI handles everything.

---

## Ending a session

**Step 3 — The AI updates `SESSION.md` automatically**

Both Claude (`CLAUDE.md`) and Codex (`AGENTS.md`) have a standing rule to update `SESSION.md` before every commit. You don't need to write anything.

If the AI didn't update it, ask: `Update SESSION.md with what we did and what's next.`

**Step 4 — Push**

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

**Always push at the end of a session.**

If you don't push, the updated `SESSION.md` stays on one machine and the other starts blind. The AI does the writing — your only job is the push.

---

_That's the whole system._
