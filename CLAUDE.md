# THE Collector - Maintainer Context

## Project Summary
`THE Collector` is a Chrome/Edge extension (Manifest V3) that combines full-page screenshot capture with URL collection.
Current extension version: `1.9.35`.

## Engineering Rules
- Keep behavior stable and avoid core logic rewrites unless required.
- Versioning policy: use semantic `x.y.z` and bump on every code change.
- Sync version in `manifest.json`, `package.json`, `README.md`, and `CLAUDE.md` together.
- On every requested commit/push, sync GitHub Wiki `Home.md` in `https://github.com/palisades-berlin/TheCollector.wiki.git` in the same working session.
- Packaging discipline: release archives must exclude local/development artifacts (`node_modules`, `.git`, tests, and local notes/docs not required by runtime).
- Permission-scope policy (Phase A): remove only demonstrably dead permissions; do not remove permissions that are runtime-required for capture/export flows.

## Canonical Workflow Doc
- Source of truth for local checks, manual smoke flow, packaging, and release policy:
  - `docs/dev-workflow.md`
- UI handoff/source-of-truth guidance:
  - `docs/ui-handoff.md`
