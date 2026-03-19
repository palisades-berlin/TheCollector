# CODEX.md

Codex-only working memory for `THE Collector`.

- This file is intended for Codex session continuity.
- It is not product documentation and should not be treated as user-facing truth.
- Keep it focused on durable repo knowledge, operational rules, and current watchouts.

## Current Sprint

- **Active phase:** v2.0 — DS 2.0 Design Phase Reset (Figma-first governance).
- Phase 0 is restart-required under ADR 0016 (no active sign-off in force).
- Phase 1 code remains blocked until Figma Phase 0 (0-A through 0-F) is re-completed and signed off.
- Immediate focus: keep governance/planning docs aligned while design restarts in Figma.
- `docs/archive/repo-assessment-2026-03-13.md` has been archived; keep any lingering references pointed at the archived copy.
- **Before starting design-derived code work — two pre-tasks:**
  1. Verify Figma Phase 0 gate status in roadmap/master/handoff docs is current and consistent.
  2. Verify Figma calibration contracts (`scripts/check-ui-calibration-contract.mjs` and `tests/visual/ui-parity.spec.mjs`) remain aligned to the canonical Figma source-of-truth.

## Project Identity

- `THE Collector` is a Manifest V3 Chrome/Edge extension.
- It combines full-page screenshot capture with URL collection and review surfaces.
- Current extension version: `1.9.99.1`.
- The product is free forever, local-only, and has no external connections or user tracking.
- The `Basic` / `Pro` / `Ultra` selector is a UX complexity preference, not a paywall.
- Roadmap source of truth: `docs/thecollector-2.0-90-day-roadmap.md`.

## Non-Negotiable Rules

- Keep behavior stable unless a change is explicitly required.
- Start simple, then add complexity later.
- If scope, ownership, or intent is unclear, ask instead of speculating.
- Prefer current repository docs and code over memory when they disagree.
- Do not remove runtime-required permissions unless there is clear evidence they are dead.
- Do not bypass the docs policy, version policy, or help-content parity rules.

## Versioning and Release Discipline

- Version format is four-part semantic: `x.y.z.w`.
- Runtime/code changes bump `z` and reset `w` to `0`.
- Docs/tests-only changes bump `w` only.
- Sync version in `manifest.json`, `package.json`, `README.md`, `CHANGELOG.md`, `AGENTS.md`, and `CLAUDE.md` together for commits.
- Release archives must exclude development artifacts such as `node_modules`, `.git`, tests, and local notes not required at runtime.
- Every commit/push workflow must also sync the GitHub wiki `Home.md`.

## Primary Architecture

- This is a feature-sliced extension with a service-worker orchestrated background layer.
- The service worker is the composition root and orchestration hub, not a persistent background page.
- Capture is programmatic:
  - the worker injects the capture agent into the active tab,
  - the agent measures and scrolls the page,
  - the worker sends tiles to the offscreen document,
  - the offscreen document stitches and persists the final image.
- Content scripts are injected programmatically rather than declared in the manifest.
- No app-wide event bus exists beyond `chrome.runtime` messages.

## Main Surfaces

- `src/background/`:
  - service worker bootstrap
  - capture orchestration
  - lifecycle handlers
  - queue state
  - context menus
  - omnibox
  - alarms
  - downloads
- `src/content/`:
  - page-side capture agent
- `src/offscreen/`:
  - hidden stitching and persistence document
- `src/popup/`:
  - popup UI and capture/queue entrypoints
- `src/options/`:
  - settings surface and help UI
- `src/history/`:
  - screenshot history workspace
- `src/preview/`:
  - screenshot preview, annotations, diff, export
- `src/urls/`:
  - canonical full URL Library surface
- `src/onboarding/`:
  - welcome/onboarding page
- `src/shared/`:
  - constants, messages, validation, capabilities, repos, storage, utilities

## Storage Model

- `chrome.storage.sync` holds canonical settings.
- `chrome.storage.local` holds URL list/history, undo snapshot, nudge state, capture reports, storage notices, and URL metadata fallback data.
- `chrome.storage.session || chrome.storage.local` is used for queue state.
- IndexedDB holds screenshots, screenshot metadata, thumbnails, and pending tiles.
- URL metadata has a fallback path when IndexedDB is unavailable.

## Important Flow Summary

### Startup

- `manifest.json` boots the service worker.
- `src/background/service-worker.js` composes the managers and calls `initAll()`.
- Install/startup handlers refresh menus, alarms, onboarding, and badge state.

### Capture

- Popup capture actions send messages to the service worker.
- The worker validates payloads, injects the capture agent, collects tiles, and restores the page.
- Tiles are stored before stitching.
- The offscreen document stitches the final image and persists the screenshot record.
- Progress, completion, and errors are broadcast back to the popup.

### Queue Capture

- Queue capture uses the same pipeline as a single capture.
- Queue state is persisted and advanced sequentially.
- Completion and error summaries are routed back to the popup.

### Settings

- Settings are read and written through the shared settings repo.
- Save behavior is explicit, not implicit.
- Optional `downloads` permission can be requested or revoked from the settings surface.

### URL Library

- The full-tab URL Library is the canonical URL management surface.
- The popup URL panel is the quick-action surface and should stay lightweight.

### History and Preview

- History is the screenshots workspace.
- Preview handles review, annotation, diff, and export.

## Key Modules To Remember

- `src/background/service-worker.js`
- `src/background/message-router.js`
- `src/background/capture-service.js`
- `src/background/queue-state.js`
- `src/background/offscreen-manager.js`
- `src/content/capture-agent.js`
- `src/offscreen/offscreen.js`
- `src/shared/settings.js`
- `src/shared/capabilities.js`
- `src/shared/db.js`
- `src/shared/url-repo.js`
- `src/shared/roadmap-guardrails.js`
- `src/popup/popup.js`
- `src/options/options.js`
- `src/urls/urls.js`
- `src/history/history.js`
- `src/preview/preview.js`

## Hard Limits And Rules Of Thumb

- Screenshot cap: `500`
- URL cap: `500`
- URL note max length: `140`
- URL tag limit: `10`
- URL history limit: `100`
- Capture scroll settle: `200ms`
- Capture visible-tab throttle: `550ms`
- Capture retry max: `5`
- Capture backoff base: `400ms`
- Offscreen canvas max side: `16000`
- Nudge alarm cadence: `240 minutes`
- Google Docs clipboard pixel cap: `25,000,000`
- Auto-purge default: on

## Feature Gating

- Capability tiers: `basic`, `pro`, `ultra`.
- The tier model is for UX complexity only.
- Legacy `proEnabled` and `ultraEnabled` shims still exist in settings/capabilities for compatibility.
- Pro surfaces include Smart Save Profiles, bulk actions, weekly value report, Smart Revisit Nudges, capture queue, saved URL views, and URL tags/notes/bulk actions.
- Ultra surfaces include omnibox actions and future-intelligence items.

## Fallbacks And Defensive Behavior

- `captureVisibleTab` uses retry and backoff handling.
- Offscreen document creation is idempotent.
- Thumbnail loading falls back from thumb store to record thumb to full blob.
- Toasts are deduped.
- Preview download falls back to anchor-based download if `downloads` permission is unavailable.
- Validation happens before dispatching capture or queue work.

## Current Watchouts

- `docs/archive/repo-assessment-2026-03-13.md` is a historical snapshot, not current state.
- `docs/thecollector-2.0-90-day-roadmap.md` intentionally preserves historical baseline entries while marking current-state reset under ADR 0016.
- `src/popup/urls-panel.js` is a transitional quick surface that coexists with the canonical `src/urls/urls.js`.
- `src/background/message-router.js` and `src/shared/url-repo.js` are high-coupling seams.
- The protocol injection bridge in capture is a brittle seam and should be handled carefully.
- Figma calibration constants are authoritative for visual parity (`scripts/check-ui-calibration-contract.mjs`, `tests/visual/ui-parity.spec.mjs`) and must stay in sync with `docs/ui-handoff.md`.

## Documentation Integrity

- `docs/help-user-guide.md` and the Help & FAQ section in `src/options/options.html` must stay in sync.
- User-facing help should only describe features that are actually implemented.
- If a feature ships, remove its unshipped phrase(s) from `scripts/check-doc-policy.mjs` and update both help surfaces.

## Figma MCP

- All design work uses Figma as the UX/UI source of truth.
- Figma MCP should be reachable for design-context pulls and screenshot verification.
- If Figma MCP is unavailable, stop and ask the maintainer before proceeding with design-derived work.

## Workflow Notes For Codex

- Prefer reading the repo before editing.
- Use minimal changes that preserve behavior.
- Avoid unnecessary subagents; use them only when they are truly helpful and keep the count low.
- Keep a short memory of what was learned in this file rather than scattering it across the repo.
- Do not assume or guess — ask if unsure, but you are allowed to make suggestions.
- **Keep CODEX.md current:** after any session that changes architecture, modules, storage model,
  hard limits, feature gating, watchouts, or documentation state — update the relevant section(s)
  in this file before closing the task. Treat CODEX.md as a living document, not a snapshot.

## Output And Token Discipline

- Respond with the minimum tokens necessary to complete the task.
- No preamble: do not open responses with "I will now…", "Here is…", "Sure!", or similar filler phrases.
- No closing remarks or summaries after completing a task.
- No inline code comments unless they describe a non-obvious architectural decision.
- After any successful action — edit, command, or external operation — confirm with a single line: `✓ [action performed]`.
- For questions or ambiguities, ask one concise question — no padding, no context recap.
- **Phase detection:** the verb in the instruction signals the phase — "audit", "explain", "review" → `LEARN / AUDIT`; "fix", "update", "add" → `EXECUTE / EDIT`; "why isn't", "it broke" → `DEBUG`; "ship", "release", "bump" → `RELEASE`.
- **Verbosity by phase:**
  - `LEARN / AUDIT` tasks: full structured output is required — do not suppress briefing documents. Prefer depth over breadth; cap to what is directly relevant to the question.
  - `EXECUTE / EDIT` tasks: code only, plus a `✓` confirmation line. Always include the filename in the code block header and a language tag.
  - `DEBUG` tasks: one-paragraph diagnosis + fix — no narration of process.
  - `RELEASE` tasks: one confirmation line per completed step.
- **Mid-task blockers:** if a blocking ambiguity is discovered during an `EXECUTE / EDIT` task, stop and ask one question before continuing — do not guess.
- **On failure:** one-line diagnosis + what was not completed — no narration of attempts.
- **Unsolicited concerns:** only raise a concern proactively if it is blocking or introduces risk — do not append observations to completed tasks.
- Never repeat back the contents of a file you were just asked to read — confirm with `✓ read [filename]` and proceed.
- When updating CODEX.md, change only the lines that are factually affected —
  do not rewrite unrelated sections or reformat for style.
