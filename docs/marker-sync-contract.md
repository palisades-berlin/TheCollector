# Marker Sync Contract

This file is the source of truth for machine-readable marker governance across maintainer and policy documentation.

## Marker Syntax

- Open marker: `<!-- MARKER_ID:START -->`
- Close marker: `<!-- MARKER_ID:END -->`
- Comparison policy: exact text match after newline normalization (`\r\n` -> `\n`) only.

## Maintenance Rule

- Canonical marker blocks are authoritative.
- When a canonical block changes, all mirror blocks must be updated in the same work cycle.
- `npm run test:docs-policy` enforces this rule through `test:marker-sync`.

## Contract Data

Contract JSON is maintained in:

- `docs/marker-sync-contract.json`
