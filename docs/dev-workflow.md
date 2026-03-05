# Developer Workflow

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
npx playwright install chromium
npm run test:e2e:smoke
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

## CI

- GitHub Actions workflow: `.github/workflows/ci.yml`
- CI runs parallel quality, e2e smoke, and packaging jobs on push and pull request.
