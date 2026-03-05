# THE Collector - Maintainer Context

## Project Summary
`THE Collector` is a Chrome/Edge extension (Manifest V3) that combines full-page screenshot capture with URL collection.
Current extension version: `1.3.63`.

## Engineering Rules
- Keep behavior stable and avoid core logic rewrites unless required.
- Versioning policy: use semantic `x.y.z` and bump on every code change.
- Sync version in `manifest.json`, `README.md`, and `CLAUDE.md` together.
- Packaging discipline: release archives must exclude local/development artifacts (`node_modules`, `.git`, tests, and local notes/docs not required by runtime).
- Permission-scope policy (Phase A): remove only demonstrably dead permissions; do not remove permissions that are runtime-required for capture/export flows.

## Local checks
```bash
node tests/url-utils.test.mjs
node tests/url-history.test.mjs
node tests/filename.test.mjs
node tests/ui-state-validation.test.mjs
node tests/settings.test.mjs
node tests/history-utils.test.mjs
node tests/protocol-validate.test.mjs
node tests/history-filters.test.mjs
node tests/url-repo.test.mjs
npx playwright install chromium
npm run test:e2e:smoke
npm run test:e2e:manual
```

## Release packaging
```bash
./scripts/package-release.sh
```

Use the CI-uploaded `the-collector-release-zip` artifact for store submission; local zips are validation-only.
