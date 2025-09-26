-- Ensure UUID generator
create extension if not exists pgcrypto;

-- ROOMS
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null check (char_length(name) > 0),
  meeting_url text,
  created_by uuid references auth.users(id),
  inserted_at timestamptz not null default now()
);
alter table public.rooms enable row level security;

-- ROOM MEMBERS
create table if not exists public.room_members (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  inserted_at timestamptz not null default now(),
  primary key (room_id, user_id)
);
alter table public.room_members enable row level security;

-- MESSAGES
create table if not exists public.messages (
  id bigserial primary key,
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  inserted_at timestamptz not null default now()
);
alter table public.messages enable row level security;

-- Helpful indexes
create index if not exists idx_messages_room_time on public.messages(room_id, inserted_at desc);
create index if not exists idx_room_members_user on public.room_members(user_id);

-- Helper: are we using service_role token?
create or replace function public.is_service_role()
returns boolean language sql stable as $$
  select coalesce(
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role',
    false
  )
$$;

-- A user can see a room if they are a member, or if service_role
create policy rooms_select_if_member on public.rooms
for select
using (
  public.is_service_role()
  or exists (
    select 1 from public.room_members rm
    where rm.room_id = rooms.id and rm.user_id = auth.uid()
  )
);

-- A user can create a room; created_by defaults to auth.uid() via API/app layer
create policy rooms_insert_by_auth on public.rooms
for insert
to authenticated
with check (created_by = auth.uid());

-- Members table: users can see their memberships; service_role sees all
create policy room_members_select on public.room_members
for select
using (public.is_service_role() or user_id = auth.uid());

-- Members can insert themselves to a room they are already member/owner of,
-- but typically this is managed by server-side logic or triggers.
create policy room_members_insert_self on public.room_members
for insert
to authenticated
with check (user_id = auth.uid());

-- Messages: read if member of the room
create policy messages_select_if_member on public.messages
for select
using (
  public.is_service_role()
  or exists (
    select 1 from public.room_members rm
    where rm.room_id = messages.room_id and rm.user_id = auth.uid()
  )
);

-- Messages: write if member and posting as themselves
create policy messages_insert_if_member on public.messages
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.room_members rm
    where rm.room_id = messages.room_id and rm.user_id = auth.uid()
  )
);

-- Auto-add creator as owner after inserting a room
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
