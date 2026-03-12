# TODO List

Operational follow-ups and housekeeping tasks live here so roadmap files remain focused on product planning and milestone execution.

Working rule:

- When a task is completed, remove it from this file in the same work cycle.

- [ ] Reevaluate local-only AI-assisted screenshot discovery feature (deferred):
  - Assess adding local-only smart filename/discovery support inspired by macOS screenshot automation patterns.
  - Keep strict local-only policy (no external API calls, no tracking, no backend).
  - Reevaluate tier placement (default target: Ultra) and define a technical feasibility slice before implementation.

- [ ] Visual parity follow-up: record Figma-vs-snapshot deltas and certify `<=2px` diff (or document a narrow approved exception) for the current calibration wave.

- [ ] Add per-snapshot Figma node annotations for each visual test state in `tests/visual/ui-parity.spec.mjs`.

- [ ] Reduce temporary visual tolerances in `docs/visual-exception-register.md` for:
  - `history-default.png` (`300` -> `<=100`)
  - `history-empty.png` (`300` -> `<=100`)
  - `history-loading.png` (`300` -> `<=100`)
  - Remove exception rows once snapshots pass at the default target.
