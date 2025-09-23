-- Enable RLS only if table exists
DO $$
BEGIN
  IF to_regclass('public.parent_comms') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.parent_comms ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- Create policy only if it doesn't already exist and table exists
DO $$
BEGIN
  IF to_regclass('public.parent_comms') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_policies
       WHERE schemaname = 'public'
         AND tablename  = 'parent_comms'
         AND policyname = 'parent_comms_insert_by_class_teacher'
     ) THEN
    EXECUTE $INS$
      CREATE POLICY parent_comms_insert_by_class_teacher
      ON public.parent_comms
      FOR INSERT
      TO authenticated
      USING (true)
      WITH CHECK (true);
    $INS$;
  END IF;
END $$;
