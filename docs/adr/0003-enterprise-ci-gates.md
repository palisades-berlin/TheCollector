# ADR 0003: Enterprise CI Gates as Release Blockers

- Status: accepted
- Date: 2026-03-06

## Context

As extension complexity increased, lightweight checks no longer provided enough confidence for
functionality, security, and UX stability.

## Decision

Treat the following CI jobs as blocking for merges/releases:

- quality
- integration
- stability
- performance
- e2e_smoke
- visual_parity
- CodeQL analysis

## Consequences

- Regressions are caught before merge instead of post-release.
- Release artifacts are gated on quality and security posture.
- Contributor workflow requires full local/CI validation.
