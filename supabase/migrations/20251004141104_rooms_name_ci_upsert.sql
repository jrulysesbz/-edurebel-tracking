-- 1) Generated column for case-insensitive uniqueness
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS name_ci text GENERATED ALWAYS AS (lower(name)) STORED;

-- 2) Dedupe existing rows; keep most recent per (school_id, lower(name))
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY school_id, lower(name)
           ORDER BY inserted_at DESC NULLS LAST, id
         ) AS rn
  FROM public.rooms
)
DELETE FROM public.rooms r
USING ranked
WHERE r.id = ranked.id
  AND ranked.rn > 1;

-- 3) Enforce uniqueness going forward
CREATE UNIQUE INDEX IF NOT EXISTS rooms_school_name_ci_key
  ON public.rooms (school_id, name_ci);
