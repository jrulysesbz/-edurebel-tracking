-- Create core tables if missing, build a minimal risk view, then add RLS safely.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Core tables
CREATE TABLE IF NOT EXISTS public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  full_name text,
  email text UNIQUE,
  role text DEFAULT 'teacher',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  term text,
  grade int,
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, code)
);

CREATE TABLE IF NOT EXISTS public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_code text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, student_code)
);

CREATE TABLE IF NOT EXISTS public.class_teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'lead',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, profile_id)
);

-- Keep parent_comms here so RLS can reference existing core tables
CREATE TABLE IF NOT EXISTS public.parent_comms (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  school_id   uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  guardian_id uuid,
  topic       text NOT NULL,
  message     text NOT NULL,
  channels    text[] NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 2) Minimal risk view (so risk-scan works)
DROP VIEW IF EXISTS public.v_student_risk;
CREATE VIEW public.v_student_risk AS
SELECT
  s.id         AS student_id,
  s.class_id   AS class_id,
  s.school_id  AS school_id,
  s.first_name,
  s.last_name,
  0::int       AS recent_incidents
FROM public.students s;

-- 3) Grants (local dev)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON public.v_student_risk TO anon, authenticated, service_role;
GRANT SELECT, INSERT ON public.parent_comms TO anon, authenticated, service_role;

-- 4) RLS policy only if all referenced tables exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='parent_comms')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='students')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='class_teachers')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles')
  THEN
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

-- 5) Seed a tiny demo so tests have IDs
WITH s AS (
  INSERT INTO public.schools(name) VALUES ('Demo School')
  ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name
  RETURNING id
), p AS (
  INSERT INTO public.profiles(full_name,email,role)
  VALUES ('Teacher One','teacher@example.com','teacher')
  ON CONFLICT (email) DO UPDATE SET full_name=EXCLUDED.full_name
  RETURNING id
), c AS (
  INSERT INTO public.classes(school_id,code,name,term,grade,start_date,end_date)
  SELECT s.id,'G10-ENG-2025-1','Grade 10 English','2025-1',10, current_date, current_date + 120
  FROM s
  ON CONFLICT (school_id,code) DO UPDATE SET name=EXCLUDED.name
  RETURNING id, school_id
)
INSERT INTO public.class_teachers(class_id,profile_id,role,active)
SELECT c.id,(SELECT id FROM p),'lead',true FROM c
ON CONFLICT (class_id,profile_id) DO NOTHING;

INSERT INTO public.students(school_id,class_id,student_code,first_name,last_name)
SELECT c.school_id,c.id,'S001','Ada','Lovelace' FROM public.classes c
WHERE c.code='G10-ENG-2025-1'
ON CONFLICT (school_id,student_code) DO NOTHING;
