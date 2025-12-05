# --- cron helpers (source me after edurebel-pg.sh) ---

cron_unsched()      { pg_pool -c "select cron.unschedule('${1}');"; }
cron_unsched_safe() { pg_pool -c "select cron.unschedule('${1}');" >/dev/null 2>&1 || true; }

# One-off that runs next minute, waits for completion, then unschedules (clean status)
cron_once_clean() {
  local name="$1" body_sql="$2"
  local payload id
  payload=$(cat <<'SQL'
select cron.schedule('%NAME%','* * * * *', $$%BODY%;
  select cron.unschedule('%NAME%');$$);
SQL
)
  payload=${payload//'%NAME%'/$name}
  payload=${payload//'%BODY%'/$body_sql}
  id=$(pg_pool -X -t -A -q -c "$payload" | sed -E 's/[^0-9].*$//')
  [ -z "$id" ] && { echo "Failed to schedule"; return 1; }
  export CRON_LAST_JOBID="$id"
  # poll for completion (≤90s)
  for _ in {1..90}; do
    local done; done=$(pg_pool -t -A -q -c "select count(*) from cron.job_run_details where jobid=${id} and end_time is not null;")
    [ "$done" -gt 0 ] && break
    sleep 1
  done
  cron_unsched_safe "$name"
  echo "✔ One-off finished (jobid=$id)"
}

cron_runs_id() {
  local raw="${1:-$CRON_LAST_JOBID}"
  local id="$(echo "$raw" | sed -E 's/[^0-9].*$//')"
  pg_pool -c "select * from cron.job_run_details
              where jobid=${id}
              order by end_time desc nulls last limit 20;"
}

# Create/replace a standing job
cron_sched() { local name="$1" spec="$2" body="$3"; pg_pool -c "select cron.unschedule('${name}'); select cron.schedule('${name}','${spec}', \$\$${body}\$\$);"; }

cron_show() { pg_pool -c "select jobid, jobname, schedule, database, username, active from cron.job where jobname='${1}';"; }
cron_list() { pg_pool -c "select jobid, jobname, schedule, active from cron.job order by jobname;"; }

# Toggle without updating cron.job directly (permissions-safe)
cron_disable() { pg_pool -c "select cron.alter_job((select jobid from cron.job where jobname='${1}'), active => false);"; }
cron_enable()  { pg_pool -c "select cron.alter_job((select jobid from cron.job where jobname='${1}'), active => true);"; }

# Live tail for a job name (works even in watch because we re-source edurebel-pg.sh)
cron_watch() {
  local name="${1:?job name required}"
  watch -n 5 "zsh -lc \". '$HOME/edurebel-tracking/edurebel-app/scripts/edurebel-pg.sh'; pg_pool -c 'select r.jobid, r.runid, r.status, r.start_time, r.end_time from cron.job j join cron.job_run_details r using (jobid) where j.jobname='\\''${name}'\\'' order by r.end_time desc nulls last limit 5;'\""
}
