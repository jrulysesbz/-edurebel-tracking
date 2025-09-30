#!/usr/bin/env bash
set -euo pipefail

APP_DEFAULT="http://127.0.0.1:3000"
API_DEFAULT="https://swjgeivlqzowbzlhwdgd.supabase.co"
TEACHER_EMAIL_DEFAULT="teacher@example.com"
TEACHER_PASS_DEFAULT="Passw0rd!"

APP="${APP:-$APP_DEFAULT}"; API="${API:-$API_DEFAULT}"
TEACHER_EMAIL="${TEACHER_EMAIL:-$TEACHER_EMAIL_DEFAULT}"
TEACHER_PASS="${TEACHER_PASS:-$TEACHER_PASS_DEFAULT}"

SEED_N="${SEED_N:-0}"; DEBUG=0
while [[ $# -gt 0 ]]; do case "$1" in
  --seed) SEED_N="${2:-0}"; shift 2;;
  --debug) DEBUG=1; shift;;
  *) echo "Unknown arg: $1" >&2; exit 2;;
esac; done

die(){ printf "❌ %s\n" "$*" >&2; exit 1; }
need(){ command -v "$1" >/dev/null 2>&1 || die "Missing tool: $1"; }
trim(){ sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//'; }
pretty_json(){ command -v jq >/dev/null 2>&1 && jq . || { command -v python3 >/dev/null 2>&1 && python3 -m json.tool || cat; } }
json_body(){
  local k="$1" v="$2"
  if command -v jq >/dev/null 2>&1; then jq -n --arg k "$k" --arg v "$v" '{($k):$v}';
  elif command -v python3 >/dev/null 2>&1; then python3 - "$k" "$v" <<'PY'
import json,sys;k,v=sys.argv[1],sys.argv[2];print(json.dumps({k:v}))
PY
  else
    local esc; esc=$(printf '%s' "$v" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e $'s/\n/\\n/g' -e $'s/\r/\\r/g' -e $'s/\t/\\t/g')
    printf '{\"%s\":\"%s\"}\n' "$k" "$esc"
  fi
}
curlf(){ [[ $DEBUG -eq 1 ]] && echo "+ curl $*" >&2; curl --silent --show-error --fail-with-body "$@"; }
supacurl(){ local url="$1"; shift; curlf -H "Authorization: Bearer $ACCESS" "$url" "$@"; }
probe(){ curl -fsS "$1/api/health" >/dev/null 2>&1 || curl -fsS "$1/api/admin-check" >/dev/null 2>&1 || curl -fsS "$1" >/dev/null 2>&1; }
sha256_hex(){
  if command -v shasum >/dev/null 2>&1; then printf '%s' "$1" | shasum -a 256 | awk '{print $1}';
  elif command -v sha256sum >/dev/null 2>&1; then printf '%s' "$1" | sha256sum | awk '{print $1}';
  else printf '%s' "$1" | md5; fi
}
post_student_with_retry(){
  local name="$1" payload idem attempt=1 max=5 backoff=0.5
  payload="$(json_body full_name "$name")"
  idem="$(sha256_hex "$name")"
  while :; do
    local tmp code; tmp="$(mktemp -t post_student.XXXXXX)"
    code="$(curl --silent --show-error -X POST "$APP/api/students" \
      -H "Authorization: Bearer $ACCESS" -H "content-type: application/json" \
      -H "Idempotency-Key: $idem" --data-raw "$payload" -o "$tmp" -w '%{http_code}' || true)"
    [[ $DEBUG -eq 1 ]] && echo "+ POST /api/students [code=$code] name=\"$name\" idem=$idem" >&2
    if [[ "$code" =~ ^2[0-9][0-9]$ ]]; then cat "$tmp" | pretty_json; rm -f "$tmp"; return 0; fi
    if [[ "$code" == 408 || "$code" == 409 || "$code" == 429 || "$code" =~ ^5 ]]; then
      if (( attempt >= max )); then echo "HTTP $code after $attempt attempts. Body:" >&2; cat "$tmp" >&2; rm -f "$tmp"; return 1; fi
      sleep "$backoff"; attempt=$((attempt+1))
      backoff=$(awk -v b="$backoff" 'BEGIN{printf "%.3f", (b*1.6>5?5:b*1.6)}'); rm -f "$tmp"; continue
    fi
    echo "HTTP $code (non-retryable). Body:" >&2; cat "$tmp" >&2; rm -f "$tmp"; return 1
  done
}

[ -f .env.local ] || die ".env.local not found. Run in your app dir."
ANON="$(grep -m1 -E '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' .env.local | cut -d= -f2- | trim || true)"
ADMIN_BEARER_TOKEN="$(grep -m1 -E '^ADMIN_BEARER_TOKEN=' .env.local | cut -d= -f2- | trim || true)"
printf 'ANON len: %d  ADMIN_TOKEN len: %d\n' "${#ANON}" "${#ADMIN_BEARER_TOKEN}"
[ -n "$ANON" ] || die "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
[ -n "$ADMIN_BEARER_TOKEN" ] || die "Missing ADMIN_BEARER_TOKEN in .env.local"

APP="${APP%/}"; API="${API%/}"

echo "🔧 Ensuring Next dev is running…"
if ! probe "$APP"; then
  need npm; echo "   Starting dev… (logs: .next/dev.log)"
  pkill -f "next dev" >/dev/null 2>&1 || true
  rm -rf .next; mkdir -p .next
  nohup npm run dev > .next/dev.log 2>&1 &
fi
FOUND=""
for p in 3000 3001 3002 3003; do
  CAND="http://127.0.0.1:$p"
  for _ in {1..60}; do probe "$CAND" && { FOUND="$CAND"; break; }; sleep 0.5; done
  [ -n "$FOUND" ] && break
done
[ -n "$FOUND" ] || { tail -n 150 .next/dev.log || true; die "Next.js failed to start"; }
APP="$FOUND"; echo "✅ Dev server detected at: $APP"

command -v jq >/dev/null 2>&1 || echo "ℹ️ jq not found; output may not be pretty-printed."
ACCESS="$(curlf -X POST "$API/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON" -H "content-type: application/json" \
  --data-raw "$(json_body email "$TEACHER_EMAIL" | jq --arg p "$TEACHER_PASS" '. + {password:$p}')" | jq -r .access_token)"
printf 'ACCESS len: %d\n' "${#ACCESS}"
[ -n "$ACCESS" ] || die "No access token. Check ANON/teacher creds."

echo "---- admin-check (401) ----"; ( set +e; curl -sS -i "$APP/api/admin-check" | sed -n '1,10p'; echo )
echo "---- admin-check (200) ----"; curlf -i -H "Authorization: Bearer $ADMIN_BEARER_TOKEN" "$APP/api/admin-check" | sed -n '1,12p'; echo
echo "---- /api/admin/users ----";  curlf -i -H "Authorization: Bearer $ADMIN_BEARER_TOKEN" "$APP/api/admin/users" | sed -n '1,12p'; echo
echo "---- schools ----";  supacurl "$APP/api/schools"  | pretty_json
echo "---- students (BEFORE) ----"; supacurl "$APP/api/students" | pretty_json
echo "---- classes ----";  supacurl "$APP/api/classes"  | pretty_json

if [[ "$SEED_N" -eq 0 ]]; then
  NEW_NAME="Smoke Student $(date '+%Y-%m-%d %H:%M:%S')"
  echo "📝 Creating (single): $NEW_NAME"
  post_student_with_retry "$NEW_NAME"
else
  echo "🌱 Seeding ${SEED_N} students with idempotency + retry…"
  created=0; failed=0; base_ts="$(date '+%Y%m%d-%H%M%S')"
  for i in $(seq 1 "$SEED_N"); do
    name="Seeded Student ${base_ts} #$(printf '%03d' "$i")"
    if post_student_with_retry "$name" >/dev/null; then
      echo "  ✅ $name"; created=$((created+1))
    else
      echo "  ❌ $name"; failed=$((failed+1))
    fi
  done
  echo "➡ Seed summary: created=$created failed=$failed total=$SEED_N"
fi

echo "---- students (AFTER) ----"; supacurl "$APP/api/students" | pretty_json
echo "✅ All done."
