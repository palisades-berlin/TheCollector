# ADR 0007: Weekly Value Report v1 (Local Summary Card, Pro-Gated)

- Status: accepted
- Date: 2026-03-06

## Context

Roadmap quick-win `weekly_value_report` needs a simple first slice that makes user value visible without introducing tracking, external processing, or behavior risk.

## Decision

Implement Weekly Value Report v1 with these constraints:

- feature visibility is hidden unless capability tier is `pro` or `ultra`
- v1 surface is Options only
- metrics are computed locally from extension data only:
  - captures saved in last 7 days
  - unique domains in last 7 days
  - URLs currently collected
  - estimated minutes saved
- no outbound network calls, telemetry events, or identity tracking

## Consequences

- immediate user-facing value feedback with low implementation risk
- clear path for future sidebar/report expansion in later phases
- privacy guarantees remain aligned with local-only/no-tracking policy
