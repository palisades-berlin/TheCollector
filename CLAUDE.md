# THE Collector - Maintainer Context

## Project Summary
`THE Collector` is a Chrome/Edge extension (Manifest V3) that combines full-page screenshot capture with URL collection.
Current extension version: `1.3.6`.

## Engineering Rules
- Keep behavior stable and avoid core logic rewrites unless required.
- Versioning policy: use semantic `x.y.z` and bump on every code change.
- Sync version in `manifest.json`, `README.md`, and `CLAUDE.md` together.
- Packaging discipline: release archives must exclude local/development artifacts (`node_modules`, `.git`, tests, and local notes/docs not required by runtime).

## Local checks
```bash
node tests/url-utils.test.mjs
```

## Release packaging
```bash
./scripts/package-release.sh
```
