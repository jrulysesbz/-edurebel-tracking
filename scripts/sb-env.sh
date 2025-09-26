set -euo pipefail

# ---- EDIT THESE 3 LINES (REAL values) ----
export REF="swjgeivlqzowbzlhwdgd"
export ANON="PASTE_REAL_ANON_KEY"
export SERVICE="PASTE_REAL_SERVICE_ROLE_KEY"
# Optional: only if your functions validate custom JWT
export JWT="${JWT:-}"

# ------------------------------------------
export API_URL="https://${REF}.supabase.co"
export FURL="https://${REF}.functions.supabase.co"

[[ "${#ANON}" -gt 30 ]] || { echo "ANON looks invalid"; exit 1; }
[[ "${#SERVICE}" -gt 30 ]] || { echo "SERVICE looks invalid"; exit 1; }

supabase secrets set \
  FUNC_SUPABASE_URL="${API_URL}" \
  FUNC_ANON_KEY="${ANON}" \
  FUNC_SERVICE_ROLE_KEY="${SERVICE}" \
  FUNC_JWT_SECRET="${JWT}" \
  JWT_SECRET="${JWT}" \
  CORS_ORIGIN="http://localhost:3000" >/dev/null
