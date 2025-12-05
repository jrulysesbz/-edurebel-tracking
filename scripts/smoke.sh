#!/usr/bin/env bash
set -euo pipefail
APP=${APP:-http://127.0.0.1:3001}
API="https://swjgeivlqzowbzlhwdgd.supabase.co"
ANON=$(grep -E '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' .env.local | cut -d= -f2-)
ACCESS=$(curl -sS -X POST "$API/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON" -H "content-type: application/json" \
  --data-raw '{"email":"teacher@example.com","password":"Passw0rd!"}' | jq -r .access_token)
echo "ACCESS len: ${#ACCESS}"
for path in schools students classes; do
  echo "---- $APP/api/$path ----"
  curl -sS -H "Authorization: Bearer $ACCESS" "$APP/api/$path" | jq .
done
