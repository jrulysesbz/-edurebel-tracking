-- Enable RLS (idempotent)
alter table public.schools  enable row level security;
alter table public.students enable row level security;
alter table public.classes  enable row level security;
alter table public.profiles enable row level security;

-- Clean up any legacy policies that referenced class_teachers / class_id
drop policy if exists students_select_if_teacher on public.students;
drop policy if exists classes_select_if_teacher  on public.classes;

-- Profiles: user may read/update only their own profile
drop policy if exists "profiles: select self" on public.profiles;
create policy "profiles: select self"
  on public.profiles for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "profiles: update self" on public.profiles;
create policy "profiles: update self"
  on public.profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Schools: only the requester’s school (via profiles.school_id)
drop policy if exists "schools: read own" on public.schools;
create policy "schools: read own"
  on public.schools for select to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.school_id = schools.id
  ));

-- Students: only students in requester’s school
drop policy if exists "students: read own school" on public.students;
create policy "students: read own school"
  on public.students for select to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.school_id = students.school_id
  ));

-- Classes: only classes in requester’s school
drop policy if exists "classes: read own school" on public.classes;
create policy "classes: read own school"
  on public.classes for select to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.school_id = classes.school_id
  ));

-- Optional: allow inserts of students into your own school
drop policy if exists "students: insert own school" on public.students;
create policy "students: insert own school"
  on public.students for insert to authenticated
  with check (exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.school_id = students.school_id
  ));

-- Refresh PostgREST
notify pgrst, 'reload schema';
