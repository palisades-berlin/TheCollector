#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="$(node -p "require('$ROOT_DIR/manifest.json').version")"
TAG="v${VERSION}"
ZIP_PATH="$ROOT_DIR/dist/the-collector-v${VERSION}.zip"
ATTEST_LINE="manual-smoke: pass"
ATTEST_VALUE="$(printf '%s' "${MANUAL_SMOKE_ATTEST:-}" | tr '[:upper:]' '[:lower:]')"

if ! command -v gh >/dev/null 2>&1; then
  echo "Release publish error: gh CLI is required."
  exit 1
fi

if [[ ! -f "$ZIP_PATH" ]]; then
  echo "Release publish error: release zip not found at $ZIP_PATH"
  echo "Run ./scripts/package-release.sh first."
  exit 1
fi

if [[ "$ATTEST_VALUE" != "pass" ]]; then
  echo "Release publish error: manual smoke attestation is required."
  echo "Run manual smoke first, then execute with: MANUAL_SMOKE_ATTEST=pass ./scripts/publish-release-with-asset.sh"
  exit 1
fi

if gh release view "$TAG" --repo palisades-berlin/TheCollector >/dev/null 2>&1; then
  BODY="$(gh release view "$TAG" --repo palisades-berlin/TheCollector --json body --jq '.body // \"\"')"
  if ! printf '%s\n' "$BODY" | grep -Eiq '^manual-smoke:[[:space:]]*pass$'; then
    echo "Release publish error: release notes for $TAG must include '$ATTEST_LINE'."
    echo "Update release notes, then rerun this command."
    exit 1
  fi
  echo "Release $TAG exists. Uploading zip asset with --clobber."
  gh release upload "$TAG" "$ZIP_PATH" --clobber --repo palisades-berlin/TheCollector
else
  echo "Creating release $TAG with generated zip."
  NOTES="$(printf 'Release %s\n\n%s\n' "$TAG" "$ATTEST_LINE")"
  gh release create "$TAG" "$ZIP_PATH" \
    --repo palisades-berlin/TheCollector \
    --title "$TAG" \
    --notes "$NOTES"
fi

echo "Release asset sync complete: $ZIP_PATH"
