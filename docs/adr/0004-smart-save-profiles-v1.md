# ADR 0004: Smart Save Profiles v1 (Fixed Presets, Capture-Only Override)

- Status: accepted
- Date: 2026-03-06

## Context

Roadmap feature `smart_save_profiles` needs a low-risk first release that improves capture speed for Pro/Ultra users without changing core capture logic or adding external dependencies.

## Decision

Implement Smart Save Profiles v1 with these constraints:

- fixed local presets only: `Research`, `Interest`, `Private`
- profile selection in popup applies profile and starts capture immediately
- Options exposes a default profile selector only (no profile CRUD)
- profile application is capture-only override (no persistent overwrite of global export defaults)
- feature visibility is hidden unless capability tier is `pro` or `ultra`

## Consequences

- fast rollout with minimal behavior risk and no schema complexity for profile management
- backward-compatible capture protocol via optional `profileId`
- clear upgrade path to editable/custom profiles in a later ADR
