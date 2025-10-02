#!/usr/bin/env bash
set -euo pipefail
APP_DIR="${APP_DIR:-${HOME}/edurebel-tracking/edurebel-app}"
APP_PORT="${APP_PORT:-3000}"
NEXT_START_CMD="${NEXT_START_CMD:-npm run dev}"
WAIT_TIMEOUT_SEC="${WAIT_TIMEOUT_SEC:-60}"
HEALTH_PATH="${HEALTH_PATH:-/api/health}"
PATCH_ROUTES="${PATCH_ROUTES:-1}"
KILL_OCCUPANTS="${KILL_OCCUPANTS:-1}"
REUSE_RUNNING="${REUSE_RUNNING:-0}"
ALLOW_401="${ALLOW_401:-0}"
KEEP_ALIVE="${KEEP_ALIVE:-1}"

ts(){ date +"%H:%M:%S"; }
log(){ printf "[%s] %s\n" "$(ts)" "$*"; }
info(){ log "ℹ️  $*"; }
ok(){ log "✅ $*"; }
warn(){ log "⚠️  $*" >&2; }
die(){ log "❌ $*"; exit 1; }
need(){ command -v "$1" >/dev/null 2>&1 || die "Missing dependency: $1"; }
http(){ curl -sS --fail-with-body "$@"; }
http_code(){ curl -sS --location -o /dev/null -w "%{http_code}" "$@"; }
is_up(){ local c; c="$(http_code "http://localhost:${APP_PORT}${HEALTH_PATH}" || echo 000)"; [[ "$c" =~ ^2..$ || "$c" =~ ^3..$ || ( "$ALLOW_401" = "1" && "$c" = "401" ) ]]; }
print_wait(){ printf "[%s] %s" "$(ts)" "$*"; }

need jq; need curl; need awk; need lsof; need git
[[ -d "$APP_DIR" ]] || die "APP_DIR not found: $APP_DIR"
cd "$APP_DIR"
[[ -f .env.local ]] || die ".env.local not found"

read_env(){ awk -v k="$1" 'BEGIN{FS="="} /^[[:space:]]*#/||/^[[:space:]]*$/{next}
{pos=index($0,"="); if(!pos) next; key=substr($0,1,pos-1); v=substr($0,pos+1);
gsub(/^[[:space:]]+|[[:space:]]+$/,"",key); if(key==k){gsub(/\r$/,"",v); gsub(/^[[:space:]]+|[[:space:]]+$/,"",v);
if(v ~ /^".*"$/ || v ~ /^'\''.*'\''$/) v=substr(v,2,length(v)-2); print v; exit}}' .env.local; }

ADMIN_TOKEN="$(read_env ADMIN_BEARER_TOKEN || true)"
SUPA_URL="$(read_env NEXT_PUBLIC_SUPABASE_URL || true)"
SUPA_SVC="$(read_env SUPABASE_SERVICE_ROLE || true)"
[[ -n "${ADMIN_TOKEN:-}" ]] || die "Missing ADMIN_BEARER_TOKEN"
[[ -n "${SUPA_URL:-}" && -n "${SUPA_SVC:-}" ]] || die "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE"

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
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg }, { status: 500 });
  }
}
TS
  git add -A >/dev/null 2>&1 || true
  git commit -m "fix(api): schools route uses createSupabaseForRequest" >/dev/null 2>&1 || true
fi

LOG_FILE="${LOG_FILE:-/tmp/next-dev.log}"
SERVER_PID=""
if [[ "$REUSE_RUNNING" -eq 1 ]] && is_up; then
  ok "Reusing server on :$APP_PORT"
else
  if pids="$(lsof -nPi :"${APP_PORT}" -sTCP:LISTEN -t 2>/dev/null || true)" && [[ -n "${pids:-}" ]]; then
    info "Port :$APP_PORT is in use by PIDs: $pids"
    if [[ "$KILL_OCCUPANTS" -eq 1 ]]; then
      to_kill=()
      for pid in $pids; do if ps -o comm= -p "$pid" | grep -Eiq 'node|next|bun|npm|yarn|pnpm'; then to_kill+=("$pid"); fi; done
      if [[ ${#to_kill[@]} -gt 0 ]]; then info "Killing: ${to_kill[*]}"; kill -9 "${to_kill[@]}" || true; fi
    fi
  fi
  info "Starting Next on :$APP_PORT in background…"
  ( PORT="$APP_PORT" bash -lc "$NEXT_START_CMD" ) >"$LOG_FILE" 2>&1 &
  SERVER_PID=$!
  trap 'if [[ -n "${SERVER_PID:-}" && "${KEEP_ALIVE}" != "1" ]]; then info "Stopping dev server ${SERVER_PID}"; kill "${SERVER_PID}" 2>/dev/null || true; fi' EXIT
fi

print_wait "Waiting for http://localhost:${APP_PORT}${HEALTH_PATH} …"
deadline=$((SECONDS + WAIT_TIMEOUT_SEC))
until is_up; do
  printf "."
  sleep 0.5
  if [[ $SECONDS -ge $deadline ]]; then echo; tail -n 80 "$LOG_FILE" 2>/dev/null || true; die "Timeout (${WAIT_TIMEOUT_SEC}s)"; fi
  if [[ -n "${SERVER_PID:-}" ]] && ! kill -0 "$SERVER_PID" 2>/dev/null; then echo; tail -n 80 "$LOG_FILE" 2>/dev/null || true; die "Dev server exited"; fi
done
echo; ok "Server ready on :$APP_PORT"
info "Using ADMIN token (len=${#ADMIN_TOKEN})"

jq_or_cat(){ jq . 2>/dev/null || cat; }

info "Fetching schools via app route…"
SCHOOLS_JSON="$(http -H "Authorization: Bearer ${ADMIN_TOKEN}" "http://localhost:${APP_PORT}/api/schools" || true)"
[[ -n "${SCHOOLS_JSON:-}" ]] || die "Empty response from /api/schools"
printf "%s\n" "$SCHOOLS_JSON" | jq_or_cat
SCHOOL_ID="$(printf "%s" "$SCHOOLS_JSON" | jq -r '.data[0].id // empty')"
if [[ -z "${SCHOOL_ID:-}" ]]; then
  info "No schools found; creating one via Supabase REST…"
  http -X POST "$SUPA_URL/rest/v1/schools" \
    -H "apikey: $SUPA_SVC" -H "Authorization: Bearer $SUPA_SVC" \
    -H "Content-Type: application/json" -H "Prefer: return=representation" \
    -d '{"name":"Demo School"}' | jq_or_cat
  SCHOOL_ID="$(http "$SUPA_URL/rest/v1/schools?select=id&order=created_at.desc&limit=1" \
    -H "apikey: $SUPA_SVC" -H "Authorization: Bearer $SUPA_SVC" | jq -r '.[0].id')"
fi
[[ -n "${SCHOOL_ID:-}" ]] || die "Could not obtain SCHOOL_ID"
ok "Using SCHOOL_ID=$SCHOOL_ID"

info "Ensuring room 'General' exists…"
ROOMS_FOR_SCHOOL="$(http -H "Authorization: Bearer ${ADMIN_TOKEN}" "http://localhost:${APP_PORT}/api/rooms?school_id=${SCHOOL_ID}&name=General" || true)"
EXISTING_ID="$(printf "%s" "$ROOMS_FOR_SCHOOL" | jq -r '.data[]? | select((.name|ascii_downcase)=="general" and .school_id=="'"$SCHOOL_ID"'") | .id' | head -n1)"
if [[ -n "${EXISTING_ID:-}" ]]; then
  ok "Room 'General' already exists (id=${EXISTING_ID})"
else
  ROOM_PAYLOAD="$(jq -n --arg name "General" --arg sid "$SCHOOL_ID" '{name:$name, school_id:$sid}')"
  printf "%s\n" "$ROOM_PAYLOAD" | jq_or_cat
  ROOM_CREATE="$(http -H "Authorization: Bearer ${ADMIN_TOKEN}" -H "Content-Type: application/json" \
    -X POST "http://localhost:${APP_PORT}/api/rooms" --data-binary "$ROOM_PAYLOAD" || true)"
  if printf "%s" "$ROOM_CREATE" | jq -e '.error | fromjson? | .code == "23505"' >/dev/null 2>&1; then
    ok "Room 'General' already existed (conflict handled)."
  else
    printf "%s\n" "$ROOM_CREATE" | jq_or_cat
  fi
fi

info "Listing rooms…"
http -H "Authorization: Bearer ${ADMIN_TOKEN}" "http://localhost:${APP_PORT}/api/rooms" | jq_or_cat

echo
ok "Done. To stop the dev server manually: $( [[ -n "${SERVER_PID:-}" ]] && echo "kill ${SERVER_PID}" || echo "n/a (reused)")"
if [[ "${KEEP_ALIVE}" == "1" && -n "${SERVER_PID:-}" ]]; then info "KEEP_ALIVE=1 set; leaving dev server running (pid ${SERVER_PID})."; fi
