# ADR 0009: Always-Free, Local-Only Product Model

- Status: accepted
- Date: 2026-03-11

## Context

During the 2.0 roadmap planning cycle, the product model was clarified: THE Collector will be
free forever with no monetization path. The earlier roadmap framing (freemium, paid conversion
readiness, revenue potential) is superseded by this decision. This ADR records the change so
all future development and documentation aligns to the correct model.

## Decision

THE Collector is a **free, open, local-only tool with no monetization layer**:

1. No subscriptions, no payments, no paid tiers — ever.
2. No in-app purchase flows, no upgrade prompts, no paywall logic.
3. The Basic / Pro / Ultra tier selector is a UX complexity preference, not an entitlement model.
4. All tiers are freely available to all users at all times.
5. Local-only and no-tracking rules remain fully intact and are not subject to future renegotiation.

## Consequences

- All documents, ADRs, and code comments referencing "freemium," "paid conversion," "revenue
  potential," "subscription," or "monetization" are superseded by this ADR and must be updated.
- The tier gating system (ADR 0001) is retained as a UX complexity control with no payment semantics.
- No payment infrastructure, license verification, or conversion funnel code should be introduced.
- Distribution strategy focuses on Chrome Web Store featuring, organic growth, and word-of-mouth —
  not conversion funnels.
- The removed features — Enterprise Controls v1 and URL Bundle Export Packs as standalone items —
  were cut on scope grounds, not monetization grounds. Their use cases are addressed by
  Admin Config Profile (v2.1) and Team Spaces Lite (v3.0) respectively.
