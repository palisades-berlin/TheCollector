# Marker Sync Contract

This file is the source of truth for machine-readable marker governance across maintainer and policy documentation.

## Marker Syntax

- Open marker: `<!-- MARKER_ID:START -->`
- Close marker: `<!-- MARKER_ID:END -->`
- Comparison policy: exact text match after newline normalization (`\r\n` -> `\n`) only.

## Maintenance Rule

- Canonical marker blocks are authoritative.
- When a canonical block changes, all mirror blocks must be updated in the same work cycle.
- `npm run test:docs-policy` enforces this rule through `test:marker-sync`.

## Contract Data

```json
{
  "allowedMarkerIds": [
    "ENGINEERING_RULES",
    "PRE_COMMIT_CHECKLIST",
    "HELP_RULES",
    "SESSION_RULE",
    "OPENING_PROMPT",
    "LOCAL_QUALITY_CHECKS",
    "VERSIONING_RULE",
    "WIKI_SYNC_RULE",
    "UI_SOURCE_OF_TRUTH",
    "UI_CHANGE_POLICY",
    "ROADMAP_AUTHORITY",
    "ROADMAP_CONSTRAINTS",
    "ROADMAP_MILESTONES",
    "REVIEW_STANDARDS",
    "SECURITY_PRIVACY_RULES"
  ],
  "requiredMarkersByFile": {
    "AGENTS.md": [
      "ENGINEERING_RULES",
      "PRE_COMMIT_CHECKLIST",
      "HELP_RULES",
      "SESSION_RULE",
      "ROADMAP_AUTHORITY",
      "ROADMAP_CONSTRAINTS",
      "ROADMAP_MILESTONES"
    ],
    "CLAUDE.md": [
      "ENGINEERING_RULES",
      "PRE_COMMIT_CHECKLIST",
      "HELP_RULES",
      "SESSION_RULE",
      "ROADMAP_AUTHORITY",
      "ROADMAP_CONSTRAINTS",
      "ROADMAP_MILESTONES"
    ],
    "SESSION.md": ["SESSION_RULE", "OPENING_PROMPT"],
    "docs/project-ruleset.md": [
      "ENGINEERING_RULES",
      "HELP_RULES",
      "ROADMAP_AUTHORITY",
      "ROADMAP_CONSTRAINTS",
      "ROADMAP_MILESTONES"
    ],
    "docs/dev-workflow.md": [
      "LOCAL_QUALITY_CHECKS",
      "VERSIONING_RULE",
      "WIKI_SYNC_RULE",
      "HELP_RULES",
      "UI_SOURCE_OF_TRUTH",
      "UI_CHANGE_POLICY"
    ],
    "WORKFLOW.md": ["SESSION_RULE", "OPENING_PROMPT"],
    "CONTRIBUTING.md": ["VERSIONING_RULE", "SECURITY_PRIVACY_RULES", "REVIEW_STANDARDS"],
    "docs/ui-handoff.md": ["UI_SOURCE_OF_TRUTH", "UI_CHANGE_POLICY"],
    "docs/thecollector-2.0-90-day-roadmap.md": [
      "ROADMAP_AUTHORITY",
      "ROADMAP_CONSTRAINTS",
      "ROADMAP_MILESTONES"
    ]
  },
  "canonicalMirrors": [
    {
      "id": "PRE_COMMIT_CHECKLIST",
      "canonical": "AGENTS.md",
      "mirrors": ["CLAUDE.md"]
    },
    {
      "id": "ENGINEERING_RULES",
      "canonical": "docs/project-ruleset.md",
      "mirrors": ["AGENTS.md", "CLAUDE.md"]
    },
    {
      "id": "HELP_RULES",
      "canonical": "docs/project-ruleset.md",
      "mirrors": ["AGENTS.md", "CLAUDE.md", "docs/dev-workflow.md"]
    },
    {
      "id": "SESSION_RULE",
      "canonical": "SESSION.md",
      "mirrors": ["AGENTS.md", "CLAUDE.md", "WORKFLOW.md"]
    },
    {
      "id": "OPENING_PROMPT",
      "canonical": "SESSION.md",
      "mirrors": ["WORKFLOW.md"]
    },
    {
      "id": "VERSIONING_RULE",
      "canonical": "docs/dev-workflow.md",
      "mirrors": ["CONTRIBUTING.md"]
    },
    {
      "id": "WIKI_SYNC_RULE",
      "canonical": "docs/dev-workflow.md",
      "mirrors": ["AGENTS.md", "CLAUDE.md"]
    },
    {
      "id": "UI_SOURCE_OF_TRUTH",
      "canonical": "docs/ui-handoff.md",
      "mirrors": ["docs/dev-workflow.md"]
    },
    {
      "id": "UI_CHANGE_POLICY",
      "canonical": "docs/ui-handoff.md",
      "mirrors": ["docs/dev-workflow.md"]
    },
    {
      "id": "ROADMAP_AUTHORITY",
      "canonical": "docs/thecollector-2.0-90-day-roadmap.md",
      "mirrors": ["AGENTS.md", "CLAUDE.md", "docs/project-ruleset.md"]
    },
    {
      "id": "ROADMAP_CONSTRAINTS",
      "canonical": "docs/thecollector-2.0-90-day-roadmap.md",
      "mirrors": ["AGENTS.md", "CLAUDE.md", "docs/project-ruleset.md"]
    },
    {
      "id": "ROADMAP_MILESTONES",
      "canonical": "docs/thecollector-2.0-90-day-roadmap.md",
      "mirrors": ["AGENTS.md", "CLAUDE.md", "docs/project-ruleset.md"]
    }
  ]
}
```
