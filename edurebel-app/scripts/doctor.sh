#!/usr/bin/env bash
set -euo pipefail
ok(){ printf "✅ %s\n" "$*"; }
bad(){ printf "❌ %s\n" "$*" >&2; exit 1; }
APP="${APP:-http://127.0.0.1:3000}"

[ -f .env.local ] || bad ".env.local missing"
grep -q '^ADMIN_BEARER_TOKEN=' .env.local && ok "ADMIN_BEARER_TOKEN present" || bad "ADMIN_BEARER_TOKEN missing"
grep -q '^NEXT_PUBLIC_SUPABASE_URL=' .env.local && ok "NEXT_PUBLIC_SUPABASE_URL present" || bad "NEXT_PUBLIC_SUPABASE_URL missing"
grep -q '^SUPABASE_SERVICE_ROLE=' .env.local && ok "SUPABASE_SERVICE_ROLE present" || bad "SUPABASE_SERVICE_ROLE missing"

curl -fsS "$APP/api/health" >/dev/null && ok "Next.js dev up at $APP" || bad "Next.js not reachable at $APP"
curl -fsS -H "Authorization: Bearer $(grep -m1 ADMIN_BEARER_TOKEN .env.local | cut -d= -f2-)" "$APP/api/admin-check" >/dev/null && ok "admin-check OK" || bad "admin-check failed"

ok "doctor passed"
