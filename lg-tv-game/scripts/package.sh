#!/usr/bin/env bash
# Package a game folder into an .ipk with the webOS CLI.
# Usage: bash package.sh <game-folder> [output-dir]
set -euo pipefail
GAME="${1:?game folder required}"; OUT="${2:-.}"
if ! command -v ares-package >/dev/null 2>&1; then
  echo "Installing the webOS CLI (@webos-tools/cli)..."
  npm install -g @webos-tools/cli >/dev/null
  export PATH="$PATH:$(npm prefix -g)/bin"
fi
mkdir -p "$OUT"
ares-package "$GAME" -o "$OUT"
