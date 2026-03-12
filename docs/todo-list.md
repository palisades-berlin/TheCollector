# TODO List

Operational follow-ups and housekeeping tasks live here so roadmap files remain focused on product planning and milestone execution.

Working rule:
- When a task is completed, remove it from this file in the same work cycle.

- [ ] Resolve omnibox behavior drift:
  - Current code uses omnibox actions `capture` / `collect` in `src/background/service-worker.js`.
  - Roadmap/planned terminology references Ultra actions `tc research` / `tc star` / `tc queue`.
  - Decide target behavior, then align code, gating, and docs-policy/help references.

- [ ] Resolve release-process drift:
  - Docs require manual extension smoke before upload/release.
  - GitHub release asset upload is automated on release publish.
  - Add explicit manual attestation gate in release flow or document this as an approved exception.
