# edurebel-tracking

- **Schema snapshot**: `schema-lockin.backup` (pg_dump custom format)
- **Tag**: `v1.0-lockin` – “Production lock-in (120m window)”
- Supabase local dev is in `supabase/`.

## Restore the schema into a fresh DB (local example)

```bash
createdb schema_test
pg_restore --clean --if-exists --no-owner \
  --dbname "postgresql://postgres:postgres@127.0.0.1:54322/schema_test" \
  schema-lockin.backup
# 3) (Optional) Publish a GitHub Release from your tag
- Go to your repo → Releases → **Draft a new release**
- Tag: `v1.0-lockin`
- Title: `Production lock-in`
- Attach `schema-lockin.backup` (optional)
- Publish.

# 4) Quick “restore test” locally (safe)
This proves the backup works without touching your real DB:
```bash
createdb schema_test
pg_restore --clean --if-exists --no-owner \
  --dbname "postgresql://postgres:postgres@127.0.0.1:54322/schema_test" \
  schema-lockin.backup
psql "postgresql://postgres:postgres@127.0.0.1:54322/schema_test" -c "\dt public.*"
