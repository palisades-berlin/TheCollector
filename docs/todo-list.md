# TODO List

Operational follow-ups and housekeeping tasks live here so roadmap files remain focused on product planning and milestone execution.

Working rule:

- When a task is completed, remove it from this file in the same work cycle.

- [ ] Reevaluate local-only AI-assisted screenshot discovery feature (deferred):
  - Assess adding local-only smart filename/discovery support inspired by macOS screenshot automation patterns.
  - Keep strict local-only policy (no external API calls, no tracking, no backend).
  - Reevaluate tier placement (default target: Ultra) and define a technical feasibility slice before implementation.

- [ ] Continue visual parity reduction pass:
  - lower CI-bridging tolerances for `shared-primitives-matrix.png` (`13000`), `shared-primitives-matrix-dark.png` (`4000`), `popup-capture-default.png` (`10000`), `history-default.png` (`5600`), and `preview-error.png` (`17000`).
  - continue reducing `history-empty.png` and `history-loading.png` from `220` toward `<=100`.
  - remove exception rows once each snapshot returns to the default `maxDiffPixels <= 2` target.

- [ ] URL Library Sprint 2A follow-up completion:
  - confirm Design System 2.0 gate evidence is linked in roadmap item notes for URL Collector 2.0 work.
  - complete URL Library migration items still pending from plan (`docs/implementation-plan-url-library-v2.0.md`) before starting Sprint 2B.
  - keep popup URL tab quick-capture-focused (no return of view/tags/change-log editing surfaces).
