-- Ensure Demo School has a short_code if the column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='schools' AND column_name='short_code'
  ) THEN
    -- If no row, insert with short_code
    INSERT INTO public.schools(name, short_code)
    SELECT 'Demo School', 'DEMO'
    WHERE NOT EXISTS (SELECT 1 FROM public.schools WHERE name='Demo School');

    -- If row exists but short_code is NULL, set a value
    UPDATE public.schools
       SET short_code='DEMO'
     WHERE name='Demo School' AND short_code IS NULL;
  END IF;
END $$;
