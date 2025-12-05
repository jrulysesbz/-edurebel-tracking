-- 1) Add generated column name_ci (lower(name)) if missing
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS name_ci text GENERATED ALWAYS AS (lower(name)) STORED;

-- 2) Deduplicate existing rows on (school_id, name_ci); keep most recent
WITH r AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY school_id, name_ci
           ORDER BY inserted_at DESC NULLS LAST, id
         ) AS rn
  FROM public.rooms
)
DELETE FROM public.rooms d
USING r
WHERE d.id = r.id
  AND r.rn > 1;

-- 3) Unique index used by upsert({ onConflict: 'school_id,name_ci' })
CREATE UNIQUE INDEX IF NOT EXISTS rooms_school_name_ci_key
  ON public.rooms (school_id, name_ci);
