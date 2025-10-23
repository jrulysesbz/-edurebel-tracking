#!/usr/bin/env bash
set -euo pipefail
APPDIR="./edurebel-app"; REF_IN=""
while [[ $# -gt 0 ]]; do case "$1" in
  --appdir) APPDIR="$2"; shift 2;;
  --ref) REF_IN="$2"; shift 2;;
  *) echo "Unknown arg: $1"; exit 2;;
esac; done
OKS=(); WARNS=(); FAILS=()
hdr(){ printf "\n── %s ──\n" "$1"; }
ok(){  OKS+=("$1");   echo "✅  $1"; }
warn(){ WARNS+=("$1"); echo "⚠️   $1"; }
fail(){ FAILS+=("$1"); echo "❌  $1"; }

hdr "Repo & toolchain"
git rev-parse --is-inside-work-tree >/dev/null 2>&1 && ok "In a Git repo" || fail "Not in a Git repo"
command -v node >/dev/null 2>&1 && ok "node: $(node -v)" || fail "node missing"
command -v npm  >/dev/null 2>&1 && ok "npm:  $(npm -v)"  || fail "npm missing"
command -v supabase >/dev/null 2>&1 && ok "supabase CLI present" || warn "supabase CLI missing"
command -v psql >/dev/null 2>&1 && ok "psql present" || warn "psql missing"
command -v nc   >/dev/null 2>&1 && ok "nc present" || warn "nc missing"
command -v dig  >/dev/null 2>&1 && ok "dig present" || warn "dig missing"

hdr "App directory"
[[ -d "$APPDIR" && -f "$APPDIR/package.json" ]] && ok "App dir OK ($APPDIR)" || fail "App dir missing or invalid: $APPDIR"

hdr ".env.local sanity"
if [[ -f "$APPDIR/.env.local" ]]; then
  ok "$APPDIR/.env.local present"
  URL=$(awk -F= '/^NEXT_PUBLIC_SUPABASE_URL=/{gsub(/"/,"",$2);print $2}' "$APPDIR/.env.local")
  [[ -n "${URL:-}" ]] && ok "NEXT_PUBLIC_SUPABASE_URL=$URL" || warn "NEXT_PUBLIC_SUPABASE_URL not set"
else
  warn "$APPDIR/.env.local not found"
fi

hdr "Project ref"
REF="${REF_IN:-$(echo "${URL:-}" | sed -E 's#https?://([^.]+)\.supabase\.co.*#\1#')}"
[[ -n "$REF" ]] && ok "REF=$REF" || fail "Could not derive REF"

hdr "DNS/ports (direct host)"
HOST="db.$REF.supabase.co"
IPV4="$( (dig +short A "$HOST" 2>/dev/null || true) | head -n1 )"
IPV6="$( (dig +short AAAA "$HOST" 2>/dev/null || true) | head -n1 )"
[[ -n "$IPV4" ]] && ok "$HOST A=$IPV4" || warn "No A record for $HOST"
[[ -n "$IPV6" ]] && ok "$HOST AAAA=$IPV6" || warn "No AAAA record for $HOST"
command -v nc >/dev/null 2>&1 && nc -zw3 "$HOST" 5432 && ok "TCP 5432 open to $HOST" || warn "Cannot reach $HOST:5432"

hdr "DNS/ports (pooler)"
POOL="aws-1-ap-southeast-1.pooler.supabase.com"
PV4="$( (dig +short A "$POOL" 2>/dev/null || true) | head -n1 )"
[[ -n "$PV4" ]] && ok "$POOL A=$PV4" || warn "No A record for $POOL"
command -v nc >/dev/null 2>&1 && nc -zw3 "$POOL" 6543 && ok "TCP 6543 open to $POOL" || warn "Cannot reach $POOL:6543"

hdr "Supabase CLI auth"
if supabase projects list >/dev/null 2>&1; then ok "Supabase CLI is logged in"; else warn "Supabase CLI not logged in (run: supabase login)"; fi

hdr "Summary"
echo "✅ PASSES: ${#OKS[@]}";   for m in "${OKS[@]:-}";   do echo "  • $m"; done
echo "⚠️  WARNS : ${#WARNS[@]}"; for m in "${WARNS[@]:-}"; do echo "  • $m"; done
echo "❌ FAILS : ${#FAILS[@]}"; for m in "${FAILS[@]:-}"; do echo "  • $m"; done
