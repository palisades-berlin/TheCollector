#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="$(node -p "require('$ROOT_DIR/manifest.json').version")"
TAG="v${VERSION}"
ZIP_PATH="$ROOT_DIR/dist/the-collector-v${VERSION}.zip"

if ! command -v gh >/dev/null 2>&1; then
  echo "Release publish error: gh CLI is required."
  exit 1
fi

if [[ ! -f "$ZIP_PATH" ]]; then
  echo "Release publish error: release zip not found at $ZIP_PATH"
  echo "Run ./scripts/package-release.sh first."
  exit 1
fi

if gh release view "$TAG" --repo palisades-berlin/TheCollector >/dev/null 2>&1; then
  echo "Release $TAG exists. Uploading zip asset with --clobber."
  gh release upload "$TAG" "$ZIP_PATH" --clobber --repo palisades-berlin/TheCollector
else
  echo "Creating release $TAG with generated zip."
  gh release create "$TAG" "$ZIP_PATH" \
    --repo palisades-berlin/TheCollector \
    --title "$TAG" \
    --notes "Release $TAG"
fi

echo "Release asset sync complete: $ZIP_PATH"
