-- Enable RLS
alter table public.students enable row level security;
alter table public.parent_comms enable row level security;

-- Students: allow teachers to see only their students
drop policy if exists students_select_if_teacher on public.students;
create policy students_select_if_teacher
on public.students
for select
to authenticated
using (
  exists (
    select 1
    from public.class_teachers ct
    join public.profiles p on p.id = ct.profile_id
    where ct.class_id = students.class_id
      and ct.active
      and p.email = (current_setting('request.jwt.claims', true)::json->>'email')
  )
);

-- Parent comms: allow insert only if teacher of the student's class
drop policy if exists parent_comms_insert_by_class_teacher on public.parent_comms;
create policy parent_comms_insert_by_class_teacher
on public.parent_comms
for insert
to authenticated
with check (
  exists (
    select 1
    from public.students s
    join public.class_teachers ct on ct.class_id = s.class_id and ct.active
    join public.profiles p on p.id = ct.profile_id
    where s.id = parent_comms.student_id
      and p.email = (current_setting('request.jwt.claims', true)::json->>'email')
  )
);
