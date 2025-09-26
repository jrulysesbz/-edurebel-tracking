set -euo pipefail
APP="${APP:-http://localhost:3000}"
cd "$HOME/edurebel-tracking/edurebel-app"

ANON="$(grep -E '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' .env.local | cut -d= -f2-)"
ACCESS="$(curl -sS -X POST "https://swjgeivlqzowbzlhwdgd.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON" -H "content-type: application/json" \
  --data '{"email":"teacher@example.com","password":"Passw0rd!"}' | jq -r .access_token)"

echo "— /api/health —"
curl -sS "$APP/api/health" | jq .

echo "— /api/rooms —"
curl -sS "$APP/api/rooms" -H "authorization: Bearer $ACCESS" | jq .

ROOM_ID="$(curl -sS "$APP/api/rooms" -H "authorization: Bearer $ACCESS" | jq -r '.data[0].id')"
echo "ROOM_ID=$ROOM_ID"

echo "— POST message —"
curl -sS -X POST "$APP/api/rooms/$ROOM_ID/messages" \
  -H "authorization: Bearer $ACCESS" -H "content-type: application/json" \
  --data '{"content":"hello room from rooms_smoke.sh"}' | jq .

echo "— GET messages —"
curl -sS "$APP/api/rooms/$ROOM_ID/messages?limit=5" \
  -H "authorization: Bearer $ACCESS" | jq .
