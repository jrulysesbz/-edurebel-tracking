-- 1) Extensions
create extension if not exists pgcrypto;

-- 2) Tables
create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_code text,
  created_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete set null,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete set null,
  full_name text not null,
  created_at timestamptz not null default now()
);

-- profiles: one row per user; role + school binding
create table if not exists public.profiles (
  id uuid primary key,                -- auth.uid()
  role text check (role in ('teacher','admin','parent')) default 'teacher',
  school_id uuid references public.schools(id) on delete set null,
  full_name text,
  created_at timestamptz not null default now()
);

-- 3) Enable RLS
alter table public.schools  enable row level security;
alter table public.classes  enable row level security;
alter table public.students enable row level security;
alter table public.profiles enable row level security;

-- 4) RLS policies
-- Helper predicate: “I am a teacher in this school”
-- We inline this logic in each USING/WITH CHECK via EXISTS over profiles.

-- PROFILES: user can read/update only their own row
drop policy if exists "profiles: select self" on public.profiles;
create policy "profiles: select self"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "profiles: update self" on public.profiles;
create policy "profiles: update self"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- SCHOOLS: teacher can read a school only if bound to it via profiles
drop policy if exists "schools: read my school (teacher)" on public.schools;
create policy "schools: read my school (teacher)"
  on public.schools for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'teacher'
        and p.school_id = schools.id
    )
  );

-- CLASSES: teacher can read classes only from their school
drop policy if exists "classes: read my school (teacher)" on public.classes;
create policy "classes: read my school (teacher)"
  on public.classes for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'teacher'
        and p.school_id = classes.school_id
    )
  );

-- STUDENTS: teacher can read students only from their school
drop policy if exists "students: read my school (teacher)" on public.students;
create policy "students: read my school (teacher)"
  on public.students for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'teacher'
        and p.school_id = students.school_id
    )
  );

-- (Optional) allow teachers to insert/update rows for their school
-- Uncomment if needed:
-- create policy "students: insert my school (teacher)"
--   on public.students for insert to authenticated
--   with check (
--     exists (
--       select 1 from public.profiles p
--       where p.id = auth.uid() and p.role='teacher' and p.school_id = students.school_id
--     )
--   );
-- create policy "students: update my school (teacher)"
--   on public.students for update to authenticated
--   using (
--     exists (
--       select 1 from public.profiles p
--       where p.id = auth.uid() and p.role='teacher' and p.school_id = students.school_id
--     )
--   )
--   with check (
--     exists (
--       select 1 from public.profiles p
--       where p.id = auth.uid() and p.role='teacher' and p.school_id = students.school_id
--     )
--   );

-- SERVICE ROLE bypass (trusted server): allow everything via service_role
-- (policy targets role "service_role"; Supabase applies this for the service key)
drop policy if exists "service: full access schools"  on public.schools;
drop policy if exists "service: full access classes"  on public.classes;
drop policy if exists "service: full access students" on public.students;
drop policy if exists "service: full access profiles" on public.profiles;

create policy "service: full access schools"  on public.schools  to service_role using (true) with check (true);
create policy "service: full access classes"  on public.classes  to service_role using (true) with check (true);
create policy "service: full access students" on public.students to service_role using (true) with check (true);
create policy "service: full access profiles" on public.profiles to service_role using (true) with check (true);

-- 5) Optional seed (idempotent)
insert into public.schools(name, short_code)
select 'Demo School','DEMO'
where not exists (select 1 from public.schools where short_code='DEMO');

-- 6) Refresh PostgREST schema cache
notify pgrst, 'reload schema';
