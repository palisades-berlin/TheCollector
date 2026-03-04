# THE Collector v1.3.11

## Highlights
- Added **URL Session Restore** in popup (`Restore Last Clear`) with a safe single-step undo snapshot.
- Added **Capture Reliability Report** telemetry and surfaced practical diagnostics in History.
- Implemented **Permission Scope Phase B** clarity improvements in Options.
- Refined permission-state wording to be more user-friendly.

## What changed

### URL list safety
- Clear-all now stores the previous URL list as an undo snapshot.
- New `Restore Last Clear` action restores the last cleared list.
- Restore is intentionally enabled when the current list is empty to avoid accidental overwrite.

### Capture reliability diagnostics
- Each capture attempt now records compact metadata:
  - duration
  - tile counts
  - retry/backoff counts
  - fallback usage
  - error summary (on failure)
- History now shows:
  - per-capture hints for why a capture was slow or fallback-adjusted
  - a top-line note for the latest failed capture reason

### Permission clarity (no scope expansion)
- Kept the same manifest permission set for stability.
- Options page now includes plain-language “why we need this permission” explanations.
- Added real-time permission badges for required and optional permissions.
- Updated badge text to user-friendly labels (e.g., `Available`, `Optional: On/Off`).

## Stability
- Core capture and URL business logic remains unchanged.
- Local checks passed:
  - `node tests/url-utils.test.mjs`
