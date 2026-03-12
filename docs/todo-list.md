# TODO List

Operational follow-ups and housekeeping tasks live here so roadmap files remain focused on product planning and milestone execution.

Working rule:

- When a task is completed, remove it from this file in the same work cycle.

- [ ] Reevaluate local-only AI-assisted screenshot discovery feature (deferred):
  - Assess adding local-only smart filename/discovery support inspired by macOS screenshot automation patterns.
  - Keep strict local-only policy (no external API calls, no tracking, no backend).
  - Reevaluate tier placement (default target: Ultra) and define a technical feasibility slice before implementation.

- [ ] Continue visual parity reduction pass:
  - lower CI-bridging tolerances for `shared-primitives-matrix.png` (`13000`), `shared-primitives-matrix-dark.png` (`4000`), `popup-capture-default.png` (`10200`), `popup-error-state.png` (`10400`), `popup-success-state.png` (`10400`), `popup-urls-default.png` (`10400`), `history-default.png` (`6300`), `history-empty.png` (`5800`), `history-loading.png` (`4700`), `history-modal-open.png` (`7800`), `preview-error.png` (`17000`), `preview-edit-mode.png` (`21000`), and `preview-toolbar-wrap.png` (`26000`).
  - remove exception rows once each snapshot returns to the default `maxDiffPixels <= 2` target.

- [ ] URL Library Sprint 2A follow-up completion:
  - confirm Design System 2.0 gate evidence is linked in roadmap item notes for URL Collector 2.0 work.
  - complete URL Library migration items still pending from plan (`docs/implementation-plan-url-library-v2.0.md`) before starting Sprint 2B.
  - keep popup URL tab quick-capture-focused (no return of view/tags/change-log editing surfaces).
