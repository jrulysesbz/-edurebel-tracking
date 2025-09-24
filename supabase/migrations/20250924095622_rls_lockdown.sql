-- Lock reads to authenticated only, and add a minimal write policy example
-- Schools
drop policy if exists "allow read schools" on public.schools;
create policy "read schools (auth only)"
  on public.schools for select
  to authenticated
  using (true);

-- Students
drop policy if exists "allow read students" on public.students;
create policy "read students (auth only)"
  on public.students for select
  to authenticated
  using (true);

-- Classes
drop policy if exists "allow read classes" on public.classes;
create policy "read classes (auth only)"
  on public.classes for select
  to authenticated
  using (true);

-- Minimal write example (students): allow inserts by authenticated users
-- Enable RLS in case it wasn't already
alter table public.students enable row level security;

drop policy if exists "insert students (auth only)" on public.students;
create policy "insert students (auth only)"
  on public.students for insert
  to authenticated
  with check (true);

-- Refresh PostgREST schema cache
notify pgrst, 'reload schema';
