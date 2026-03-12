# ADR 0011: URL Library as Canonical URL Organizational Surface

- Status: accepted
- Date: 2026-03-12

## Context

URL features had become split across popup quick actions, legacy popup panel-swap history UI, and
new URL Library page work. This created ownership ambiguity, naming drift, and higher regression
risk for UI and docs.

Sprint 2A/2B/2C shipped URL Library as a dedicated full-tab surface and removed the legacy popup
panel-swap flow.

## Decision

URL organization is formally owned by the URL Library page (`src/urls/urls.html`):

1. Canonical URL organizational features live on URL Library:
   - Saved Views (`All`, `Starred`, `Today`, `By Domain`)
   - URL Tags
   - URL Notes
   - URL Bulk Actions
   - URL Change Log
2. Popup `URLs` tab remains a quick-capture surface only:
   - add current/add all, copy/export/email, clear/restore, recent list, open URL Library
3. Legacy popup URL panel-swap history mode is retired and must not be reintroduced.
4. No new permissions, network calls, or telemetry are introduced by this surface ownership model.

## Consequences

- URL feature development is simplified to one primary surface.
- Help/docs-policy parity is easier to maintain because user-visible behavior has one canonical URL
  location.
- Visual regression coverage must include URL Library responsive states as a quality gate.
- Migration-safe shared persistence remains in shared URL repositories; surface ownership changes do
  not alter the local-only storage model.
