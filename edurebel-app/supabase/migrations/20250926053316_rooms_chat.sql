-- extensions
create extension if not exists "pgcrypto";

-- tables
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  meeting_url text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.room_members (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','member')),
  inserted_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (length(content) <= 4000),
  inserted_at timestamptz not null default now()
);

-- RLS
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.messages enable row level security;

-- rooms: members can see
create policy if not exists rooms_select_for_members
on public.rooms for select
to authenticated
using (exists (select 1 from public.room_members rm where rm.room_id = rooms.id and rm.user_id = auth.uid()));

-- room_members: you can see memberships for rooms you’re in
create policy if not exists room_members_select_for_members
on public.room_members for select
to authenticated
using (exists (select 1 from public.room_members rm where rm.room_id = room_members.room_id and rm.user_id = auth.uid()));

-- messages: members can read; only members can insert as themselves
create policy if not exists messages_select_for_members
on public.messages for select
to authenticated
using (exists (select 1 from public.room_members rm where rm.room_id = messages.room_id and rm.user_id = auth.uid()));

create policy if not exists messages_insert_by_member
on public.messages for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (select 1 from public.room_members rm where rm.room_id = messages.room_id and rm.user_id = auth.uid())
);

-- auto-add creator as owner on room insert
create or replace function public.room_after_insert_add_owner()
returns trigger language plpgsql security definer as $$
begin
  if new.created_by is not null then
    insert into public.room_members(room_id, user_id, role)
    values (new.id, new.created_by, 'owner')
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_room_after_insert on public.rooms;
create trigger trg_room_after_insert
after insert on public.rooms
for each row execute function public.room_after_insert_add_owner();
