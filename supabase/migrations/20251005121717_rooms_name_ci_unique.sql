-- Add case-insensitive name column
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS name_ci text GENERATED ALWAYS AS (lower(name)) STORED;

-- Unique per school (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS rooms_school_name_ci_key
  ON public.rooms (school_id, name_ci);

-- (Optional) drop the old functional-index if you created one
DROP INDEX IF EXISTS rooms_school_name_key;
