#!/usr/bin/env bash
# File: scripts/dev-smoke.sh
set -euo pipefail

APP_DIR="${APP_DIR:-${HOME}/edurebel-tracking/edurebel-app}"
APP_PORT="${APP_PORT:-3000}"
NEXT_START_CMD="${NEXT_START_CMD:-npm run dev}"
WAIT_TIMEOUT_SEC="${WAIT_TIMEOUT_SEC:-60}"
HEALTH_PATH="${HEALTH_PATH:-/}"

PATCH_ROUTES="${PATCH_ROUTES:-1}"
KILL_OCCUPANTS="${KILL_OCCUPANTS:-1}"
REUSE_RUNNING="${REUSE_RUNNING:-0}"
ALLOW_401="${ALLOW_401:-1}"

usage() {
  cat <<EOF
Usage: $(basename "$0") [options]
  -d, --dir DIR     App directory (default: $APP_DIR)
  -p, --port N      Port (default: $APP_PORT)
  --cmd CMD         Next start command (default: $NEXT_START_CMD)
  --no-patch        Do not patch /api/schools route
  --no-kill         Do not kill processes on the port
  --reuse           Reuse an already running server on the port
  --timeout SEC     Wait timeout seconds (default: $WAIT_TIMEOUT_SEC)
  -h, --help        Show help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -d|--dir) APP_DIR="$2"; shift 2;;
    -p|--port) APP_PORT="$2"; shift 2;;
    --cmd) NEXT_START_CMD="$2"; shift 2;;
    --no-patch) PATCH_ROUTES=0; shift;;
    --no-kill) KILL_OCCUPANTS=0; shift;;
    --reuse) REUSE_RUNNING=1; shift;;
    --timeout) WAIT_TIMEOUT_SEC="$2"; shift 2;;
    -h|--help) usage; exit 0;;
    *) echo "Unknown arg: $1"; usage; exit 2;;
  esac
done

ts() { date +"%H:%M:%S"; }
log()  { printf "[%s] %s\n" "$(ts)" "$*"; }
info() { log "ℹ️  $*"; }
ok()   { log "✅ $*"; }
warn() { log "⚠️  $*" >&2; }
die()  { log "❌ $*"; exit 1; }
need() { command -v "$1" >/dev/null 2>&1 || die "Missing dependency: $1"; }

read_env() {
  local key="$1" env_file="${2:-.env.local}"
  [[ -f "$env_file" ]] || { echo ""; return 0; }
  awk -v k="$key" '
    BEGIN{FS="="}
    /^[[:space:]]*#/||/^[[:space:]]*$/ { next }
    { pos=index($0,"="); if(!pos) next
      kraw=substr($0,1,pos-1); v=substr($0,pos+1)
      gsub(/^[[:space:]]+|[[:space:]]+$/,"",kraw)
      if(kraw==k){
        gsub(/\r$/,"",v); gsub(/^[[:space:]]+|[[:space:]]+$/,"",v)
        if (v ~ /^".*"$/ || v ~ /^'\''.*'\''$/) v=substr(v,2,length(v)-2)
        print v; exit
      }
    }' "$env_file"
}

http() { curl -sS --fail-with-body "$@"; }
http_code() { curl -sS --location -o /dev/null -w "%{http_code}" "$@"; }

is_up() {
  local url="$1" code
  code="$(http_code "$url" || echo 000)"
  [[ "$code" =~ ^2[0-9]{2}$ || "$code" =~ ^3[0-9]{2}$ || ( "$ALLOW_401" = "1" && "$code" = "401" ) ]]
}

tail_log_hint() {
  local logf="$1"
  warn "Dev server log (last 60 lines):"
  [[ -f "$logf" ]] && tail -n 60 "$logf" || warn "No log file at $logf"
}

kill_port() {
  local port="$1"
  local pids; pids="$(lsof -nPi :"${port}" -sTCP:LISTEN -t 2>/dev/null || true)"
  [[ -z "${pids:-}" ]] && return 0
  info "Port :$port is in use by PIDs: $pids"
  if [[ "$KILL_OCCUPANTS" -eq 1 ]]; then
    local filtered=()
    for pid in $pids; do
      if ps -o comm= -p "$pid" | grep -Eiq 'node|next|bun|npm|yarn|pnpm'; then filtered+=("$pid"); fi
    done
    if [[ ${#filtered[@]} -gt 0 ]]; then
      info "Killing: ${filtered[*]}"; kill -9 "${filtered[@]}" || true
    else
      warn "Owners are non-node; not killing."
    fi
  else
    warn "Keeping existing process on :$port (per --no-kill)."
  fi
}

print_wait() { printf "[%s] %s" "$(ts)" "$*"; }

need jq; need curl; need awk; need lsof; need git
[[ -d "$APP_DIR" ]] || die "APP_DIR not found: $APP_DIR"
cd "$APP_DIR"
[[ -f .env.local ]] || die ".env.local not found in $APP_DIR"

ADMIN_TOKEN="$(read_env ADMIN_BEARER_TOKEN || true)"
SUPA_URL="$(read_env NEXT_PUBLIC_SUPABASE_URL || true)"
SUPA_SVC="$(read_env SUPABASE_SERVICE_ROLE || true)"
[[ -n "${ADMIN_TOKEN:-}" ]] || die "ADMIN_BEARER_TOKEN missing/empty in .env.local"
[[ -n "${SUPA_URL:-}" && -n "${SUPA_SVC:-}" ]] || die "NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE missing in .env.local"

if [[ "${PATCH_ROUTES}" -eq 1 ]]; then
  info "Patching /api/schools route to use createSupabaseForRequest…"
  mkdir -p src/app/api/schools
  cat > src/app/api/schools/route.ts <<'TS'
import { createSupabaseForRequest } from '@/lib/supabaseServer';

export async function GET(req: Request) {
  try {
    const supabase = createSupabaseForRequest(req);
    const { data, error } = await supabase
      .from('schools')
      .select('id,name,short_code,created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return Response.json({ data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : (typeof e === 'string' ? e : JSON.stringify(e));
    return Response.json({ error: msg }, { status: 500 });
  }
}
TS
  git add -A >/dev/null 2>&1 || true
  git commit -m "fix(api): schools route uses createSupabaseForRequest" >/dev/null 2>&1 || true
fi

LOG_FILE="${LOG_FILE:-/tmp/next-dev.log}"
SERVER_PID=""
BASE_URL="http://localhost:${APP_PORT}${HEALTH_PATH}"

if [[ "$REUSE_RUNNING" -eq 1 ]] && is_up "$BASE_URL"; then
  ok "Reusing server on :$APP_PORT"
else
  kill_port "$APP_PORT"
  info "Starting Next on :$APP_PORT in background…"
  ( PORT="$APP_PORT" bash -lc "$NEXT_START_CMD" ) >"$LOG_FILE" 2>&1 &
  SERVER_PID=$!
  trap 'if [[ -n "${SERVER_PID:-}" ]]; then info "Stopping dev server ${SERVER_PID}"; kill "${SERVER_PID}" 2>/dev/null || true; fi' EXIT
fi

print_wait "Waiting for ${BASE_URL} …"
deadline=$((SECONDS + WAIT_TIMEOUT_SEC))
while ! is_up "$BASE_URL"; do
  printf "."
  sleep 0.5
  if [[ $SECONDS -ge $deadline ]]; then
    echo
    tail_log_hint "$LOG_FILE"
    die "Timeout (${WAIT_TIMEOUT_SEC}s) waiting for server"
  fi
  if [[ -n "${SERVER_PID:-}" ]] && ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo
    tail_log_hint "$LOG_FILE"
    die "Dev server exited early"
  fi
done
echo
ok "Server ready on :$APP_PORT"
info "Using ADMIN token (len=${#ADMIN_TOKEN})"

jq_or_cat() { jq . 2>/dev/null || cat; }

info "Fetching schools via app route…"
SCHOOLS_JSON="$(http \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  "http://localhost:${APP_PORT}/api/schools" || true)"
[[ -n "${SCHOOLS_JSON:-}" ]] || { tail_log_hint "$LOG_FILE"; die "Empty response from /api/schools"; }
printf "%s\n" "$SCHOOLS_JSON" | jq_or_cat
SCHOOL_ID="$(printf "%s" "$SCHOOLS_JSON" | jq -r '.data[0].id // empty')"

if [[ -z "${SCHOOL_ID:-}" ]]; then
  info "No schools found; creating one via Supabase REST (service role)…"
  http -X POST "$SUPA_URL/rest/v1/schools" \
    -H "apikey: $SUPA_SVC" \
    -H "Authorization: Bearer $SUPA_SVC" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -d '{"name":"Demo School"}' | jq_or_cat

  SCHOOL_ID="$(
    http "$SUPA_URL/rest/v1/schools?select=id&order=created_at.desc&limit=1" \
      -H "apikey: $SUPA_SVC" \
      -H "Authorization: Bearer $SUPA_SVC" | jq -r '.[0].id'
  )"
fi

[[ -n "${SCHOOL_ID:-}" ]] || die "Could not obtain SCHOOL_ID"
ok "Using SCHOOL_ID=$SCHOOL_ID"

info "Creating room 'General'…"
ROOM_PAYLOAD="$(jq -n --arg name "General" --arg sid "$SCHOOL_ID" '{name:$name, school_id:$sid}')"
printf "%s\n" "$ROOM_PAYLOAD" | jq_or_cat

ROOM_CREATE="$(
  http \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    -X POST "http://localhost:${APP_PORT}/api/rooms" \
    --data-binary "$ROOM_PAYLOAD" || true
)"
printf "%s\n" "$ROOM_CREATE" | jq_or_cat

info "Listing rooms…"
http -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  "http://localhost:${APP_PORT}/api/rooms" | jq_or_cat

echo
ok "Done. To stop the dev server manually: $( [[ -n "${SERVER_PID:-}" ]] && echo "kill ${SERVER_PID}" || echo "n/a (reused)")"
