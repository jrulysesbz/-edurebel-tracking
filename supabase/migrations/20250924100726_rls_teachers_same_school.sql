create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('teacher','admin','guardian')),
  school_id uuid not null references public.schools(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_profiles_school_role on public.profiles (school_id, role);
create index if not exists idx_profiles_id_school on public.profiles (id, school_id);

alter table public.schools  enable row level security;
alter table public.students enable row level security;
alter table public.classes  enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "allow read schools"              on public.schools;
drop policy if exists "allow read students"             on public.students;
drop policy if exists "allow read classes"              on public.classes;
drop policy if exists "read schools (auth only)"        on public.schools;
drop policy if exists "read students (auth only)"       on public.students;
drop policy if exists "read classes (auth only)"        on public.classes;
drop policy if exists "insert students (auth only)"     on public.students;

create policy "schools: select by same-school teacher"
  on public.schools for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'teacher' and p.school_id = schools.id
    )
  );

create policy "students: select by same-school teacher"
  on public.students for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'teacher' and p.school_id = students.school_id
    )
  );

create policy "students: insert by same-school teacher"
  on public.students for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'teacher' and p.school_id = students.school_id
    )
  );

create policy "students: update by same-school teacher"
  on public.students for update to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'teacher' and p.school_id = students.school_id
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'teacher' and p.school_id = students.school_id
    )
  );

create policy "students: delete by same-school teacher"
  on public.students for delete to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'teacher' and p.school_id = students.school_id
    )
  );

create policy "classes: select by same-school teacher"
  on public.classes for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'teacher' and p.school_id = classes.school_id
    )
  );

create policy "classes: insert by same-school teacher"
  on public.classes for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'teacher' and p.school_id = classes.school_id
    )
  );

create policy "classes: update by same-school teacher"
  on public.classes for update to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'teacher' and p.school_id = classes.school_id
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'teacher' and p.school_id = classes.school_id
    )
  );

create policy "classes: delete by same-school teacher"
  on public.classes for delete to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'teacher' and p.school_id = classes.school_id
    )
  );

drop policy if exists "profiles: select self" on public.profiles;
create policy "profiles: select self"
  on public.profiles for select to authenticated
  using (id = auth.uid());

drop policy if exists "profiles: update self" on public.profiles;
create policy "profiles: update self"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

notify pgrst, 'reload schema';
