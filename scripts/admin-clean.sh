#!/usr/bin/env bash
set -euo pipefail

APP="${APP:-http://127.0.0.1:3000}"
pattern="${PATTERN:-}"
dry_run="${DRY:-1}"         # default dry-run
confirm="${CONFIRM:-}"      # required when dry_run=0
timeout_sec="${TIMEOUT:-30}"

# args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --pattern) shift; pattern="${1:-}";;
    --pattern=*) pattern="${1#*=}";;
    --dry-run) shift; dry_run="${1:-1}";;
    --dry-run=*) dry_run="${1#*=}";;
    --confirm) shift; confirm="${1:-}";;
    --confirm=*) confirm="${1#*=}";;
    --timeout) shift; timeout_sec="${1:-30}";;
    --timeout=*) timeout_sec="${1#*=}";;
    --debug) set -x; shift; continue;;
    *) echo "Unknown arg: $1" >&2; exit 2;;
  esac; shift
done

die(){ printf "❌ %s\n" "$*" >&2; exit 1; }
need(){ command -v "$1" >/dev/null 2>&1 || die "Missing tool: $1"; }
trim(){ sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//'; }
pretty(){ command -v jq >/dev/null 2>&1 && jq . || cat; }
json_payload(){
  local p="$1" d="$2" c="$3"
  if command -v jq >/dev/null 2>&1; then
    jq -n --arg p "$p" --argjson d "$d" --arg c "$c" '{pattern:$p, dryRun:$d, confirm:$c}'
  elif command -v python3 >/dev/null 2>&1; then
    python3 - "$p" "$d" "$c" <<'PY'
import json,sys
p=sys.argv[1]; d=bool(int(sys.argv[2])); c=sys.argv[3]
print(json.dumps({"pattern":p, "dryRun":d, "confirm":c}))
PY
  else
    printf '{"pattern":"%s","dryRun":%s,"confirm":"%s"}\n' \
      "$(printf %s "$p" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g')" "$d" \
      "$(printf %s "$c" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g')"
  fi
}
probe(){ curl -fsS "$APP/api/admin-check" >/dev/null 2>&1 || curl -fsS "$APP" >/dev/null 2>&1; }

need curl
[ -f .env.local ] || die ".env.local not found. Run from your app root."
ADMIN_TOKEN="$(grep -m1 -E '^ADMIN_BEARER_TOKEN=' .env.local | cut -d= -f2- | trim || true)"
[ -n "${ADMIN_TOKEN:-}" ] || die "ADMIN_BEARER_TOKEN missing in .env.local"

[ -n "${pattern:-}" ] || die "--pattern (or PATTERN env) is required, e.g. 'Seeded Student %'"
[[ "$pattern" == *Seeded* ]] || die "Refuse broad delete; include 'Seeded' in pattern"
[[ "$dry_run" =~ ^[01]$ ]] || die "--dry-run must be 0 or 1"
if [[ "$dry_run" == "0" && "${confirm:-}" != "$pattern" ]]; then
  die "--confirm must exactly match pattern when dry-run=0"
fi

APP="${APP%/}"
echo "⏳ Waiting for $APP (timeout ${timeout_sec}s)…"
for ((i=0;i<timeout_sec*2;i++)); do probe && break || sleep 0.5; done
probe || die "App not reachable at $APP"

body="$(json_payload "$pattern" "$dry_run" "${confirm:-}")"
echo "▶ Cleanup → $APP/api/admin/students/cleanup  (dry=$dry_run, pattern=$pattern)"
curl -sS -X POST "$APP/api/admin/students/cleanup" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "content-type: application/json" \
  --data-raw "$body" | pretty
