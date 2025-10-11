-- Chat & Messages realtime setup

-- 1. Ensure extensions
create extension if not exists "pgcrypto";
create extension if not exists "pg_net";

-- 2. Tables
create table if not exists public."Chats" (
  chat_id uuid not null default gen_random_uuid(),
  members uuid[] not null default '{}'::uuid[],
  is_direct_message boolean not null default true,
  created_at timestamptz not null default now(),
  constraint Chats_pkey primary key (chat_id)
);

create table if not exists public."Messages" (
  message_id uuid not null default gen_random_uuid(),
  chat_id uuid not null references public."Chats"(chat_id) on delete cascade,
  sender_id uuid not null,
  content text not null,
  time_sent timestamptz not null default now(),
  read_by uuid[] not null default '{}'::uuid[],
  constraint Messages_pkey primary key (message_id, chat_id)
);

-- 3. Enable RLS
alter table public."Chats" enable row level security;
alter table public."Messages" enable row level security;

-- 4. Chats policies
create policy "Chats select"
  on public."Chats"
  for select
  using (auth.uid() = any (members));

create policy "Chats insert"
  on public."Chats"
  for insert
  with check (auth.uid() = any (members));

create policy "Chats update"
  on public."Chats"
  for update
  using (auth.uid() = any (members))
  with check (auth.uid() = any (members));

-- 5. Messages policies
create policy "Messages select"
  on public."Messages"
  for select
  using (
    exists (
      select 1
      from public."Chats" c
      where c.chat_id = "Messages".chat_id
        and auth.uid() = any (c.members)
    )
  );

create policy "Messages insert"
  on public."Messages"
  for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from public."Chats" c
      where c.chat_id = "Messages".chat_id
        and auth.uid() = any (c.members)
    )
  );

create policy "Messages update"
  on public."Messages"
  for update
  using (
    exists (
      select 1
      from public."Chats" c
      where c.chat_id = "Messages".chat_id
        and auth.uid() = any (c.members)
    )
  )
  with check (
    exists (
      select 1
      from public."Chats" c
      where c.chat_id = "Messages".chat_id
        and auth.uid() = any (c.members)
    )
  );

create policy "Messages delete"
  on public."Messages"
  for delete
  using (sender_id = auth.uid());

-- 6. Broadcast triggers
create or replace function public.broadcast_message_changes()
returns trigger
language plpgsql
security definer
as $$
declare
  payload jsonb;
begin
  payload := row_to_json(NEW)::jsonb;
  perform realtime.broadcast(
    channel => format('chat:%s:messages', NEW.chat_id),
    event   => 'message',
    payload => json_build_object('message', payload)
  );
  return NEW;
end;
$$;

create or replace function public.broadcast_chat_changes()
returns trigger
language plpgsql
security definer
as $$
declare
  payload jsonb;
begin
  payload := row_to_json(NEW)::jsonb;
  perform realtime.broadcast(
    channel => 'chats:meta',
    event   => 'chat_created',
    payload => json_build_object('chat', payload)
  );
  return NEW;
end;
$$;

drop trigger if exists on_messages_broadcast on public."Messages";
create trigger on_messages_broadcast
after insert on public."Messages"
for each row execute function public.broadcast_message_changes();

drop trigger if exists on_chats_broadcast on public."Chats";
create trigger on_chats_broadcast
after insert on public."Chats"
for each row execute function public.broadcast_chat_changes();

-- 7. RPC for sending messages
create or replace function public.send_chat_message(
  p_chat_id uuid,
  p_content text,
  p_sender_id uuid default auth.uid()
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public."Messages"(chat_id, sender_id, content, read_by)
  values (
    p_chat_id,
    coalesce(p_sender_id, auth.uid()),
    p_content,
    array[coalesce(p_sender_id, auth.uid())]
  );
end;
$$;

-- 8. Realtime authorization policies
alter table if exists realtime.messages enable row level security;

drop policy if exists "Messages topic access" on realtime.messages;
create policy "Messages topic access"
  on realtime.messages
  for select using (
    exists (
      select 1
      from public."Chats" c
      where c.chat_id::text = split_part(realtime.topic(), ':', 2)
        and auth.uid() = any (c.members)
    )
  );

drop policy if exists "Messages topic broadcast" on realtime.messages;
create policy "Messages topic broadcast"
  on realtime.messages
  for insert using (
    exists (
      select 1
      from public."Chats" c
      where c.chat_id::text = split_part(realtime.topic(), ':', 2)
        and auth.uid() = any (c.members)
    )
  );

-- 9. Publication
alter publication supabase_realtime add table public."Chats";
alter publication supabase_realtime add table public."Messages";

-- ============================
-- Down migration
-- ============================
drop trigger if exists on_messages_broadcast on public."Messages";
drop trigger if exists on_chats_broadcast on public."Chats";
drop function if exists public.broadcast_message_changes();
drop function if exists public.broadcast_chat_changes();
drop function if exists public.send_chat_message(uuid, text, uuid);

drop policy if exists "Messages topic access" on realtime.messages;
drop policy if exists "Messages topic broadcast" on realtime.messages;
alter table if exists realtime.messages disable row level security;

drop policy if exists "Messages select" on public."Messages";
drop policy if exists "Messages insert" on public."Messages";
drop policy if exists "Messages update" on public."Messages";
drop policy if exists "Messages delete" on public."Messages";
drop policy if exists "Chats select" on public."Chats";
drop policy if exists "Chats insert" on public."Chats";
drop policy if exists "Chats update" on public."Chats";

alter publication supabase_realtime drop table if exists public."Messages";
alter publication supabase_realtime drop table if exists public."Chats";

alter table public."Messages" disable row level security;
alter table public."Chats" disable row level security;
