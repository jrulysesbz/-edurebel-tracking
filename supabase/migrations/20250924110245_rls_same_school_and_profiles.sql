-- Ensure pgcrypto (for gen_random_uuid)
create extension if not exists pgcrypto;

-- base tables expected to exist: schools, students, classes
create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_code text,
  created_at timestamptz default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete set null,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete set null,
  full_name text not null,
  created_at timestamptz default now()
);

-- profiles: link auth.users -> school and role
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text check (role in ('teacher','admin')) not null default 'teacher',
  school_id uuid references public.schools(id) on delete set null,
  created_at timestamptz default now()
);

-- enable RLS
alter table public.schools  enable row level security;
alter table public.students enable row level security;
alter table public.classes  enable row level security;
alter table public.profiles enable row level security;

-- helper: current user's school_id
create or replace view public.v_current_school as
select
  p.id as user_id,
  p.school_id
from public.profiles p
where p.id = auth.uid();

-- ---------- READ policies (authenticated teachers only; same school) ----------
-- Schools
drop policy if exists "schools: read (same school)" on public.schools;
create policy "schools: read (same school)"
  on public.schools for select
  to authenticated
  using ( id = coalesce((select school_id from public.v_current_school), '00000000-0000-0000-0000-000000000000'::uuid) );

-- Students
drop policy if exists "students: read (same school)" on public.students;
create policy "students: read (same school)"
  on public.students for select
  to authenticated
  using ( school_id = (select school_id from public.v_current_school) );

-- Classes
drop policy if exists "classes: read (same school)" on public.classes;
create policy "classes: read (same school)"
  on public.classes for select
  to authenticated
  using ( school_id = (select school_id from public.v_current_school) );

-- ---------- Minimal WRITE example (teachers can insert students into their school) ----------
drop policy if exists "students: insert (same school)" on public.students;
create policy "students: insert (same school)"
  on public.students for insert
  to authenticated
  with check ( school_id = (select school_id from public.v_current_school) );

-- ---------- Profiles self access ----------
drop policy if exists "profiles: select self" on public.profiles;
create policy "profiles: select self"
  on public.profiles for select
  to authenticated
  using ( id = auth.uid() );

drop policy if exists "profiles: update self" on public.profiles;
create policy "profiles: update self"
  on public.profiles for update
  to authenticated
  using ( id = auth.uid() )
  with check ( id = auth.uid() );

-- optional seed (idempotent)
insert into public.schools(name, short_code)
values ('Demo School','DEMO')
on conflict do nothing;

-- pick a demo class/student only if empty
insert into public.classes(school_id, name)
select s.id, 'Class A' from public.schools s
where not exists (select 1 from public.classes) limit 1;

insert into public.students(school_id, full_name)
select s.id, 'Alice Example' from public.schools s
where not exists (select 1 from public.students) limit 1;

-- refresh PostgREST schema cache
notify pgrst, 'reload schema';
