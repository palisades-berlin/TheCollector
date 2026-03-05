#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/dist"
VERSION="$(node -p "require('$ROOT_DIR/manifest.json').version")"
ZIP_PATH="$OUT_DIR/the-collector-v${VERSION}.zip"
FORBIDDEN_RE='(^|/)(docs/|tests/|node_modules/|\.git/)|(^|/)[^/]+\.md$|(^|/)\.(editorconfig|eslintignore|eslintrc\.cjs|gitignore|prettierrc)$'

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
