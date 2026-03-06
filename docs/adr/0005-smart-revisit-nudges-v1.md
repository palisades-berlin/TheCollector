# ADR 0005: Smart Revisit Nudges v1 (Local Evaluator, Pro Gated)

- Status: accepted
- Date: 2026-03-06

## Context

Roadmap quick-win `smart_revisit_nudges` requires a first implementation that drives re-engagement without adding external services, tracking, or behavior risk.

## Decision

Implement Smart Revisit Nudges v1 with these constraints:

- nudge candidate selection uses local screenshot metadata only
- no outbound network calls, no telemetry payloads, no identity tracking
- feature is available only for capability tier `pro` and `ultra`
- Options exposes local controls: `nudgesEnabled` and `notificationCadence` (`low|balanced|high`)
- popup displays a nudge card with actions: open history, dismiss, snooze 24h

## Consequences

- fast, privacy-safe nudge loop with predictable behavior and no backend dependency
- clear upgrade path to richer relevance scoring later while preserving local-only guardrails
- minimal regression risk because all existing capture/URL flows stay unchanged
