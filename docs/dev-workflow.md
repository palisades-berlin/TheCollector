# Developer Workflow

This file is the canonical source for developer/release operations to keep `README.md` and `CLAUDE.md` aligned.
Policy precedence: `docs/project-ruleset.md` is the normative rules source when guidance overlaps.
Terminology convention: use `Settings` for user-facing text and keep `options` only for code/file paths (`src/options/*`).

## Prerequisites

- Node.js 20+
- Chrome or Edge with extension developer mode enabled

## Install

```bash
npm install
```

## Local Quality Checks

> **Version policy note:** Use `npm run test:version-policy:local` (not `test:version-policy`) when running locally with uncommitted changes. The `:local` variant sets `VERSION_POLICY_BASE_SHA=HEAD` so the bump-rule check compares against the current HEAD rather than `HEAD~1`. The bare `test:version-policy` is for CI (GitHub Actions sets the correct base ref automatically) and for post-commit clean-tree validation.

```bash
npm run lint
npm run test:repo-hygiene
npm run test:version-policy:local
npm run test:docs-policy
npm run test:unit
npm run test:coverage
npm run test:coverage:runtime
npm run test:coverage:preview-export
npm run test:integration
npm run test:security-policy
npm run test:stability
npm run test:performance
npx playwright install chromium
npm run test:e2e:smoke
npm run test:e2e:visual
npm run test:e2e:manual
npm run format:session
npm run format:check
npm run check
```

## Manual Run (Unpacked Extension)

1. Open `chrome://extensions` (or `edge://extensions`).
2. Enable Developer mode.
3. Click "Load unpacked" and select the repository root.
4. Pin THE Collector and open the popup to test capture/URL workflows.

Storage guardrails smoke checks (required when storage logic changes):

1. Verify **Settings → Feature Access** shows:
   - `Enable Auto-purge oldest screenshots`
   - `Storage usage: <count>/500 screenshots`
2. With Auto-purge ON at limit, confirm new capture saves and oldest screenshots are removed first.
3. With Auto-purge OFF at limit, confirm capture fails with actionable message and no automatic deletion.

## Release Packaging

```bash
./scripts/package-release.sh
MANUAL_SMOKE_ATTEST=pass ./scripts/publish-release-with-asset.sh
```

Packaging script guardrails:

- top `CHANGELOG.md` version must match `manifest.json` version
- if `HEAD` is exactly tagged, tag version must match manifest/changelog version
- release publishing script requires manual smoke attestation (`MANUAL_SMOKE_ATTEST=pass`)
- GitHub release notes must include the exact line `manual-smoke: pass` (release-assets workflow enforces this)
- release publishing script uploads generated zip to existing/new GitHub release tag

## Release Artifact Source of Truth

- Use the CI-uploaded artifact (`the-collector-release-zip`) from GitHub Actions for Chrome Web Store submission.
- Treat locally generated zips as local validation only.
- Use `docs/chrome-web-store-permissions.md` as canonical permission justification text in the CWS listing/policy form.
- Every GitHub release must include the generated extension ZIP artifact.

## GitHub Metadata Checklist (Per Release)

Keep repository metadata aligned with shipped state in the same cycle:

- Repository description reflects current product scope (capture + URL Library).
- Topics are present and current (extension/chrome-extension/product-specific tags).
- Security reporting visibility points to `SECURITY.md` and private advisory intake is enabled.
- Community standards visibility points to `CODE_OF_CONDUCT.md`.
- Release notes/changelog include any metadata-policy updates done in this cycle.

## Rollback Procedure

- Follow `docs/release-rollback.md` for emergency release rollback and post-rollback verification.

## Versioning Rule

- Versioning format is `x.y.z.w` (ADR 0014).
- Bump rules:
  - code/runtime change: bump `z`, reset `w=0`
  - docs/tests-only change: bump `w` only (smallest bump)
- Keep versions synchronized in:
  - `manifest.json`
  - `package.json`
  - `README.md`
  - `AGENTS.md`
  - `CLAUDE.md`
  - `CHANGELOG.md`

## Commit/Push -> Wiki Sync Rule (Mandatory)

- Every requested commit/push cycle must include a matching update to:
  - `https://github.com/palisades-berlin/TheCollector.wiki.git` (`Home.md`)
- Wiki sync is part of Definition of Done for commit/push operations.
- Keep wiki section order stable; only refresh impacted sections to avoid drift.

Minimum required wiki sync payload on each commit/push:

- `Last updated` date
- `Version synced with manifest.json`
- current top changes from the release/commit intent
- any changed policy blocks:
  - capability tiers (`Basic`, `Pro`, `Ultra`)
  - local-only/no-tracking rules
  - quality/CI gates
  - UX/UI/Figma source-of-truth references
  - roadmap deltas

Source consistency rule:

- If a commit changes any of these files, update corresponding wiki sections in the same push cycle:
  - `README.md`
  - `docs/dev-workflow.md`
  - `docs/ui-handoff.md`
  - `docs/thecollector-2.0-90-day-roadmap.md`
  - `docs/help-user-guide.md`

Publish workflow:

1. `gh repo clone palisades-berlin/TheCollector.wiki <tmp/wiki>`
2. Update `<tmp/wiki>/Home.md`
3. Commit and push wiki changes immediately after repo push (same working session)
4. Use concise wiki commit messages tied to the repo change intent

## Help Documentation Rules

1. **Rule 1 — Implementation parity:** `docs/help-user-guide.md` and the `Help & FAQ` section in `src/options/options.html` must only describe features that exist in the current release. Never document planned or roadmap features in user-facing help content.
2. **Rule 2 — Pre-commit gate:** `npm run test:docs-policy` includes a help-doc freshness check. Run it and fix any failures before committing. Do not bypass or weaken this gate.
3. **Rule 3 — Consistency:** Both help surfaces must stay in sync. Any change to `docs/help-user-guide.md` requires a matching update to the options.html FAQ in the same work cycle, and vice versa.
4. **Rule 4 — Shipping a feature:** When a new feature ships, remove its phrase(s) from `UNSHIPPED_PHRASES` in `scripts/check-doc-policy.mjs` and add the feature to both `docs/help-user-guide.md` and the `src/options/options.html` Help & FAQ in the same work cycle.

## UI/UX Handoff Rule

- Figma file `THECollector - UI Kit & Screens` is the project UI single source of truth.
- Canonical URL: `https://www.figma.com/design/sECUN6qSqUygWoG7PhC548/THECollector---UI-Kit---Screens?t=UVQ55HTnnPvLrqyo-0`
- Active handoff authority node: `19:2` (`THECollector - Final Handoff Ops`)
- Before introducing new screen-level styles, implement or update shared primitives/tokens in `src/shared/ui.css`.
- Keep surface-level CSS tokenized (`--popup-*`, `--history-*`) and avoid new hardcoded visual values when an existing token exists.
- Reference `docs/ui-handoff.md` for component/state/accessibility contracts used for engineering handoff.
- Use `docs/ui-qa-audit.md` as the operational checklist for multi-pass visual calibration and QA signoff.
- Track temporary visual tolerance exceptions in `docs/visual-exception-register.md`.
- Validate first-run onboarding (`src/onboarding/onboarding.html`) and theme behavior (`system/light/dark`) during manual smoke.
- Visual parity gate is mandatory for release candidates:
  - run `npm run test:e2e:visual`
  - default target is `maxDiffPixels <= 2`; explicit per-snapshot exceptions in `tests/visual/ui-parity.spec.mjs` are temporary and must be tracked/reduced via `docs/visual-exception-register.md`.
  - popup calibration must enforce single error feedback surface (toast-only) and no duplicate stacked error messages.
  - calibration must verify modal focus trap + focus return behavior (History Files overlay) and URL Library tab keyboard navigation.
  - calibration must verify History Domain combobox behavior: captured-domain suggestion list opens on focus, supports Arrow/Enter selection, and clear icon resets domain filter state.
- For every feature add/change that affects user behavior, UX, or tier availability, update:
  - `docs/help-user-guide.md`
  - `docs/thecollector-2.0-90-day-roadmap.md` (if roadmap scope/status changed)
  - ADRs in `docs/adr/` when architecture/policy decisions changed.
- For structural refactors, keep entrypoint files thin and aligned to visible runtime/UI boundaries:
  - service worker as bootstrap + handlers
  - popup by panel
  - settings by section.

## CI

- GitHub Actions workflow: `.github/workflows/ci.yml`
- CI runs release-blocking jobs on push and pull request:
  - quality (lint + repo-hygiene + unit + coverage thresholds + runtime coverage + preview-export coverage + security policy + format)
  - integration
  - stability
  - performance
  - e2e smoke
  - visual parity
  - packaging (depends on all gates above)

## Branch Protection Policy (Main)

- `main` requires:
  - required status checks
  - admin enforcement
  - conversation resolution
- GitHub branch protection settings are authoritative if this section drifts.

## Test Failure Triage Workflow

1. Identify failing gate category (`quality`, `integration`, `stability`, `performance`, `visual`).
2. Reproduce locally with the corresponding npm script.
3. Fix root cause first; avoid weakening thresholds or bypassing gates.
4. If a policy false-positive is unavoidable, add a narrow allowlist entry with inline rationale and changelog note.
5. Re-run full local quality checklist before requesting review.

## Documentation Credit Note

Implemented with Codex AI, Claude, Perplexity assistance and my fantasy.
