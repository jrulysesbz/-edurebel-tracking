set -euo pipefail
EMAIL="${1:-test@example.com}"
PASS="${2:-Passw0rd!}"

# shellcheck source=/dev/null
source scripts/sb-env.sh

echo "→ Signup (safe if exists)"
curl -sS -X POST "${API_URL}/auth/v1/signup" \
  -H "apikey: ${ANON}" -H "Content-Type: application/json" \
  -d "$(jq -n --arg e "$EMAIL" --arg p "$PASS" '{email:$e,password:$p}')" \
  | jq -r '.user.id // "ok"'

echo "→ Sign in"
ACCESS="$(
  curl -sS -X POST "${API_URL}/auth/v1/token?grant_type=password" \
    -H "apikey: ${ANON}" -H "Content-Type: application/json" \
    -d "$(jq -n --arg e "$EMAIL" --arg p "$PASS" '{email:$e,password:$p}')" \
  | jq -r '.access_token'
)"
[[ -n "${ACCESS}" && "${ACCESS}" != "null" ]] || { echo "Login failed (check ANON/email/pass)."; exit 2; }
echo "token length=${#ACCESS}"

echo "→ CORS preflight risk-scan (expect 204)"
curl -si -X OPTIONS "${FURL}/risk-scan" \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization,content-type" | head -n 15

echo "→ Get class_id (service role REST)"
CID="$(curl -sS "${API_URL}/rest/v1/classes?select=id&limit=1" \
  -H "apikey: ${ANON}" -H "Authorization: Bearer ${SERVICE}" | jq -r '.[0].id // empty')"
echo "class_id=${CID:-<none>}"

echo "→ weekly-reports (POST)"
curl -sS -X POST "${FURL}/weekly-reports" \
  -H "apikey: ${ANON}" \
  -H "Authorization: Bearer ${ACCESS}" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg cid "$CID" '{class_id:$cid}')" | jq .

echo "→ Get student_id (service role REST)"
SID="$(curl -sS "${API_URL}/rest/v1/students?select=id&limit=1" \
  -H "apikey: ${ANON}" -H "Authorization: Bearer ${SERVICE}" | jq -r '.[0].id // empty')"
echo "student_id=${SID:-<none>}"

echo "→ notify-guardian (POST)"
curl -sS -X POST "${FURL}/notify-guardian" \
  -H "apikey: ${ANON}" \
  -H "Authorization: Bearer ${ACCESS}" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg sid "$SID" '{student_id:$sid,topic:"Reminder",message:"Please sign the form",channels:["email"]}')" | jq .
