# Session State — THE Collector

> **Rule:** Update this file before every `git push`. It is the handoff between machines and AI tools.
> **How to resume:** `git pull` → read this file → paste the opening prompt below to Claude or Codex.

---

## Current sprint

**v2.0 — Design System 2.0 · Phase 0: Figma Rebuild**
Roadmap ref: `docs/thecollector-2.0-90-day-roadmap.md`
Master plan: `docs/design-overhaul-master-plan-2026-03-13.md`

---

## Last session

**Date:** 2026-03-13
**Tool:** Codex + Claude (Cowork)

**Done:**
- Deep housekeeping pass across all docs — full scan of every file:
  - `AGENTS.md` — added Help Documentation Rules 1–4 (were missing, only Rule 5 was present)
  - `docs/architecture.md` — removed duplicate `src/shared/db.js` line
  - `docs/thecollector-2.0-90-day-roadmap.md` — version baseline updated 1.9.84 → 1.9.86; added items 10 (1.9.85 thumbnail quality) and 11 (1.9.86 domain combobox)
  - `docs/ui-handoff.md` — Figma table naming updated: "Sidebar / History*" → "Screenshots / *" per ADR 0012; 6 design principles from master plan §3.2 added (hard gate for Phase 2 — now done)
  - `docs/design-overhaul-master-plan-2026-03-13.md` — BF-01–04 and S-07/S-08 marked as likely pre-completed (per ADR 0011/0012 and implementation plan Sprint 2A/2B/2C); post-phase 1 gate note updated to reflect design principles already added
- Cross-machine sync and publish completed:
  - hard sync performed from GitHub (`reset --hard origin/main` + clean) to make this machine match remote exactly
  - pushed docs housekeeping commit to `main`: `5935793` (`docs: housekeeping pass, cross-machine workflow, and design overhaul master plan`)
  - same-session wiki sync completed: `TheCollector.wiki` `Home.md` commit `d37616f`
  - local and remote are clean/aligned (`main...origin/main`)
- Blocker verification completed (pre-Phase 1 gate):
  - BF-01 confirmed: shipped naming uses `Screenshots` + `Change Log` across live surfaces.
  - BF-02 confirmed: URL Change Log supports `Esc` + `Back to URL List` focus-return flow.
  - BF-03 confirmed: URL remove flow calls metadata cleanup (`removeUrlMetadata`/`removeUrlRecordMetadata`).
  - BF-04 confirmed: `url_bulk_actions` is correctly gated as Pro in capabilities.
  - evidence run: `node tests/capabilities.test.mjs && node tests/url-repo.test.mjs && node tests/url-library-change-log-accessibility.test.mjs` (all pass).

---

## Do next

**Task:** Phase 0 — begin Figma rebuild.

Where: Figma file `sECUN6qSqUygWoG7PhC548` (`THECollector - UI Kit & Screens`)
What: Phase 0 checklist in master plan §6, steps 0-A through 0-F
Gate: ALL Phase 0 Figma work must be complete and approved before any Phase 1 code begins
First step: 0-A-1 — update colour styles (dark mode surface tokens, light mode surface tokens, border tokens)

**Blocker status:** cleared — BF-01–04 verified in current build on 2026-03-13.

---

## Open decisions / blockers

- No active technical blocker for Phase 0 start.
- S-07/S-08 are code-precompleted; next work is Figma documentation + DS 2.0 visual treatment planning only.

---

## Active files (last touched)

| File | Status |
|---|---|
| `docs/design-overhaul-master-plan-2026-03-13.md` | ✅ Updated — BF/S pre-completed notes added |
| `AGENTS.md` | ✅ Help Doc Rules 1–4 added |
| `docs/architecture.md` | ✅ Duplicate line removed |
| `docs/thecollector-2.0-90-day-roadmap.md` | ✅ Version baseline 1.9.86, items 10–11 added |
| `docs/ui-handoff.md` | ✅ Screenshots naming fixed, 6 design principles added |
| `WORKFLOW.md` | ✅ Updated in housekeeping push |
| `SESSION.md` | ✅ This file |

---

## Opening prompt (paste this to start any session)

**Claude:**
```
Read CLAUDE.md and SESSION.md, then continue from the last session.
```

**Codex:**
```
Read AGENTS.md and SESSION.md, then continue from the last session.
```

---

*Last updated: 2026-03-13 (blocker verification completed; ready for Phase 0 Figma start next session)*
