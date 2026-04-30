#!/usr/bin/env bash
set -euo pipefail

BASE_PATH="${1:-/}"
PORT="${2:-4173}"

if [[ ! -f "./package.json" ]]; then
  echo "Run this command from the repository root."
  exit 1
fi

tmpdir="$(mktemp -d)"
trap 'rm -rf "${tmpdir}"' EXIT

echo "Building Storybook, TypeDoc, and testapp for ${BASE_PATH}..."
STORYBOOK_BASE_PATH="${BASE_PATH}/storybook" bun run --cwd ./apps/storybook build:pages
TYPEDOC_BASE_PATH="${BASE_PATH}/typedoc" bun run docs:pages
VITE_BASE_PATH="${BASE_PATH}/testapp/" VITE_PUBLIC_BASE_PATH="${BASE_PATH}/testapp" bun run --cwd ./apps/testapp build:pages

cp ./apps/storybook/public/pages-index.html ./_site/index.html
mkdir -p ./_site/assets
cp -r ./apps/storybook/public/assets/. ./_site/assets/
cp -R ./_site/. "${tmpdir}/"

echo "Serving from ${tmpdir}"
echo "Open http://localhost:${PORT}"
bunx serve "${tmpdir}" --listen "${PORT}"
