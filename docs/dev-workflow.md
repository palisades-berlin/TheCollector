# Developer Workflow

This file is the canonical source for developer/release operations to keep `README.md` and `CLAUDE.md` aligned.

## Prerequisites

- Node.js 20+
- Chrome or Edge with extension developer mode enabled

## Install

```bash
npm install
```

## Local Quality Checks

```bash
npm run lint
npm run test:unit
npm run test:coverage
npm run test:integration
npm run test:security-policy
npm run test:stability
npm run test:performance
npx playwright install chromium
npm run test:e2e:smoke
npm run test:e2e:visual
npm run test:e2e:manual
npm run format:check
npm run check
```

## Manual Run (Unpacked Extension)

1. Open `chrome://extensions` (or `edge://extensions`).
2. Enable Developer mode.
3. Click "Load unpacked" and select the repository root.
4. Pin THE Collector and open the popup to test capture/URL workflows.

## Release Packaging

```bash
./scripts/package-release.sh
```

Packaging script guardrails:

- top `CHANGELOG.md` version must match `manifest.json` version
- if `HEAD` is exactly tagged, tag version must match manifest/changelog version

## Release Artifact Source of Truth

- Use the CI-uploaded artifact (`the-collector-release-zip`) from GitHub Actions for Chrome Web Store submission.
- Treat locally generated zips as local validation only.
- Use `docs/chrome-web-store-permissions.md` as canonical permission justification text in the CWS listing/policy form.

## Versioning Rule

- Bump semantic version (`x.y.z`) on every code change.
- Keep versions synchronized in:
  - `manifest.json`
  - `package.json`
  - `README.md`
  - `CLAUDE.md`
  - `CHANGELOG.md`

## UI/UX Handoff Rule

- Figma file `THECollector - UI Kit & Screens` is the project UI single source of truth.
- Canonical URL: `https://www.figma.com/design/sECUN6qSqUygWoG7PhC548/THECollector---UI-Kit---Screens?t=UVQ55HTnnPvLrqyo-0`
- Active handoff authority node: `19:2` (`THECollector - Final Handoff Ops`)
- Before introducing new screen-level styles, implement or update shared primitives/tokens in `src/shared/ui.css`.
- Keep surface-level CSS tokenized (`--popup-*`, `--history-*`) and avoid new hardcoded visual values when an existing token exists.
- Reference `docs/ui-handoff.md` for component/state/accessibility contracts used for engineering handoff.
- Use `docs/ui-qa-audit.md` as the operational checklist for multi-pass visual calibration and QA signoff.
- Validate first-run onboarding (`src/onboarding/onboarding.html`) and theme behavior (`system/light/dark`) during manual smoke.
- Visual parity gate is mandatory for release candidates:
  - run `npm run test:e2e:visual`
  - screenshot diff threshold is `maxDiffPixels <= 2`.

## CI

- GitHub Actions workflow: `.github/workflows/ci.yml`
- CI runs release-blocking jobs on push and pull request:
  - quality (lint + unit + coverage thresholds + security policy + format)
  - integration
  - stability
  - performance
  - e2e smoke
  - visual parity
  - packaging (depends on all gates above)

## Test Failure Triage Workflow

1. Identify failing gate category (`quality`, `integration`, `stability`, `performance`, `visual`).
2. Reproduce locally with the corresponding npm script.
3. Fix root cause first; avoid weakening thresholds or bypassing gates.
4. If a policy false-positive is unavoidable, add a narrow allowlist entry with inline rationale and changelog note.
5. Re-run full local quality checklist before requesting review.
