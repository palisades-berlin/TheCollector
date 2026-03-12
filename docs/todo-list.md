# TODO List

Operational follow-ups and housekeeping tasks live here so roadmap files remain focused on product planning and milestone execution.

Working rule:

- When a task is completed, remove it from this file in the same work cycle.

- [ ] Reevaluate local-only AI-assisted screenshot discovery feature (deferred):
  - Assess adding local-only smart filename/discovery support inspired by macOS screenshot automation patterns.
  - Keep strict local-only policy (no external API calls, no tracking, no backend).
  - Reevaluate tier placement (default target: Ultra) and define a technical feasibility slice before implementation.

- [ ] Enable GitHub Code Scanning for `palisades-berlin/TheCollector` so `codeql.yml` uploads SARIF successfully:
  - Open repository Settings > Security > Advanced Security and enable code scanning for the repo.
  - If blocked, coordinate org-level policy/admin permissions; keep this item open until a successful green CodeQL run confirms resolution.
