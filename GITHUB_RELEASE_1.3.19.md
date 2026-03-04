# THE Collector v1.3.19

## Summary
This release implements a focused set of low-risk code quality fixes from a senior code review, without changing business logic or public behavior.

## Implemented fixes
- **Popup URL restore state fix**
  - Restore button state now updates correctly when the URL list becomes empty.
- **History filter performance hygiene**
  - Added lightweight debounce for domain filter input to reduce re-render churn on fast typing.
- **Preview image-load hardening**
  - Added explicit `onerror` handling and guaranteed object URL cleanup in preview image setup.
- **Service worker message validation**
  - Added positive integer validation for `CAPTURE_START` `tabId` payload.
- **Shared helper deduplication**
  - Extracted duplicate filename/path sanitization logic into shared helper module.

## Tests added
- `tests/filename.test.mjs`
  - verifies filename and directory sanitization behavior.
- `tests/ui-state-validation.test.mjs`
  - verifies URL restore-state predicate and positive-int validation helper.

## Validation
- Local checks passed:
  - `node tests/url-utils.test.mjs`
  - `node tests/filename.test.mjs`
  - `node tests/ui-state-validation.test.mjs`

## Notes
- No business logic or feature-flow changes were introduced.
