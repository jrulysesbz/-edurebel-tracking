#!/usr/bin/env bash
set -euo pipefail
. "$(dirname "$0")/.env-root.inc"
. "$(dirname "$0")/.bash-urlencode.inc"

APP="${APP:-http://127.0.0.1:3000}"
PATTERN="${1:-}"
FROM="${FROM:-}"
TO="${TO:-}"

die(){ printf "❌ %s\n" "$*" >&2; exit 1; }
trim(){ sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//'; }
json_escape(){ printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' ; }

ROOT="$(find_env_root)" || die ".env.local not found; set APP_DIR or run in repo"
cd "$ROOT"

TOKEN="$(grep -m1 -E '^ADMIN_BEARER_TOKEN=' .env.local | cut -d= -f2- | trim || true)"
[ -n "$TOKEN" ] || die "ADMIN_BEARER_TOKEN missing in .env.local"
[ -n "$PATTERN" ] || die "Pattern required"

APP="${APP%/}"
build_url() {
  local p_enc="$1"; local url="$APP/api/admin/students/export?pattern=$p_enc"
  [ -n "$FROM" ] && url="$url&created_from=$(urlencode "$FROM")"
  [ -n "$TO" ]   && url="$url&created_to=$(urlencode "$TO")"
  printf '%s' "$url"
}

PENC="$(urlencode "$PATTERN")"
URL_MATCH="$(build_url "$PENC")"
URL_ALL="$(build_url "%25")"

count_csv(){ awk 'NR>1 && NF{c++} END{print c+0}'; }
matches="$(curl -sS "$URL_MATCH" -H "Authorization: Bearer $TOKEN" | count_csv)"
total="$(curl -sS "$URL_ALL"   -H "Authorization: Bearer $TOKEN" | count_csv)"

printf '{"total":%s,"matches":%s,"pattern":"%s","from":"%s","to":"%s"}\n' \
  "$total" "$matches" \
  "$(json_escape "$PATTERN")" \
  "$(json_escape "$FROM")" \
  "$(json_escape "$TO")"
