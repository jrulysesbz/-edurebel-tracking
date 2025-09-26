#!/usr/bin/env bash
set -euo pipefail

dir="supabase/migrations"
tmpdir="$(mktemp -d)"
create_file="$tmpdir/create.tsv"
touch_file="$tmpdir/touch.tsv"

# Pass 1: collect CREATE TABLE timestamps
: > "$create_file"
for f in $(ls "$dir"/*.sql | sort); do
  ts="$(basename "$f" | cut -d_ -f1)"
  grep -ioE 'create table( if not exists)?[[:space:]]+public\.[a-zA-Z0-9_]+' "$f" \
  | awk -v ts="$ts" -v file="$f" '{print ts "\t" file "\tcreate\t" $NF}' >> "$create_file" || true
done

# Pass 2: collect any RLS/policy/ALTER touches
: > "$touch_file"
for f in $(ls "$dir"/*.sql | sort); do
  ts="$(basename "$f" | cut -d_ -f1)"
  grep -ioE '(enable row level security|create policy|alter table)[^;]*public\.[a-zA-Z0-9_]+' "$f" \
  | grep -io 'public\.[A-Za-z0-9_]+' \
  | awk -v ts="$ts" -v file="$f" '{print ts "\t" file "\ttouch\t" $0}' >> "$touch_file" || true
done

# Evaluate: error if a "touch" occurs before the earliest CREATE of that table
awk -F'\t' '
  BEGIN { fail=0 }
  FNR==NR {
    gsub(/^public\./,"",$4); tbl=$4
    if (!(tbl in firstCreate) || $1 < firstCreate[tbl]) firstCreate[tbl]=$1
    next
  }
  {
    gsub(/^public\./,"",$4); tbl=$4
    ts=$1; file=$2
    if (tbl in firstCreate && ts < firstCreate[tbl]) {
      printf("❌ %s touches %s before its CREATE at %s\n", file, tbl, firstCreate[tbl])
      fail=1
    }
  }
  END { exit fail }
' "$create_file" "$touch_file"

rm -rf "$tmpdir"
