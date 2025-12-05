#!/usr/bin/env bash
set -euo pipefail
APP_DIR="${APP_DIR:-$HOME/edurebel-tracking/edurebel-app}"
cd "$APP_DIR"
PATTERN="${1:-Seeded Student %}"
OUT="${2:-tmp/students.csv}"
APP="${APP:-http://127.0.0.1:3000}" \
APP_DIR="$APP_DIR" \
bash scripts/admin-export.sh "$PATTERN" "$OUT"
