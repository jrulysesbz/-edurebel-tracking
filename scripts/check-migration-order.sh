#!/usr/bin/env bash
set -euo pipefail
dir="supabase/migrations"

# 1) Build map: table -> earliest CREATE timestamp
declare -A create_ts
while IFS= read -r f; do
  ts="$(basename "$f" | cut -d_ -f1)"
  while IFS= read -r t; do
    t="${t#public.}"; t="${t//\"/}"
    [[ -n "${create_ts[$t]:-}" && ${create_ts[$t]} -le $ts ]] || create_ts[$t]=$ts
  done < <(grep -ioE 'create table( if not exists)?[[:space:]]+public\.[a-zA-Z0-9_]+' "$f" \
           | awk '{print $NF}')
done < <(ls "$dir"/*.sql 2>/dev/null | sort)

# 2) Scan RLS/ALTER usage and compare timestamps
fail=0
while IFS= read -r f; do
  ts="$(basename "$f" | cut -d_ -f1)"
  while IFS= read -r t; do
    t="${t#public.}"; t="${t//\"/}"
    cts="${create_ts[$t]:-}"
    if [[ -n "$cts" && "$ts" -lt "$cts" ]]; then
      echo "❌ $f enables RLS/has policies for $t BEFORE its CREATE ($cts)"
      fail=1
    fi
  done < <(grep -ioE '(enable row level security|create policy|alter table)[^;]*public\.[a-zA-Z0-9_]+' "$f" \
           | grep -io 'public\.[a-zA-Z0-9_]\+')
done < <(ls "$dir"/*.sql 2>/dev/null | sort)

if [[ $fail -eq 0 ]]; then
  echo "✅ migration order OK"
else
  echo "❌ migration order check FAILED"
  exit 1
fi
