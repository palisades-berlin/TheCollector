# ADR 0006: Bulk Actions v1 (History Overlay, Pro/Ultra Tier)

- Status: accepted
- Date: 2026-03-06
- Updated: 2026-03-11

## Context

Roadmap quick-win `bulk_actions_v1` needs a low-risk first slice that improves throughput in
History without changing capture/runtime behavior. The extension is free forever; "Pro/Ultra"
refers to UX complexity tiers, not paid access. Bulk tag + move operations are planned for v2.0.

## Decision

Implement Bulk Actions v1 with these constraints:

- feature is shown when capability tier is `pro` or `ultra` (UX complexity preference, not payment gate)
- entry point is the History `Bulk` action (overlay-based multi-select)
- supported batch actions in v1:
  - bulk download
  - bulk delete
- unsupported in v1 (planned for v2.0):
  - bulk tag and bulk move operations

## Consequences

- immediate power-user value with limited implementation risk
- no protocol or capture-flow changes required
- clear upgrade path for bulk tag + move operations in v2.0 (see roadmap)
