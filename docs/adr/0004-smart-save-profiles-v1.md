# ADR 0004: Smart Save Profiles v1 (Fixed Presets, Capture-Only Override)

- Status: completed
- Date: 2026-03-06
- Updated: 2026-03-11

## Context

Roadmap feature `smart_save_profiles` needs a low-risk first release that improves capture speed
for Pro/Ultra users without changing core capture logic or adding external dependencies. The
extension is free forever; "Pro/Ultra" refers to UX complexity tiers, not paid access.

## Decision

Implement Smart Save Profiles v1 with these constraints:

- fixed local presets only: `Research`, `Interest`, `Private`
- profile selection in popup applies profile and starts capture immediately
- Settings exposes a default profile selector only (no profile CRUD)
- profile application is capture-only override (no persistent overwrite of global export defaults)
- feature is shown when capability tier is `pro` or `ultra` (UX complexity preference, not payment gate)

## Consequences

- fast rollout with minimal behavior risk and no schema complexity for profile management
- backward-compatible capture protocol via optional `profileId`
- clear upgrade path to editable/custom profiles in v2.0 (see roadmap)
- v1 completion criteria met across Popup, Settings, and History:
  - fixed profile presets only (`Research`, `Interest`, `Private`)
  - default profile setting + popup quick-apply capture path
  - history profile filter and usage summary visibility for Pro/Ultra tiers
  - unknown/legacy profile IDs preserved as `Unknown` usage counts without misclassification
