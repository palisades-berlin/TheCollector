# ADR 0007: Weekly Value Report v1 (Local Summary Card, Pro/Ultra Tier)

- Status: accepted
- Date: 2026-03-06
- Updated: 2026-03-11

## Context

Roadmap quick-win `weekly_value_report` needs a simple first slice that makes user value visible
without introducing tracking, external processing, or behavior risk. The extension is free forever;
"Pro/Ultra" refers to UX complexity tiers, not paid access. Promotion to popup footer card is
planned for v1.10.

## Decision

Implement Weekly Value Report v1 with these constraints:

- feature is shown when capability tier is `pro` or `ultra` (UX complexity preference, not payment gate)
- v1 surface is Settings only; v2 surface adds a dismissible popup footer card (v1.10)
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
