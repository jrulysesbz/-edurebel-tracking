#!/usr/bin/env bash
# Wait for $1 URL to respond 2xx/3xx, timeout $2 seconds.
set -euo pipefail
URL="${1:-http://127.0.0.1:3000/api/health}"
TIMEOUT="${2:-60}"
for i in $(seq 1 "$TIMEOUT"); do
  if curl -fsS "$URL" >/dev/null 2>&1; then
    echo "✅ Next ready at $URL"; exit 0
  fi
  sleep 1
done
echo "❌ Timeout waiting for $URL" >&2
echo "Last 120 lines of .next/ci.log (if present):"
tail -n 120 .next/ci.log 2>/dev/null || true
exit 1
