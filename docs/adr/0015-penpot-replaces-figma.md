# ADR 0015 — Penpot Replaces Figma as Design Source of Truth

**Date:** 2026-03-18
**Status:** Accepted
**Deciders:** Stefan (maintainer)

---

## Context

The project design workflow required a Figma subscription to continue DS 2.0 Phase 0 work. The maintainer is not willing to pay for a Figma subscription. Figma's free tier does not support the component library, design token, and multi-page file structure required for this project.

The existing Figma file (`sECUN6qSqUygWoG7PhC548` — `THECollector - UI Kit & Screens`) holds the current UI source of truth and must be migrated to a free alternative.

---

## Decision

**Penpot** replaces Figma as the design source of truth for all UX/UI work in this project, effective immediately.

Penpot is selected because:

- It is free and open-source with no subscription wall.
- It is web-based and requires no local install.
- It supports component libraries, design tokens (W3C design tokens format), and multi-page files — matching the project's design system requirements.
- It has an MCP server (`@penpot/mcp`) that allows Claude to interact with Penpot files directly, preserving the existing AI-assisted design workflow.
- Its token export format (CSS custom properties) maps directly to the `--sc-*` token architecture in `src/shared/ui.css`.
- It can partially import the existing Figma file as a migration baseline.

---

## Migration Plan

1. **Import** the existing Figma file into Penpot via Penpot's Figma importer as a starting baseline.
2. **Clean up** auto-layout and variable collections that do not survive the import with full fidelity.
3. **Establish** the Penpot file URL as the new source of truth in `docs/ui-handoff.md`.
4. **Install** the Penpot MCP plugin in Cowork/Claude Code to restore the AI design workflow.
5. Continue DS 2.0 Phase 0 token layer work from the Penpot file.

---

## Consequences

- The Figma file (`sECUN6qSqUygWoG7PhC548`) is no longer the source of truth after migration is complete. It is archived, not deleted.
- All references to "Figma" in `docs/ui-handoff.md`, `docs/design-overhaul-master-plan-2026-03-13.md`, `WORKFLOW.md`, `SESSION.md` opening prompts, and the Tool Router are updated to "Penpot".
- The "Figma-first" design rule becomes the "Penpot-first" rule — design before code remains non-negotiable.
- The Penpot file key and URL are recorded in `docs/ui-handoff.md` once the file is created.
- Import fidelity loss is accepted as a known trade-off. Token values remain authoritative in `docs/design-system-rules.md` and `src/shared/ui.css` regardless of import fidelity.
