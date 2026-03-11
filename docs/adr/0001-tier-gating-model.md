# ADR 0001: Basic / Pro / Ultra Tier Model (UX Complexity Preference, Always Free)

- Status: accepted
- Date: 2026-03-06
- Updated: 2026-03-11

## Context

Roadmap capabilities need deterministic, hierarchical feature-surface controls while preserving
backward compatibility with legacy boolean gates. The product is free forever — no subscriptions,
no payments, no paid tiers. The tier model is a **UX complexity preference**, not a paywall.

## Decision

Use a single canonical setting, `capabilityTier`, with values:

- `basic` — essential features only (simple mode)
- `pro` — basic + standard power-user features (standard mode)
- `ultra` — basic + pro + full expert feature surface (power user mode)

Hierarchy:

- `basic`: basic features only
- `pro`: basic + pro
- `ultra`: basic + pro + ultra

The tier selector in Settings is a UX surface-complexity control. It determines which features are
rendered. It does not gate access to a paid product, enforce entitlements, or perform payment checks.
All tiers are free. All users can change their tier at any time.

Legacy booleans are read for migration only and projected for temporary compatibility.

## Consequences

- Entitlement checks are simpler and centralized.
- Settings UI uses a single capability selector (`basic` / `pro` / `ultra`) as the user-facing complexity control.
- UI gating uses hide-only rendering for unavailable features (not disabled-state rendering).
- Legacy boolean fields (`proEnabled`, `ultraEnabled`) are deprecated and not persisted going forward.
- No payment infrastructure, license checks, or conversion flows are required or permitted.
- Tier value integrity rule: Pro/Ultra features must deliver clear incremental UX value over Basic.
  The complexity ladder must feel earned — each tier should meaningfully expand what a user can do.
