-- Profiles: one row per auth user to map role + school
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,        -- auth.users.id
  email text not null unique,
  role text not null default 'teacher', -- 'teacher' | 'admin' ...
  school_id uuid not null
    references public.schools(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- keep each user to their own profile row
drop policy if exists "profiles: select self" on public.profiles;
create policy "profiles: select self"
  on public.profiles for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "profiles: update self" on public.profiles;
create policy "profiles: update self"
  on public.profiles for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Schools: only see your own school (via profiles)
alter table public.schools enable row level security;
drop policy if exists "schools: read own" on public.schools;
create policy "schools: read own"
  on public.schools for select
  to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.school_id = schools.id
  ));

-- Students: only see students in your school
alter table public.students enable row level security;
drop policy if exists "students: read own school" on public.students;
create policy "students: read own school"
  on public.students for select
  to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.school_id = students.school_id
  ));

-- Classes: only see classes in your school
alter table public.classes enable row level security;
drop policy if exists "classes: read own school" on public.classes;
create policy "classes: read own school"
  on public.classes for select
  to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.school_id = classes.school_id
  ));

-- Optional: allow teachers to insert students into their own school
drop policy if exists "students: insert own school" on public.students;
create policy "students: insert own school"
  on public.students for insert
  to authenticated
  with check (exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.school_id = students.school_id
  ));

-- Refresh PostgREST cache
notify pgrst, 'reload schema';
