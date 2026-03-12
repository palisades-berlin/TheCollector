# THE Collector - Maintainer Context

## Project Summary

`THE Collector` is a Chrome/Edge extension (Manifest V3) that combines full-page screenshot capture with URL collection.
Current extension version: `1.9.54`.
The extension is **free forever** — no subscriptions, no payments, no paid tiers. The tier selector (Basic / Pro / Ultra) is a UX complexity preference, not a paywall. See ADR 0009.

## Product Model

- Always free, local-only, no external connections, no user tracking.
- Roadmap milestones: **v1.10** (Foundation & Distribution) → **v2.0** (Design System 2.0 first, then URL Collector 2.0 + v2 Depth) → **v2.1** (Intelligence Layer) → **v3.0** (Monitoring & Share).
- Design System 2.0 is v2.0 item #1: token migration across all surfaces must complete before any v2.0 feature work begins. See ADR 0010.
- Roadmap source of truth: `docs/thecollector-2.0-90-day-roadmap.md`.

## Engineering Rules

- Keep behavior stable and avoid core logic rewrites unless required.
- Versioning policy: use semantic `x.y.z` and bump on every code change.
- Sync version in `manifest.json`, `package.json`, `README.md`, `CHANGELOG.md`, `AGENTS.md`, and `CLAUDE.md` together.
- On every requested commit/push, sync GitHub Wiki `Home.md` in `https://github.com/palisades-berlin/TheCollector.wiki.git` in the same working session.
- Packaging discipline: release archives must exclude local/development artifacts (`node_modules`, `.git`, tests, and local notes/docs not required by runtime).
- Permission-scope policy (Phase A): remove only demonstrably dead permissions; do not remove permissions that are runtime-required for capture/export flows.

## Help Documentation Rules

- **Rule 1 — Implementation parity:** All help files, documents, and pages (`docs/help-user-guide.md`, `src/options/options.html` Help & FAQ) must only describe features that are actually implemented and available in the current release. Roadmap or planned features must never appear in user-facing help content.
- **Rule 2 — Pre-commit gate:** Before every commit/push, verify that Rule 1 is fulfilled. The `npm run test:docs-policy` gate enforces this automatically; do not bypass it.
- **Rule 3 — Consistency:** `docs/help-user-guide.md` and the `Help & FAQ` section in `src/options/options.html` must always be in sync. Any change to one requires a matching update to the other in the same work cycle.
- **Rule 4 — Shipping a feature:** When a new feature ships, remove its phrase(s) from the `UNSHIPPED_PHRASES` list in `scripts/check-doc-policy.mjs` and add the feature to both help surfaces in the same work cycle.

## Canonical Workflow Doc

- Source of truth for local checks, manual smoke flow, packaging, and release policy:
  - `docs/dev-workflow.md`
- UI handoff/source-of-truth guidance:
  - `docs/ui-handoff.md`

# currentDate

Today's date is 2026-03-12.
