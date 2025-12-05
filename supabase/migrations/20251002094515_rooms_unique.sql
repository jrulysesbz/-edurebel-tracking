-- Deduplicate existing rooms by (school_id, lower(name)); keep most recent
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

-- Enforce uniqueness going forward (case-insensitive per school)
CREATE UNIQUE INDEX IF NOT EXISTS rooms_school_name_key
  ON public.rooms (school_id, lower(name));
