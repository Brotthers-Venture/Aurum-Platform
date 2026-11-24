-- Communication: Aurum's secure messaging with clients.
--
--   space    one per solution + the firm-wide "aurum" space; each has an owner
--   client   a client company (a GP, a family, an issuer…) present in one or more spaces
--   channel  belongs to a space; client_id null = Aurum internal, else shared with that client
--   direct   one-to-one / small-group conversations
--
-- Security model
--   * Message bodies are encrypted by the application (AES-256-GCM) before they reach the database.
--     Each workspace (space × client, or space-internal) has its own data key, stored in Supabase Vault;
--     comm_keys holds only the Vault reference. Keys rotate by adding a new row; old rows stay for reading.
--   * Nothing is deleted. Edits keep the previous ciphertext. Every read-relevant action is audited.
--   * A client sees only its own channels; it never learns other clients or spaces exist.
--   * Access changes requested by a client are approved by the space owner (or the Aurum admin),
--     never by the person who asked.

-- ───────────────────────── directory ─────────────────────────
create table comm_spaces (
  id         text primary key,
  name       text not null,
  owner_id   uuid not null references auth.users(id),
  firm_wide  boolean not null default false
);

create table comm_clients (
  id     text primary key,
  name   text not null,
  gp_id  text
);

create table comm_client_spaces (
  client_id text references comm_clients(id),
  space_id  text references comm_spaces(id),
  primary key (client_id, space_id)
);

create table comm_people (
  user_id        uuid primary key references auth.users(id),
  display_name   text not null,
  title          text,
  org            text not null,                              -- 'aurum' or a comm_clients.id
  is_admin       boolean not null default false,             -- Aurum platform admin: sees every space
  client_role    text check (client_role in ('admin','member','guest')),
  guest_expires  date,
  check ((org = 'aurum') = (client_role is null)),
  check ((client_role = 'guest') = (guest_expires is not null)),
  check (not is_admin or org = 'aurum')
);

create table comm_space_staff (
  space_id text references comm_spaces(id),
  user_id  uuid references comm_people(user_id),
  primary key (space_id, user_id)
);

-- ───────────────────────── keys ─────────────────────────
create table comm_keys (
  id               uuid primary key default gen_random_uuid(),
  space_id         text not null references comm_spaces(id),
  client_id        text references comm_clients(id),       -- null = the space's internal workspace / DMs use 'aurum' space
  vault_secret_id  uuid not null unique,                   -- vault.secrets.id holding the 256-bit data key
  created_at       timestamptz not null default now(),
  retired_at       timestamptz
);
create unique index comm_keys_active on comm_keys (space_id, coalesce(client_id, '')) where retired_at is null;

-- ───────────────────────── conversations ─────────────────────────
create table comm_channels (
  id          uuid primary key default gen_random_uuid(),
  space_id    text not null references comm_spaces(id),
  client_id   text references comm_clients(id),
  name        text not null check (name ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  topic       text,
  is_private  boolean not null default false,
  announce    boolean not null default false,
  created_by  uuid not null references auth.users(id),
  created_at  timestamptz not null default now(),
  archived_at timestamptz,
  unique (space_id, client_id, name)
);

create table comm_channel_members (               -- private-channel members and guests
  channel_id uuid references comm_channels(id),
  user_id    uuid references comm_people(user_id),
  added_by   uuid not null references auth.users(id),
  added_at   timestamptz not null default now(),
  primary key (channel_id, user_id)
);

create table comm_directs (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);
create table comm_direct_members (
  direct_id uuid references comm_directs(id),
  user_id   uuid references comm_people(user_id),
  primary key (direct_id, user_id)
);

create table comm_messages (
  id          uuid primary key default gen_random_uuid(),
  channel_id  uuid references comm_channels(id),
  direct_id   uuid references comm_directs(id),
  parent_id   uuid references comm_messages(id),
  author_id   uuid not null references auth.users(id),
  key_id      uuid not null references comm_keys(id),
  nonce       bytea not null check (length(nonce) = 12),
  ciphertext  bytea not null,                       -- body ‖ 16-byte GCM tag
  meet        jsonb,                                -- {code, title, when} for Google Meet cards
  pinned      boolean not null default false,
  created_at  timestamptz not null default now(),
  edited_at   timestamptz,
  check ((channel_id is null) <> (direct_id is null))
);
create index comm_messages_channel on comm_messages (channel_id, created_at);
create index comm_messages_direct on comm_messages (direct_id, created_at);
create index comm_messages_parent on comm_messages (parent_id);

create table comm_message_edits (                    -- prior versions, kept forever
  id          bigint generated always as identity primary key,
  message_id  uuid not null references comm_messages(id),
  key_id      uuid not null references comm_keys(id),
  nonce       bytea not null,
  ciphertext  bytea not null,
  replaced_at timestamptz not null default now()
);

create table comm_attachments (
  id            uuid primary key default gen_random_uuid(),
  message_id    uuid not null references comm_messages(id),
  folder        text,                                -- top folder name when uploaded as a folder
  rel_path      text not null,                       -- path inside the folder (or the file name)
  storage_path  text not null unique,                -- comm-files/{space}/{client|internal}/{message}/{rel_path}; encrypted object
  sha256        char(64) not null check (sha256 ~ '^[0-9a-f]{64}$'),
  size_bytes    bigint not null check (size_bytes > 0),
  mime_type     text not null,
  filed_document_id uuid references fund_documents(id),  -- when filed to a fund's corporate documents
  created_at    timestamptz not null default now()
);

create table comm_reactions (
  message_id uuid references comm_messages(id),
  user_id    uuid references comm_people(user_id),
  emoji      text not null check (char_length(emoji) <= 8),
  primary key (message_id, user_id, emoji)
);

create table comm_reads (
  user_id     uuid references comm_people(user_id),
  channel_id  uuid references comm_channels(id),
  direct_id   uuid references comm_directs(id),
  read_at     timestamptz not null,
  check ((channel_id is null) <> (direct_id is null))
);
create unique index comm_reads_channel on comm_reads (user_id, channel_id) where channel_id is not null;
create unique index comm_reads_direct on comm_reads (user_id, direct_id) where direct_id is not null;

create table comm_requests (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in ('channel','guest','colleague')),
  space_id      text not null references comm_spaces(id),
  client_id     text not null references comm_clients(id),
  requested_by  uuid not null references comm_people(user_id),
  subject       text not null,
  detail        text,
  status        text not null default 'pending' check (status in ('pending','approved','declined')),
  decided_by    uuid references comm_people(user_id),
  decided_at    timestamptz,
  created_at    timestamptz not null default now(),
  check ((status = 'pending') = (decided_by is null))
);

-- ───────────────────────── access functions ─────────────────────────
create or replace function comm_me() returns comm_people language sql stable security definer set search_path = public as $$
  select * from comm_people where user_id = auth.uid()
    and (client_role is distinct from 'guest' or guest_expires >= current_date)
$$;

create or replace function comm_is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from comm_me()), false)
$$;

create or replace function comm_space_role(p_space text) returns text language sql stable security definer set search_path = public as $$
  select case
    when comm_is_admin() then 'admin'
    when exists (select 1 from comm_spaces s where s.id = p_space and s.owner_id = auth.uid()) then 'owner'
    when exists (select 1 from comm_space_staff st where st.space_id = p_space and st.user_id = auth.uid()) then 'member'
  end
$$;

create or replace function comm_can_see_channel(p_channel uuid) returns boolean language plpgsql stable security definer set search_path = public as $$
declare ch comm_channels; me comm_people;
begin
  select * into ch from comm_channels where id = p_channel;
  me := comm_me();
  if ch.id is null or me.user_id is null then return false; end if;
  if me.org = 'aurum' then
    if comm_is_admin() then return true; end if;
    if comm_space_role(ch.space_id) is null then return false; end if;
    return not ch.is_private or exists (select 1 from comm_channel_members m where m.channel_id = ch.id and m.user_id = me.user_id);
  end if;
  if ch.client_id is distinct from me.org then return false; end if;
  if me.client_role = 'guest' or ch.is_private then
    return exists (select 1 from comm_channel_members m where m.channel_id = ch.id and m.user_id = me.user_id);
  end if;
  return true;
end $$;

create or replace function comm_in_direct(p_direct uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from comm_direct_members where direct_id = p_direct and user_id = (select user_id from comm_me()))
$$;

create or replace function comm_can_see_message(p_message uuid) returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select case when m.channel_id is not null then comm_can_see_channel(m.channel_id) else comm_in_direct(m.direct_id) end
                   from comm_messages m where m.id = p_message), false)
$$;

-- ───────────────────────── integrity triggers ─────────────────────────
-- Messages: no deletes; body changes keep the old version; author, place and time never change.
create or replace function comm_guard_message() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then raise exception 'messages cannot be deleted'; end if;
  if (new.id, new.channel_id, new.direct_id, new.parent_id, new.author_id, new.created_at)
     is distinct from (old.id, old.channel_id, old.direct_id, old.parent_id, old.author_id, old.created_at) then
    raise exception 'only the text and pin of a message may change';
  end if;
  if new.ciphertext is distinct from old.ciphertext then
    if auth.uid() is distinct from old.author_id then raise exception 'only the author can edit a message'; end if;
    insert into comm_message_edits (message_id, key_id, nonce, ciphertext) values (old.id, old.key_id, old.nonce, old.ciphertext);
    new.edited_at := now();
  end if;
  return new;
end $$;
create trigger comm_messages_guard before update or delete on comm_messages for each row execute function comm_guard_message();

-- The key used must belong to the message's workspace.
create or replace function comm_check_message_key() returns trigger language plpgsql security definer set search_path = public as $$
declare k comm_keys; ch comm_channels;
begin
  select * into k from comm_keys where id = new.key_id;
  if k.retired_at is not null then raise exception 'key % is retired', k.id; end if;
  if new.channel_id is not null then
    select * into ch from comm_channels where id = new.channel_id;
    if ch.archived_at is not null then raise exception 'channel is archived'; end if;
    if k.space_id <> ch.space_id or k.client_id is distinct from ch.client_id then raise exception 'wrong workspace key'; end if;
  elsif k.space_id <> 'aurum' or k.client_id is not null then
    raise exception 'direct messages use the firm key';
  end if;
  if new.parent_id is not null and exists (select 1 from comm_messages p where p.id = new.parent_id and p.parent_id is not null) then
    raise exception 'threads are one level deep';
  end if;
  return new;
end $$;
create trigger comm_messages_key before insert or update of key_id on comm_messages for each row execute function comm_check_message_key();

create or replace function comm_forbid_change() returns trigger language plpgsql as $$
begin raise exception '% rows are permanent', tg_table_name; end $$;
create trigger comm_edits_immutable before update or delete on comm_message_edits for each row execute function comm_forbid_change();
create trigger comm_attachments_no_delete before delete on comm_attachments for each row execute function comm_forbid_change();

-- Attachments: only the filing link may be set, once.
create or replace function comm_guard_attachment() returns trigger language plpgsql as $$
begin
  if (new.id, new.message_id, new.rel_path, new.storage_path, new.sha256, new.size_bytes, new.mime_type)
     is distinct from (old.id, old.message_id, old.rel_path, old.storage_path, old.sha256, old.size_bytes, old.mime_type)
     or old.filed_document_id is not null then
    raise exception 'attachments are immutable';
  end if;
  return new;
end $$;
create trigger comm_attachments_guard before update on comm_attachments for each row execute function comm_guard_attachment();

-- Requests: decided once, by the space owner or the admin, never by the requester.
create or replace function comm_decide_request() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status <> 'pending' then raise exception 'request already decided'; end if;
  if (new.kind, new.space_id, new.client_id, new.requested_by, new.subject, new.created_at)
     is distinct from (old.kind, old.space_id, old.client_id, old.requested_by, old.subject, old.created_at) then
    raise exception 'a request cannot be rewritten';
  end if;
  if new.decided_by = new.requested_by then raise exception 'requests are approved by someone else'; end if;
  if not exists (select 1 from comm_people p where p.user_id = new.decided_by and (p.is_admin
                   or exists (select 1 from comm_spaces s where s.id = new.space_id and s.owner_id = p.user_id))) then
    raise exception 'only the space owner or the Aurum admin can decide';
  end if;
  new.decided_at := now();
  return new;
end $$;
create trigger comm_requests_decide before update on comm_requests for each row execute function comm_decide_request();
create trigger comm_requests_no_delete before delete on comm_requests for each row execute function comm_forbid_change();

-- Audit: every message, attachment, access change and decision lands in the append-only audit log.
create or replace function comm_audit() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into audit_log (user_id, action, object_type, object_id, detail)
  values (auth.uid(), lower(tg_op), tg_table_name,
          coalesce(to_jsonb(new) ->> 'id', to_jsonb(new) ->> 'channel_id'),
          (to_jsonb(new) - 'ciphertext' - 'nonce'));
  return new;
end $$;
create trigger comm_audit_messages after insert or update on comm_messages for each row execute function comm_audit();
create trigger comm_audit_attachments after insert or update on comm_attachments for each row execute function comm_audit();
create trigger comm_audit_members after insert on comm_channel_members for each row execute function comm_audit();
create trigger comm_audit_channels after insert or update on comm_channels for each row execute function comm_audit();
create trigger comm_audit_requests after insert or update on comm_requests for each row execute function comm_audit();

-- ───────────────────────── row level security ─────────────────────────
alter table comm_spaces enable row level security;
alter table comm_clients enable row level security;
alter table comm_client_spaces enable row level security;
alter table comm_people enable row level security;
alter table comm_space_staff enable row level security;
alter table comm_keys enable row level security;           -- no policies: service role only
alter table comm_channels enable row level security;
alter table comm_channel_members enable row level security;
alter table comm_directs enable row level security;
alter table comm_direct_members enable row level security;
alter table comm_messages enable row level security;
alter table comm_message_edits enable row level security;
alter table comm_attachments enable row level security;
alter table comm_reactions enable row level security;
alter table comm_reads enable row level security;
alter table comm_requests enable row level security;

create policy spaces_read on comm_spaces for select using (comm_space_role(id) is not null);
create policy clients_read on comm_clients for select using ((select org from comm_me()) in ('aurum', id));
create policy client_spaces_read on comm_client_spaces for select using ((select org from comm_me()) in ('aurum', client_id));
create policy people_read on comm_people for select using (
  (select org from comm_me()) = 'aurum' or user_id = auth.uid() or org in ('aurum', (select org from comm_me())));
create policy staff_read on comm_space_staff for select using ((select org from comm_me()) = 'aurum');

create policy channels_read on comm_channels for select using (comm_can_see_channel(id));
create policy channels_create on comm_channels for insert with check (
  created_by = auth.uid() and comm_space_role(space_id) in ('admin','owner'));
create policy channel_members_read on comm_channel_members for select using (comm_can_see_channel(channel_id));
create policy channel_members_add on comm_channel_members for insert with check (
  added_by = auth.uid() and comm_space_role((select space_id from comm_channels c where c.id = channel_id)) in ('admin','owner'));

create policy directs_read on comm_directs for select using (comm_in_direct(id));
create policy direct_members_read on comm_direct_members for select using (comm_in_direct(direct_id));

create policy messages_read on comm_messages for select using (comm_can_see_message(id));
create policy messages_post on comm_messages for insert with check (
  author_id = auth.uid()
  and (case when channel_id is not null then comm_can_see_channel(channel_id)
            and (not (select announce from comm_channels c where c.id = channel_id) or comm_space_role((select space_id from comm_channels c where c.id = channel_id)) in ('admin','owner'))
       else comm_in_direct(direct_id) end));
create policy messages_edit on comm_messages for update using (author_id = auth.uid() or comm_can_see_message(id));
create policy edits_read on comm_message_edits for select using (comm_is_admin());

create policy attachments_read on comm_attachments for select using (comm_can_see_message(message_id));
create policy attachments_add on comm_attachments for insert with check (
  exists (select 1 from comm_messages m where m.id = message_id and m.author_id = auth.uid()));
create policy attachments_file on comm_attachments for update using ((select org from comm_me()) = 'aurum' and comm_can_see_message(message_id));

create policy reactions_read on comm_reactions for select using (comm_can_see_message(message_id));
create policy reactions_mine on comm_reactions for all using (user_id = auth.uid()) with check (user_id = auth.uid() and comm_can_see_message(message_id));
create policy reads_mine on comm_reads for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy requests_read on comm_requests for select using (
  requested_by = auth.uid() or comm_space_role(space_id) in ('admin','owner'));
create policy requests_create on comm_requests for insert with check (
  requested_by = auth.uid() and status = 'pending'
  and exists (select 1 from comm_people p where p.user_id = auth.uid() and p.org = client_id and p.client_role = 'admin')
  and exists (select 1 from comm_client_spaces cs where cs.client_id = comm_requests.client_id and cs.space_id = comm_requests.space_id));
create policy requests_decide on comm_requests for update using (comm_space_role(space_id) in ('admin','owner'));

-- ───────────────────────── storage ─────────────────────────
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit)
    values ('comm-files', 'comm-files', false, 524288000)
    on conflict (id) do nothing;
    execute $p$create policy comm_files_read on storage.objects for select
      using (bucket_id = 'comm-files' and exists (select 1 from public.comm_attachments a where a.storage_path = storage.objects.name and public.comm_can_see_message(a.message_id)))$p$;
  end if;
end $$;
