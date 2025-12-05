set -euo pipefail
APP="${APP:-$(for p in 3000 3001; do curl -fsS http://localhost:$p/api/health >/dev/null APP="${APP:-http://localhost:3000}"APP="${APP:-http://localhost:3000}" echo http://localhost:$p APP="${APP:-http://localhost:3000}"APP="${APP:-http://localhost:3000}" break; done)}"

ANON="$(grep -E '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' .env.local | cut -d= -f2-)"
if [ -z "${ANON:-}" ]; then
  echo "Could not read NEXT_PUBLIC_SUPABASE_ANON_KEY from .env.local" >&2
  exit 1
fi

API="https://swjgeivlqzowbzlhwdgd.supabase.co"
TEACHER_EMAIL="teacher@example.com"
TEACHER_PASS="Passw0rd!"

ACCESS="$(curl -sS -X POST "$API/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON" -H "content-type: application/json" \
  --data "{\"email\":\"$TEACHER_EMAIL\",\"password\":\"$TEACHER_PASS\"}" | jq -r .access_token)"

echo "ACCESS len: ${#ACCESS}  prefix: ${ACCESS:0:16}…"
[ -n "$ACCESS" ] && [ "$ACCESS" != "null" ] || { echo "Login failed"; exit 1; }

echo "---- /api/health ----"
curl -sS "$APP/api/health" | jq .

echo "---- /api/schools ----"
curl -sS "$APP/api/schools"            -H "authorization: Bearer $ACCESS" | jq .

echo "---- /api/students?limit=5 ----"
curl -sS "$APP/api/students?limit=5"   -H "authorization: Bearer $ACCESS" | jq .

echo "---- /api/classes ----"
curl -sS "$APP/api/classes"            -H "authorization: Bearer $ACCESS" | jq .
