# THE Collector v1.3.7

## Permission Scope Phase A (Safe)
- Completed a dead-permission audit with stability-first criteria.
- Kept runtime permissions unchanged because all current permissions are in active use.
- Added explicit permission rationale documentation for review and release traceability.

## Documentation + Versioning
- Bumped extension version to `1.3.7` in `manifest.json`, `README.md`, and `CLAUDE.md`.
- Added changelog entry for `1.3.7`.
- Added maintainers' rule for permission-scope refinement discipline.

## Stability
- No feature/business-logic changes.
- No manifest permission removals in this phase.
- Local checks passed: `node tests/url-utils.test.mjs`.
