create extension if not exists "pgcrypto";

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  full_name text,
  email text unique,
  role text default 'teacher',
  created_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  code text not null,
  name text not null,
  term text,
  grade int,
  created_at timestamptz not null default now(),
  unique (school_id, code)
);

create table if not exists public.class_teachers (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text default 'lead',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (class_id, profile_id)
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  student_code text not null,
  first_name text not null,
  last_name text not null,
  created_at timestamptz not null default now(),
  unique (school_id, student_code)
);

create table if not exists public.parent_comms (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  guardian_id uuid,
  topic text not null,
  message text not null,
  channels text[] not null default '{}',
  created_at timestamptz not null default now()
);

drop view if exists public.v_student_risk;
create view public.v_student_risk as
select
  s.id as student_id,
  s.class_id,
  s.school_id,
  s.first_name,
  s.last_name,
  0::int as recent_incidents
from public.students s;

grant usage on schema public to anon, authenticated, service_role;
grant select on all tables in schema public to anon, authenticated, service_role;
grant insert, update, delete on all tables in schema public to authenticated, service_role;
alter default privileges in schema public grant select on tables to anon, authenticated, service_role;
alter default privileges in schema public grant insert, update, delete on tables to authenticated, service_role;

insert into public.schools(name) values ('Demo School') on conflict do nothing;

with s as (
  select id from public.schools where name='Demo School' limit 1
),
p as (
  insert into public.profiles(full_name,email,role)
  values ('Teacher One','teacher@example.com','teacher')
  on conflict (email) do update set full_name=excluded.full_name
  returning id
),
c as (
  insert into public.classes(school_id,code,name,term,grade)
  select s.id,'G10-ENG-2025-1','Grade 10 English','2025-1',10 from s
  on conflict (school_id,code) do update set name=excluded.name
  returning id,school_id
)
insert into public.class_teachers(class_id,profile_id,role,active)
select c.id,(select id from p),'lead',true from c
on conflict (class_id,profile_id) do nothing;

insert into public.students(school_id,class_id,student_code,first_name,last_name)
select c.school_id,c.id,'S001','Ada','Lovelace'
from (select id,school_id from public.classes where code='G10-ENG-2025-1' limit 1) c
on conflict (school_id,student_code) do nothing;
