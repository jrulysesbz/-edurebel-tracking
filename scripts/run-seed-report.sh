#!/usr/bin/env bash
set -euo pipefail
APP_DIR="${APP_DIR:-$HOME/edurebel-tracking/edurebel-app}"
cd "$APP_DIR"
APP="${APP:-http://127.0.0.1:3000}" \
APP_DIR="$APP_DIR" \
bash scripts/admin-report.sh "${1:-Seeded Student %}"
