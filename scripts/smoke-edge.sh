#!/usr/bin/env bash
set -euo pipefail
source ~/.supabase-dev.sh && sb-env && sb-jwt >/dev/null
echo "SUPABASE_URL=$SUPABASE_URL"
echo "— risk-scan —"
curl -s -H "Authorization: Bearer $USER_JWT" "$SUPABASE_URL/functions/v1/risk-scan?limit=1" | jq .
CID="$(curl -s "$SUPABASE_URL/rest/v1/classes?select=id&limit=1" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | jq -r '.[0].id')"
echo "— weekly-reports —"
curl -s -X POST "$SUPABASE_URL/functions/v1/weekly-reports" -H "Authorization: Bearer $USER_JWT" -H "Content-Type: application/json" -d "{\"class_id\":\"$CID\"}" | jq .
SID="$(curl -s "$SUPABASE_URL/rest/v1/students?select=id&limit=1" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | jq -r '.[0].id')"
echo "— notify-guardian —"
curl -s -X POST "$SUPABASE_URL/functions/v1/notify-guardian" -H "Authorization: Bearer $USER_JWT" -H "Content-Type: application/json" -d "{\"student_id\":\"$SID\",\"topic\":\"Reminder\",\"message\":\"Please sign the form\",\"channels\":[\"email\"]}" | jq .
