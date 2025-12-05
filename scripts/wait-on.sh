#!/usr/bin/env bash
set -euo pipefail
URL="${1:-http://localhost:3000/api/health}"
TIMEOUT="${2:-60}"
end=$((SECONDS+TIMEOUT))
while (( SECONDS < end )); do
  if curl -fsS "$URL" >/dev/null 2>&1; then
    echo "ready: $URL"
    exit 0
  fi
  sleep 0.5
done
echo "timeout waiting for $URL" >&2
exit 1
