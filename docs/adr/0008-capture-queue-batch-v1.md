# ADR 0008: Capture Queue + Batch Mode v1 (Popup Queue, Pro-Gated)

- Status: accepted
- Date: 2026-03-06

## Context

Roadmap quick-win `capture_queue_batch_mode` needs a low-risk first slice that improves throughput for power users without changing capture protocol contracts.

## Decision

Implement Capture Queue + Batch Mode v1 with these constraints:

- feature visibility is hidden unless capability tier is `pro` or `ultra`
- queue management is popup-local:
  - queue current tab
  - queue all tabs in current window
  - remove queued tabs
  - clear queue
- execution runs queued captures sequentially via existing `CAPTURE_START`
- no new message types and no runtime schema changes

## Consequences

- immediate productivity lift for Pro/Ultra users with minimal behavior risk
- no service-worker API expansion required in v1
- clear upgrade path for richer queue controls and cross-surface batch management later
