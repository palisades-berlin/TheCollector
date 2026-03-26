# THE Collector - Maintainer Context

## Project Summary

`THE Collector` is a Chrome/Edge extension (Manifest V3) that combines full-page screenshot capture with URL collection.
Current extension version: `1.9.98.0`.
The extension is **free forever** — no subscriptions, no payments, no paid tiers. The tier selector (Basic / Pro / Ultra) is a UX complexity preference, not a paywall. See ADR 0009.
Implementation credit: Implemented with Codex AI, Claude, Perplexity assistance and my fantasy.

## Product Model

<!-- ROADMAP_CONSTRAINTS:START -->

- Always free, local-only, no external connections, no user tracking.
- The tier selector (`Basic` / `Pro` / `Ultra`) is a UX complexity preference, not a paywall.
  <!-- ROADMAP_CONSTRAINTS:END -->
  <!-- ROADMAP_MILESTONES:START -->
- Roadmap milestones: **v1.10** (Foundation & Distribution) → **v2.0** (Design System 2.0 first, then URL Collector 2.0 + v2 Depth) → **v2.1** (Intelligence Layer) → **v3.0** (Monitoring & Share).
<!-- ROADMAP_MILESTONES:END -->
- Design System 2.0 is v2.0 item #1: token migration across all surfaces must complete before any v2.0 feature work begins. See ADR 0010.
<!-- ROADMAP_AUTHORITY:START -->
- Roadmap source of truth: [Notion: 90-Day Roadmap](https://www.notion.so/32fcb6782fcf8111aafbe748a4c2a040).
<!-- ROADMAP_AUTHORITY:END -->

## Figma MCP

- All design work uses Figma as the UX/UI source of truth.
- Figma MCP should be available for design-context fetches (`get_design_context`, `get_screenshot`, `get_metadata`) during implementation and audits.
- If Figma MCP is unavailable, stop and ask the maintainer before proceeding with design-derived changes.

## Notion Sync Rule

<!-- NOTION_SYNC_RULE:START -->

**Notion is the single source of truth for all project documentation.**
Workspace: [THECollector](https://www.notion.so/32fcb6782fcf81a5bc9dc9c3ace3c873)
Policy precedence: [Project Ruleset](https://www.notion.so/32fcb6782fcf813f93d6ed2aa1b8a6aa) is the normative rules source.

### Mandatory at session start — read, compare, reconcile before any work

Every tool (Claude, Codex, Perplexity) **must** fetch the following Notion pages before starting any task:

- [Developer Workflow](https://www.notion.so/32fcb6782fcf8117ac25e12e9ac76432) — release policy, local checks, packaging
- [Project Ruleset](https://www.notion.so/32fcb6782fcf813f93d6ed2aa1b8a6aa) — engineering rules, help rules, versioning
- [90-Day Roadmap](https://www.notion.so/32fcb6782fcf8111aafbe748a4c2a040) — milestone status, constraints
- [ADRs](https://www.notion.so/32fcb6782fcf81fd9b93da7d29c86084) — active architectural decisions
- [UI Handoff](https://www.notion.so/32fcb6782fcf811f904ddacb264806bd) — Claude / design sessions only

If Notion MCP is unavailable at session start, **stop and inform the maintainer**. Do not proceed on stale local copies.

After fetching, compare Notion content against `CLAUDE.md`, `AGENTS.md`, `CODEX.md`, and `SESSION.md`. If Notion has changed since the last session, update the affected repo files to match Notion before starting any task. If the difference is ambiguous or contradictory — **stop and ask the maintainer. Do not silently reconcile.**

When browsing the [THECollector Notion workspace](https://www.notion.so/32fcb6782fcf81a5bc9dc9c3ace3c873), if you discover a page that was created outside a session (i.e., it has no reference in any repo context file and was not created by this tool in a prior session), **read it in full, then stop and ask the maintainer how to handle it** before proceeding with any task. Do not assume it is stale, duplicate, or irrelevant.

### Mandatory during session and at session end — update Notion when affected

Any tool that modifies content covered by a Notion-hosted doc must update the relevant Notion page(s) in the same work cycle — do not defer to the next session.

| Change or decision                       | Required Notion update                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------- |
| Architecture or policy decision          | [ADRs](https://www.notion.so/32fcb6782fcf81fd9b93da7d29c86084) — create or update ADR |
| Roadmap scope or milestone status        | [90-Day Roadmap](https://www.notion.so/32fcb6782fcf8111aafbe748a4c2a040)              |
| Dev workflow, release, or quality policy | [Developer Workflow](https://www.notion.so/32fcb6782fcf8117ac25e12e9ac76432)          |
| Project rules, help rules, or versioning | [Project Ruleset](https://www.notion.so/32fcb6782fcf813f93d6ed2aa1b8a6aa)             |
| UI/UX source of truth or handoff spec    | [UI Handoff](https://www.notion.so/32fcb6782fcf811f904ddacb264806bd)                  |
| Design plans or visual direction         | [Design & UX](https://www.notion.so/32fcb6782fcf81878705f3fa30fd195e)                 |

**At session end:** before updating `SESSION.md`, verify that all affected Notion pages reflect the current state.

### New documentation must be created in Notion only

Do not create new documentation files in the repo. All new ADRs, design specs, planning docs, workflow docs, and reference material must be created in the [THECollector Notion workspace](https://www.notion.so/32fcb6782fcf81a5bc9dc9c3ace3c873).

Repo exceptions (runtime dependencies — do not move or duplicate these):

- `docs/help-user-guide.md` — consumed by `scripts/check-doc-policy.mjs`
- `docs/marker-sync-contract.json` — consumed by `scripts/marker-sync-lib.mjs`

<!-- NOTION_SYNC_RULE:END -->

## Behavioural Rules

<!-- BEHAVIOURAL_RULES:START -->

- **When uncertain about scope, intent, or task ownership — ask. Do not anticipate, assume, or proceed speculatively.**
- If a task feels like it belongs to Codex (code, tests, git), stop and confirm with the maintainer before acting.
- Consult the Tool Router in `SESSION.md` whenever the right tool is not obvious.

<!-- BEHAVIOURAL_RULES:END -->

## Output And Response Discipline

- Respond with the minimum words necessary to complete the task. Do not pad with context recaps, transition phrases, or meta-commentary.
- No preamble: do not open responses with "I'll help you with…", "Great question!", "Certainly!", "Of course!", or similar filler.
- No closing remarks: do not end with "Let me know if you need anything else!", "I hope this helps!", or similar.
- No apology loops: acknowledge errors with one line and fix them — do not apologize repeatedly or narrate the correction process.
- No unsolicited caveats: only add a qualification or warning if it is blocking or introduces real risk.
- After any successful action — file edit, command, or external operation — confirm with a single line: `✓ [action performed]`.
- For questions or ambiguities, ask one concise question — no padding, no context recap.
- **Phase detection:** the verb in the instruction signals the phase — "check", "read", "audit", "review", "verify" → `REVIEW / AUDIT`; "write", "draft", "create", "document" → `WRITE / DRAFT`; "update", "change", "fix", "add", "rewrite", "adapt" → `EDIT / UPDATE`; "what", "why", "how", "explain", "summarize" → `ANSWER / EXPLAIN`.
- **Verbosity by phase:**
  - `REVIEW / AUDIT` tasks: full structured output — depth over breadth, capped to what is directly relevant to the question.
  - `WRITE / DRAFT` tasks: produce the content directly — no narration of the writing process.
  - `EDIT / UPDATE` tasks: show only the changed content plus a `✓` confirmation. Do not reproduce unchanged sections.
  - `ANSWER / EXPLAIN` tasks: prose answer. Use headers only when the response has three or more distinct parts.
- **Markdown discipline:** use headers and bullet lists only when the response has three or more distinct sections or the user requests structure. For short enumerations, use inline prose ("x, y, and z") rather than bullet lists.
- **Mid-task blockers:** if a blocking ambiguity is discovered mid-task, stop and ask one question before continuing — do not guess or proceed speculatively.
- **On failure:** one-line diagnosis + what was not completed — no apology narrative.
- Never repeat back the contents of a file you were just asked to read — confirm with `✓ read [filename]` and proceed.
- When updating CLAUDE.md, change only the lines that are factually affected — do not rewrite unrelated sections or reformat for style.

---

## Engineering Rules

<!-- ENGINEERING_RULES:START -->

- Keep behavior stable and avoid core logic rewrites unless required.
- Versioning policy: use four-part semantic `x.y.z.w` (ADR 0014).
- Bump policy:
  - code/runtime change: bump `z`, reset `w=0`
  - docs/tests-only change: bump `w` only (smallest bump)
- Sync version in `manifest.json`, `package.json`, `README.md`, `CHANGELOG.md`, `AGENTS.md`, `CLAUDE.md`, and `CODEX.md` together.
- On every requested commit/push, sync GitHub Wiki `Home.md` in `https://github.com/palisades-berlin/TheCollector.wiki.git` in the same working session.
- Packaging discipline: release archives must exclude local/development artifacts (`node_modules`, `.git`, tests, and local notes/docs not required by runtime).
- Permission-scope policy (Phase A): remove only demonstrably dead permissions; do not remove permissions that are runtime-required for capture/export flows.
<!-- ENGINEERING_RULES:END -->

<!-- PRE_COMMIT_CHECKLIST:START -->

## Pre-Commit Checklist

Run this in order before every commit/push. No exceptions.

### Always — every commit

1. Bump version (`x.y.z.w`) in all seven files: `manifest.json`, `package.json`, `README.md`, `CHANGELOG.md`, `AGENTS.md`, `CLAUDE.md`, `CODEX.md`
2. Add a `CHANGELOG.md` entry for the new version
3. Update `README.md` `## Top Changes` with the top changes (max 5 lines)
4. Update `SESSION.md`: today's date + tool, what was completed, exact next task, open decisions/blockers
5. Run `npm run test:version-policy:local`, `npm run test:docs-policy` (includes marker-sync enforcement), `npm run format:session`, and `npm run format:check` — fix all failures before committing, never bypass
6. Wiki sync: clone `https://github.com/palisades-berlin/TheCollector.wiki.git` → update `Home.md` → commit + push in same session

### Conditional — only when the commit touches the relevant area

| Trigger                                   | Required action                                                                                                                                                                                                            |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Feature, UX, or tier behavior changed     | Update `docs/help-user-guide.md` + `src/options/options.html` Help & FAQ                                                                                                                                                   |
| New feature ships                         | Remove phrase(s) from `UNSHIPPED_PHRASES` in `scripts/check-doc-policy.mjs`; add feature to both help surfaces                                                                                                             |
| Roadmap scope or status changed           | Update [Notion: 90-Day Roadmap](https://www.notion.so/32fcb6782fcf8111aafbe748a4c2a040)                                                                                                                                    |
| Architecture or policy decision made      | Create or update ADR in [Notion: ADRs](https://www.notion.so/32fcb6782fcf81fd9b93da7d29c86084)                                                                                                                             |
| `docs/help-user-guide.md` changed         | Run [Notion: Help FAQ Regeneration Prompt](https://www.notion.so/32fcb6782fcf8102a63fd3cd62953e25) to regenerate `src/options/options.html` FAQ section                                                                    |
| `README.md` changed                       | Refresh wiki Home.md Overview section                                                                                                                                                                                      |
| Notion Developer Workflow updated         | Refresh wiki Home.md workflow section                                                                                                                                                                                      |
| Notion UI Handoff updated                 | Refresh wiki Home.md UI/UX section                                                                                                                                                                                         |
| Notion 90-Day Roadmap updated             | Refresh wiki Home.md roadmap section                                                                                                                                                                                       |
| `AGENTS.md` changed                       | Refresh wiki Home.md workflow section; mirror any structural changes to `CLAUDE.md` in the same work cycle                                                                                                                 |
| `CODEX.md` changed                        | Refresh wiki Home.md workflow section                                                                                                                                                                                      |
| `CLAUDE.md` changed                       | Refresh wiki Home.md workflow section; mirror any structural changes to `AGENTS.md` in the same work cycle                                                                                                                 |
| Phase gate or milestone sign-off recorded | Cross-doc alignment sweep: (1) SESSION.md version current, (2) roadmap phase status updated, (3) CODEX.md `## Current Sprint` updated, (4) scan all docs for stale "blocked"/"in progress" markers that should now be "✅" |

<!-- PRE_COMMIT_CHECKLIST:END -->

---

## Help Documentation Rules

<!-- HELP_RULES:START -->

- **Rule 1 — Implementation parity:** All help files, documents, and pages (`docs/help-user-guide.md`, `src/options/options.html` Help & FAQ) must only describe features that are actually implemented and available in the current release. Roadmap or planned features must never appear in user-facing help content.
- **Rule 2 — Pre-commit gate:** Before every commit/push, verify that Rule 1 is fulfilled. The `npm run test:docs-policy` gate enforces this automatically; do not bypass it.
- **Rule 3 — Consistency:** `docs/help-user-guide.md` and the `Help & FAQ` section in `src/options/options.html` must always be in sync. Any change to one requires a matching update to the other in the same work cycle.
- **Rule 4 — Shipping a feature:** When a new feature ships, remove its phrase(s) from the `UNSHIPPED_PHRASES` list in `scripts/check-doc-policy.mjs` and add the feature to both help surfaces in the same work cycle.
<!-- HELP_RULES:END -->

## Session State Rule

<!-- SESSION_RULE:START -->

- **At the end of every session** — before any commit/push — update `SESSION.md` in the repo root with: (1) today's date and tool used, (2) what was completed this session, (3) the exact next task, (4) any open decisions or blockers.
- `SESSION.md` is the handoff file between machines and AI tools. It must always reflect the true current state of the work.
- Keep it short. 5–10 lines under each heading is enough.
<!-- SESSION_RULE:END -->

## Canonical Workflow Doc

- Source of truth for local checks, manual smoke flow, packaging, and release policy:
  - [Notion: Developer Workflow](https://www.notion.so/32fcb6782fcf8117ac25e12e9ac76432)
- UI handoff/source-of-truth guidance:
  - [Notion: UI Handoff](https://www.notion.so/32fcb6782fcf811f904ddacb264806bd)
  <!-- WIKI_SYNC_RULE:START -->
- Every requested commit/push cycle must include a matching update to:
  - `https://github.com/palisades-berlin/TheCollector.wiki.git` (`Home.md`)
- Wiki sync is part of Definition of Done for commit/push operations.
- Keep wiki section order stable; only refresh impacted sections to avoid drift.
<!-- WIKI_SYNC_RULE:END -->

- **Rule 5 — Help & FAQ HTML generation:** `docs/help-user-guide.md` is the
  single source of truth for content. `src/options/options.html` (Help & FAQ
  section) is the _user-friendly rendering_ of that source. Whenever
  `docs/help-user-guide.md` is modified, run
  [Notion: Help FAQ Regeneration Prompt](https://www.notion.so/32fcb6782fcf8102a63fd3cd62953e25) in the same work cycle to
  regenerate the HTML section with plain, goal-oriented language. The markdown
  and the HTML must never diverge in content coverage (Rule 3), but they may —
  and should — differ in tone and phrasing.

---

## Common Commands

```bash
npm install              # Install dependencies
npm run lint             # ESLint
npm run check:types      # TypeScript checking (checkJs)
npm run format:check     # Prettier check
npm run test:unit        # Unit tests only
npm run test:coverage    # Unit tests + coverage gates (lines 90%, branches 85%, functions 90%)
npm run test:integration # Integration tests
npm run check            # Full CI-equivalent check (lint + types + all tests)
npm run test:version-policy:local  # Version alignment check (uncommitted changes)
npm run test:docs-policy           # Help/docs parity check
npm run format:session             # Format SESSION.md
./scripts/package-release.sh      # Build release archive
```

To run the extension locally: open `chrome://extensions`, enable Developer mode, click "Load unpacked", select the repo root.

## Architecture

**Data flow:**

- `Popup` → `Service Worker` (`src/background/service-worker.js`) → `Content Script` (`src/content/capture-agent.js`) → `Offscreen Document` (`src/offscreen/offscreen.js`) → `IndexedDB`
- Export path: `History`/`Preview` → screenshot records → PNG / JPG / PDF / Clipboard

**Key layers:**

- `src/background/` — service worker bootstrap + capture orchestration
- `src/content/` — page-side scroll/metrics agent (injected)
- `src/offscreen/` — tile stitching and image composition (off-screen canvas)
- `src/popup/` — primary capture + URL collection UI
- `src/history/` — screenshot browser with filters and bulk actions
- `src/preview/` — review, edit (crop/blur/highlight/text), export
- `src/shared/` — message protocol (`messages.js`), IndexedDB access (`db.js`), persistence repos (`repos/`), global design tokens (`ui.css`)

**Design tokens:** global CSS custom properties (`--sc-*`) defined in `src/shared/ui.css`; surface-level tokens in each page's own CSS.
