# Marker Sync Contract

This file is the source of truth for machine-readable marker governance across maintainer and policy documentation.

## Marker Syntax

- Open marker: `<!-- MARKER_ID:START -->`
- Close marker: `<!-- MARKER_ID:END -->`
- Comparison policy: exact text match after newline normalization (`\r\n` -> `\n`) only.

## Marker Taxonomy (Current)

- Governance: `ENGINEERING_RULES`, `PRE_COMMIT_CHECKLIST`, `BEHAVIOURAL_RULES`, `HELP_RULES`
- Session/handoff: `SESSION_RULE`, `TOOL_ROUTER`, `OPENING_PROMPT`
- Workflow/versioning: `LOCAL_QUALITY_CHECKS`, `VERSIONING_RULE`, `WIKI_SYNC_RULE`
- UI/roadmap/contribution: `UI_SOURCE_OF_TRUTH`, `UI_CHANGE_POLICY`, `ROADMAP_AUTHORITY`, `ROADMAP_CONSTRAINTS`, `ROADMAP_MILESTONES`, `REVIEW_STANDARDS`, `SECURITY_PRIVACY_RULES`

## Maintenance Rule

- Canonical marker blocks are authoritative.
- When a canonical block changes, all mirror blocks must be updated in the same work cycle.
- Optional helper: run `npm run sync:marker-blocks` to copy canonical marker content into mirror files before validation.
- `npm run test:docs-policy` enforces this rule through `test:marker-sync`.

## Contract Data

Contract JSON is maintained in:

- `docs/marker-sync-contract.json`
