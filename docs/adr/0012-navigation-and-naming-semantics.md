# ADR 0012: Navigation Model and Naming Semantics

- Status: accepted
- Date: 2026-03-12

## Context

The term `History` was overloaded across screenshot browsing, URL operation snapshots, and roadmap
surface references. This caused user confusion and implementation drift.

Sprint 2C introduced naming cleanup and retired legacy popup URL panel-swap behavior. A formal
semantic contract is needed to keep future changes consistent.

## Decision

Navigation and naming semantics are standardized as follows:

1. Full-tab primary navigation is `Screenshots · URLs · Settings` across full-tab surfaces.
2. Screenshot surface label is `Screenshots` (route continuity remains `src/history/history.html`).
3. URL operation snapshot surface label is `Change Log` (under URL Library).
4. User-facing `History` terminology must not be used for URL operation snapshots.
5. Internal DOM/selectors/variables for URL change log should use `change-log` naming for clarity.
6. Change Log flows must preserve keyboard accessibility and deterministic focus return behavior.

## Consequences

- Future UI and docs changes must preserve the `Screenshots` vs `Change Log` distinction.
- New feature copy reviews should reject ambiguous `History` wording on URL surfaces.
- Visual and docs-policy gates should include checks for URL Library naming and responsive layout.
- Legacy internal names may remain only where migration safety requires them; new code must follow
  the standardized semantics.
