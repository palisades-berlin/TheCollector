# TODO List

Operational follow-ups and housekeeping tasks live here so roadmap files remain focused on product planning and milestone execution.

Working rule:

- When a task is completed, remove it from this file in the same work cycle.

- [ ] Reevaluate local-only AI-assisted screenshot discovery feature (deferred):
  - Assess adding local-only smart filename/discovery support inspired by macOS screenshot automation patterns.
  - Keep strict local-only policy (no external API calls, no tracking, no backend).
  - Reevaluate tier placement (default target: Ultra) and define a technical feasibility slice before implementation.

- [ ] Continue visual parity reduction pass:
  - lower `history-default.png`, `history-empty.png`, and `history-loading.png` tolerances from `220` toward `<=100`.
  - remove exception rows once each snapshot returns to the default `maxDiffPixels <= 2` target.
