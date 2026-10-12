#!/usr/bin/env bash
# Build dist/lg-tv-game.skill (a zip of the skill folder).
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p dist
rm -f dist/lg-tv-game.skill
zip -qr dist/lg-tv-game.skill lg-tv-game -x "*/__pycache__/*" "*.DS_Store"
echo "Built dist/lg-tv-game.skill"
