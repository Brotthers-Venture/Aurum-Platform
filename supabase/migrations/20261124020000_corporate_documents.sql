-- Corporate records for each vehicle: legal identity (LEI) and versioned formation documents.
-- Files live in the private Storage bucket "fund-documents" at {gp_id}/{fund_id}/{doc_type}/v{n}-{file};
-- this table is the register. Files are never overwritten: a new version supersedes; labels can be edited; removal archives.

-- ── Legal identity on the fund ─────────────────────────────────────────────
alter table funds
  add column gp_id            text,
  add column lei              text unique check (lei ~ '^[A-Z0-9]{18}[0-9]{2}$'),
  add column lei_verified_at  timestamptz,
  add column gleif_snapshot   jsonb,            -- the GLEIF record as captured (legal name, addresses, status…)
  add column registry_number  text,
  add column formation_date   date;

-- ── Document register ─────────────────────────────────────────────────────
create table fund_documents (
  id              uuid primary key default gen_random_uuid(),
  fund_id         text not null references funds(id),
  doc_type        text not null check (doc_type in (
                    'certificate_formation','lpa','ein_letter','good_standing','ppm','subscription_form',
                    'gp_agreement','ima','admin_agreement','side_letter','amendment','lei_record','other')),
  title           text not null,
  storage_path    text not null unique,
  sha256          char(64) not null check (sha256 ~ '^[0-9a-f]{64}$'),
  size_bytes      bigint not null check (size_bytes > 0),
  mime_type       text not null,
  effective_date  date,
  version         int not null default 1 check (version >= 1),
  supersedes      uuid references fund_documents(id),
  visibility      text not null default 'internal' check (visibility in ('internal','gp','investors')),
  uploaded_by     uuid not null references auth.users(id),
  uploaded_at     timestamptz not null default now(),
  archived_at     timestamptz,                      -- "removed" from the data room; the file and row are kept
  unique (fund_id, storage_path)
);
create index fund_documents_fund on fund_documents (fund_id, doc_type);

-- A new version must point at the version it replaces, for the same fund and type.
create or replace function check_document_version() returns trigger language plpgsql as $$
declare prev fund_documents;
begin
  if new.supersedes is null then
    if new.version <> 1 then raise exception 'version % must supersede an earlier version', new.version; end if;
    return new;
  end if;
  select * into prev from fund_documents where id = new.supersedes;
  if prev.fund_id <> new.fund_id or prev.doc_type <> new.doc_type then
    raise exception 'a document can only supersede one of the same fund and type';
  end if;
  if new.version <> prev.version + 1 then raise exception 'version must be %', prev.version + 1; end if;
  if exists (select 1 from fund_documents where supersedes = new.supersedes) then
    raise exception 'that version has already been superseded';
  end if;
  return new;
end $$;
create trigger fund_documents_version before insert on fund_documents for each row execute function check_document_version();

-- The file is immutable; only its labels may change (name, type, access, effective date) or it may be archived.
create or replace function guard_document_change() returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then raise exception 'fund documents cannot be deleted; archive them instead'; end if;
  if (new.id, new.fund_id, new.storage_path, new.sha256, new.size_bytes, new.mime_type, new.version, new.supersedes, new.uploaded_by, new.uploaded_at)
     is distinct from
     (old.id, old.fund_id, old.storage_path, old.sha256, old.size_bytes, old.mime_type, old.version, old.supersedes, old.uploaded_by, old.uploaded_at) then
    raise exception 'a stored file cannot be changed; upload a new version instead';
  end if;
  if old.archived_at is not null and new.archived_at is null then raise exception 'archived documents stay archived'; end if;
  return new;
end $$;
create trigger fund_documents_guard before update or delete on fund_documents for each row execute function guard_document_change();

-- Current version of each document
create view fund_documents_current with (security_invoker = true) as
select d.* from fund_documents d
where d.archived_at is null and not exists (select 1 from fund_documents n where n.supersedes = d.id);

-- ── Row-level security ────────────────────────────────────────────────────
alter table fund_documents enable row level security;

-- Aurum staff and the fund's GP (fund.view is scoped per fund) see everything not marked internal-only;
-- internal documents need setup rights. Investors see only investor-visible files of funds they are in.
create policy fund_docs_read_admin on fund_documents for select
  using (has_permission('fund.view', fund_id) and (visibility <> 'internal' or has_permission('fund.setup.edit', fund_id)));
create policy fund_docs_read_investor on fund_documents for select
  using (visibility = 'investors'
         and exists (select 1 from commitments c where c.fund_id = fund_documents.fund_id and c.investor_id in (select my_investor_ids())));
create policy fund_docs_insert on fund_documents for insert
  with check (has_permission('fund.setup.edit', fund_id) and uploaded_by = auth.uid());
create policy fund_docs_relabel on fund_documents for update
  using (has_permission('fund.setup.edit', fund_id)) with check (has_permission('fund.setup.edit', fund_id));

-- ── Storage bucket + object policies (only where Supabase Storage exists) ──
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('fund-documents', 'fund-documents', false, 52428800,
            array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/png','image/jpeg','application/json'])
    on conflict (id) do nothing;

    -- read an object only if the caller can read its register row (RLS above applies inside the subquery)
    execute $p$create policy fund_docs_objects_read on storage.objects for select
      using (bucket_id = 'fund-documents' and exists (select 1 from public.fund_documents d where d.storage_path = storage.objects.name))$p$;
    -- write under {gp_id}/{fund_id}/… only with setup rights on that fund; objects are never updated or deleted
    execute $p$create policy fund_docs_objects_insert on storage.objects for insert
      with check (bucket_id = 'fund-documents' and public.has_permission('fund.setup.edit', split_part(name, '/', 2)))$p$;
  end if;
end $$;
