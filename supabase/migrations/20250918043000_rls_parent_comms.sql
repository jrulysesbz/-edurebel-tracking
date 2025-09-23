DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='parent_comms'
  ) THEN
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    CREATE TABLE public.parent_comms (
      id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id  uuid NOT NULL,
      school_id   uuid NOT NULL,
      guardian_id uuid,
      topic       text NOT NULL,
      message     text NOT NULL,
      channels    text[] NOT NULL DEFAULT '{}',
      created_at  timestamptz NOT NULL DEFAULT now()
    );
    GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
    GRANT SELECT, INSERT ON public.parent_comms TO anon, authenticated, service_role;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='parent_comms'
  ) THEN
    ALTER TABLE public.parent_comms ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS parent_comms_insert_by_class_teacher ON public.parent_comms;
    CREATE POLICY parent_comms_insert_by_class_teacher
    ON public.parent_comms
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.students s
        JOIN public.class_teachers ct ON ct.class_id = s.class_id AND ct.active
        JOIN public.profiles p ON p.id = ct.profile_id
        WHERE s.id = parent_comms.student_id
          AND p.email = (current_setting('request.jwt.claims', true)::json->>'email')
      )
    );
  END IF;
END$$;
