# ADR 0006: Bulk Actions v1 (History Overlay, Pro-Gated)

- Status: accepted
- Date: 2026-03-06

## Context

Roadmap quick-win `bulk_actions_v1` needs a low-risk first slice that improves throughput in History without changing capture/runtime behavior.

## Decision

Implement Bulk Actions v1 with these constraints:

- feature visibility is hidden unless capability tier is `pro` or `ultra`
- entry point is the History `Bulk` action (overlay-based multi-select)
- supported batch actions in v1:
  - bulk download
  - bulk delete
- unsupported in v1 (planned later):
  - tag and move bulk operations

## Consequences

- immediate power-user value with limited implementation risk
- no protocol or capture-flow changes required
- clear upgrade path for richer bulk edit operations in a later ADR
