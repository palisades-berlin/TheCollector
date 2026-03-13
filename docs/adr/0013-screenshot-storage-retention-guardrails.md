# ADR 0013: Screenshot Storage Retention Guardrails

- Status: accepted
- Date: 2026-03-13

## Context

Screenshot storage in IndexedDB could grow without limit. History loading and capture saves could hit
memory pressure and quota failures without clear user guidance.

The product is local-only and must stay predictable under large screenshot libraries.

## Decision

Screenshot retention and safety behavior is standardized as follows:

1. History list rendering is metadata-first (`screenshot_meta`) and must not depend on full Blob
   listing for normal operation.
2. Screenshot retention uses a fixed item cap (`500`) with deterministic oldest-first purge by
   timestamp when auto-purge is enabled.
3. Auto-purge is user-controllable in Settings (`autoPurgeEnabled`), defaulting to enabled for
   migration-safe installs.
4. When auto-purge is disabled and the cap is reached, new screenshot saves are blocked with a clear
   user-facing message; no silent deletion occurs.
5. History thumbnail loading is viewport-driven and bounded to avoid full-list scheduling bursts.
6. History thumbnail reads must prefer a dedicated thumbnail store (`screenshot_thumbs`) before
   any full screenshot record fallback to keep first paint responsive for large captures.
7. User-facing transparency is mandatory:
   - Settings shows a storage usage counter (`000/500`) and auto-purge toggle.
   - History shows a storage notice toast when automatic purge happens.

## Consequences

- Capture remains reliable at higher library sizes without silent quota crashes.
- Users can prefer data preservation (auto-purge off) or continuous capture (auto-purge on).
- Documentation and help surfaces must explain the storage policy and limit behavior.
- Future retention policy changes must preserve deterministic ordering and explicit user messaging.
- Thumbnail compatibility for legacy records is preserved via fallback + lazy backfill into the
  dedicated thumbnail store.
