# ADR 0001: Basic / Pro / Ultra Tier Gating Model

- Status: accepted
- Date: 2026-03-06

## Context

Roadmap capabilities need deterministic entitlement checks while preserving backward compatibility
with legacy boolean gates.

## Decision

Use a single canonical setting, `capabilityTier`, with values:

- `basic`
- `pro`
- `ultra`

Hierarchy:

- `basic`: basic features only
- `pro`: basic + pro
- `ultra`: basic + pro + ultra

Legacy booleans are read for migration only and projected for temporary compatibility.

## Consequences

- Entitlement checks are simpler and centralized.
- Options UX uses a single capability selector (`basic` / `pro` / `ultra`) as the user-facing control.
- UI gating uses hide-only rendering for unavailable features.
- Legacy boolean fields are deprecated and not persisted.
