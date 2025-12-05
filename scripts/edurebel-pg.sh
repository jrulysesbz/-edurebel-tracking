# Load env
set -a; [ -f "$HOME/edurebel-tracking/edurebel-app/.env.local" ] && . "$HOME/edurebel-tracking/edurebel-app/.env.local"; set +a

# pg_pool
pg_pool() {
  : "${SUPABASE_DB_HOST:?Missing SUPABASE_DB_HOST}"
  : "${SUPABASE_PROJECT_REF:?Missing SUPABASE_PROJECT_REF}"
  : "${SUPABASE_DB_PASSWORD:?Missing SUPABASE_DB_PASSWORD}"
  PGPASSWORD="$SUPABASE_DB_PASSWORD" PGOPTIONS="-c project=$SUPABASE_PROJECT_REF" \
  psql -X -h "$SUPABASE_DB_HOST" -p "${SUPABASE_DB_PORT:-6543}" \
       -U "postgres.$SUPABASE_PROJECT_REF" -d "${SUPABASE_DB_NAME:-postgres}" \
       -v ON_ERROR_STOP=1 "$@"
}

# Source cron helpers (defines cron_list/cron_show/cron_runs/cron_unsched/cron_once)
. "$HOME/edurebel-tracking/edurebel-app/scripts/cron-utils.sh"

echo "✅ Loaded pg_pool + cron helpers. Try: cron_list | cron_show weekly-reports | cron_runs_for weekly-reports"
