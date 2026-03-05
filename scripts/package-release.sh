#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/dist"
VERSION="$(node -p "require('$ROOT_DIR/manifest.json').version")"
ZIP_PATH="$OUT_DIR/the-collector-v${VERSION}.zip"
FORBIDDEN_RE='(^|/)(docs/|tests/|node_modules/|\.git/)|(^|/)[^/]+\.md$|(^|/)\.(editorconfig|eslintignore|eslintrc\.cjs|gitignore|prettierrc)$'
CHANGELOG_VERSION="$(sed -n 's/^## \([0-9][0-9.]*\) - .*/\1/p' "$ROOT_DIR/CHANGELOG.md" | head -n 1)"

if [[ -z "$CHANGELOG_VERSION" ]]; then
  echo "Packaging error: could not parse top changelog version from CHANGELOG.md."
  exit 1
fi

if [[ "$CHANGELOG_VERSION" != "$VERSION" ]]; then
  echo "Packaging error: manifest version ($VERSION) does not match top changelog version ($CHANGELOG_VERSION)."
  exit 1
fi

if TAG="$(git -C "$ROOT_DIR" describe --tags --exact-match 2>/dev/null)"; then
  TAG_VERSION="${TAG#v}"
  if [[ "$TAG_VERSION" != "$VERSION" ]]; then
    echo "Packaging error: git tag ($TAG) does not match manifest/changelog version ($VERSION)."
    exit 1
  fi
fi

mkdir -p "$OUT_DIR"
rm -f "$ZIP_PATH"

cd "$ROOT_DIR"
zip -r "$ZIP_PATH" manifest.json assets src \
  -x "*.DS_Store" \
     "docs/*" \
     "tests/*" \
     "*.md" \
     ".editorconfig" \
     ".eslintignore" \
     ".eslintrc.cjs" \
     ".gitignore" \
     ".prettierrc"

if unzip -l "$ZIP_PATH" | awk '{print $4}' | grep -E "$FORBIDDEN_RE" >/dev/null; then
  echo "Packaging error: release zip contains forbidden non-runtime files."
  exit 1
fi

echo "Created: $ZIP_PATH"
