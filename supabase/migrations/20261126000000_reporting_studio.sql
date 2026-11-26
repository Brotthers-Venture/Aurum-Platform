-- Aurum Platform — quarter close and Report Studio.
-- Mirrors src/lib/reporting/store.ts (quarter closes) and src/lib/studio/store.ts (reports). Until a Supabase project is
-- connected the app keeps both in the browser; src/lib/studio/persist.ts switches to these tables when the keys exist.
--
-- Rules enforced here, not only in the interface:
--   • content changes only while a report is a draft, by someone who may prepare reports for the fund;
--   • status moves one step at a time, each step by the permission that owns it, and nobody approves a report they sent
--     for review (four eyes);
--   • versions and data snapshots are append-only; a published version is never edited (corrections open a new draft);
--   • internal comments and section reviews never reach investors;
--   • investors read only published reports written for partners, of funds they hold, and statements addressed to them.

-- ───────────────────────── Permissions (generated from src/lib/access.ts) ─────────────────────────
insert into permissions (key, area, label) values
  ('reports.prepare', 'Reporting', 'Prepare reports and quarter closes'),
  ('reports.review', 'Reporting', 'Review and approve reports'),
  ('reports.publish', 'Reporting', 'Publish reports to investors'),
  ('reports.approve_gp', 'Reporting', 'Approve reporting packages as the manager')
on conflict (key) do nothing;

insert into role_permissions (role_id, permission_key) values
  ('fund_services_head', 'reports.prepare'),
  ('fund_services_head', 'reports.review'),
  ('fund_services_head', 'reports.publish'),
  ('fund_accountant', 'reports.prepare'),
  ('gp_principal', 'reports.approve_gp')
on conflict do nothing;

-- ───────────────────────── Quarter close ─────────────────────────
create table quarter_closes (
  fund_id      text not null references funds,
  period       text not null check (period ~ '^\d{4}-Q[1-4]$'),
  status       text not null default 'preparing' check (status in ('preparing','in_review','with_gp','published')),
  -- checklist state, valuation requests, adjustments, letter blocks and sign-offs, as the app models them
  payload      jsonb not null default '{}',
  prepared_by  uuid references auth.users,
  reviewed_by  uuid references auth.users,
  gp_approved_by uuid references auth.users,
  published_at timestamptz,
  updated_at   timestamptz not null default now(),
  primary key (fund_id, period),
  check (reviewed_by is null or reviewed_by <> prepared_by)
);
alter table quarter_closes enable row level security;

create policy closes_read on quarter_closes for select using (has_permission('fund.view', fund_id) or has_permission('reports.approve_gp', fund_id));
create policy closes_prepare on quarter_closes for insert with check (has_permission('reports.prepare', fund_id) and status = 'preparing');
create policy closes_update on quarter_closes for update
  using (status <> 'published' and (has_permission('reports.prepare', fund_id) or has_permission('reports.review', fund_id) or has_permission('reports.approve_gp', fund_id)))
  with check (
    (status = 'preparing'  and has_permission('reports.prepare', fund_id)) or
    (status = 'in_review'  and (has_permission('reports.prepare', fund_id) or has_permission('reports.review', fund_id))) or
    (status = 'with_gp'    and (has_permission('reports.review', fund_id) or has_permission('reports.approve_gp', fund_id))) or
    (status = 'published'  and has_permission('reports.publish', fund_id))
  );

-- ───────────────────────── Reports ─────────────────────────
create table reports (
  id            text primary key,
  template      text not null check (template in ('quarterly-fund','annual-fund','capital-account','portfolio-performance','family-wealth','factsheet','capital-activity','gp-management','investor-letter')),
  subject       text not null default 'fund' check (subject in ('fund','family')),
  fund_id       text references funds,          -- set for fund reports
  family_id     text,                           -- set for family reports
  investor_id   text references investors,      -- a statement addressed to one partner
  locale        text not null default 'en' check (locale in ('en','pt')),
  period        text not null check (period ~ '^\d{4}-Q[1-4]$'),
  name          text not null,
  status        text not null default 'draft' check (status in ('draft','in_review','approved','published','archived')),
  archived_from text check (archived_from in ('draft','in_review','approved','published')),
  design        jsonb not null,
  pages         jsonb not null,                 -- pages of typed blocks; figures are {{keys}}, never values
  review        jsonb not null default '{}',    -- section reviews while in review (internal)
  snapshot_id   uuid,                           -- the frozen data the report shows; null = live
  created_by    uuid not null references auth.users default auth.uid(),
  sent_by       uuid references auth.users,     -- who sent it for review (cannot approve it)
  created_at    timestamptz not null default now(),
  modified_at   timestamptz not null default now(),
  modified_by   uuid references auth.users default auth.uid(),
  check ((subject = 'fund') = (fund_id is not null)),
  check ((subject = 'family') = (family_id is not null)),
  check (investor_id is null or template = 'capital-account')
);
create index reports_fund_period on reports (fund_id, period);
alter table reports enable row level security;

-- Family reports are scoped at platform level until families have their own scope type.
create or replace function report_can(p_perm text, p_fund text) returns boolean
language sql stable as $$ select case when p_fund is null then has_permission(p_perm) else has_permission(p_perm, p_fund) end $$;

create policy reports_staff_read on reports for select
  using (report_can('fund.view', fund_id) or report_can('reports.prepare', fund_id) or report_can('reports.approve_gp', fund_id));

create policy reports_investor_read on reports for select
  using (
    status = 'published'
    and template in ('quarterly-fund','annual-fund','capital-account','capital-activity','investor-letter','factsheet')
    and fund_id in (select c.fund_id from commitments c where c.investor_id in (select my_investor_ids()))
    and (investor_id is null or investor_id in (select my_investor_ids()))
  );

create policy reports_create on reports for insert
  with check (status = 'draft' and created_by = auth.uid() and report_can('reports.prepare', fund_id));

create policy reports_update on reports for update
  using (report_can('reports.prepare', fund_id) or report_can('reports.review', fund_id) or report_can('reports.publish', fund_id))
  with check (true);  -- the transition trigger below decides what a change may be

-- Status moves and content locks.
create or replace function check_report_change() returns trigger language plpgsql as $$
declare
  content_changed boolean := new.pages is distinct from old.pages or new.design is distinct from old.design
                             or new.name is distinct from old.name or new.locale is distinct from old.locale
                             or new.investor_id is distinct from old.investor_id;
begin
  if new.id <> old.id or new.template <> old.template or new.fund_id is distinct from old.fund_id
     or new.family_id is distinct from old.family_id or new.period <> old.period or new.created_by <> old.created_by then
    raise exception 'A report''s template, subject and period are fixed; duplicate it instead';
  end if;

  if content_changed and not (old.status = 'draft' and new.status = 'draft' and report_can('reports.prepare', old.fund_id)) then
    raise exception 'Report content can only change in draft, by someone who prepares reports';
  end if;

  if new.status <> old.status then
    if not (
      (old.status = 'draft'     and new.status = 'in_review' and report_can('reports.prepare', old.fund_id) and new.snapshot_id is not null) or
      (old.status = 'in_review' and new.status = 'draft'     and (report_can('reports.prepare', old.fund_id) or report_can('reports.review', old.fund_id))) or
      (old.status = 'in_review' and new.status = 'approved'  and report_can('reports.review', old.fund_id) and old.sent_by is distinct from auth.uid()) or
      (old.status = 'approved'  and new.status = 'published' and report_can('reports.publish', old.fund_id)) or
      (old.status = 'approved'  and new.status = 'draft'     and (report_can('reports.prepare', old.fund_id) or report_can('reports.review', old.fund_id))) or
      (old.status = 'published' and new.status = 'draft'     and report_can('reports.prepare', old.fund_id)) or   -- a correction
      (new.status = 'archived'  and report_can('reports.prepare', old.fund_id) and new.archived_from = old.status) or
      (old.status = 'archived'  and new.status = old.archived_from and report_can('reports.prepare', old.fund_id))
    ) then
      raise exception 'Report status cannot move from % to % for this user', old.status, new.status;
    end if;
    if new.status = 'in_review' then new.sent_by := auth.uid(); end if;
  elsif old.status in ('approved','published','archived') and new.snapshot_id is distinct from old.snapshot_id then
    raise exception 'The data of an approved or published report is frozen';
  end if;

  new.modified_at := now();
  new.modified_by := auth.uid();
  return new;
end $$;
create trigger report_change before update on reports for each row execute function check_report_change();

-- Reports are archived, never deleted.
create or replace function forbid_report_delete() returns trigger language plpgsql as $$
begin raise exception 'Reports are archived, not deleted'; end $$;
create trigger report_no_delete before delete on reports for each row execute function forbid_report_delete();

-- ───────────────────────── Snapshots and versions (append-only) ─────────────────────────
create table report_snapshots (
  id         uuid primary key default gen_random_uuid(),
  report_id  text not null references reports,
  data       jsonb not null,                    -- the ReportData the report was reviewed or published on
  taken_at   timestamptz not null default now(),
  taken_by   uuid not null references auth.users default auth.uid()
);
alter table reports add constraint reports_snapshot_fk foreign key (snapshot_id) references report_snapshots;

create table report_versions (
  report_id  text not null references reports,
  n          int not null,
  status     text not null check (status in ('draft','in_review','approved','published','archived')),
  note       text not null,
  snapshot_id uuid references report_snapshots,
  pages      jsonb,                             -- the content as approved or published
  at         timestamptz not null default now(),
  by_user    uuid not null references auth.users default auth.uid(),
  primary key (report_id, n)
);

create or replace function forbid_history_change() returns trigger language plpgsql as $$
begin raise exception 'Report history is append-only'; end $$;
create trigger snapshots_append_only before update or delete on report_snapshots for each row execute function forbid_history_change();
create trigger versions_append_only before update or delete on report_versions for each row execute function forbid_history_change();

alter table report_snapshots enable row level security;
alter table report_versions enable row level security;

create policy snapshots_read on report_snapshots for select using (exists (select 1 from reports r where r.id = report_id));  -- RLS on reports applies
create policy snapshots_write on report_snapshots for insert
  with check (taken_by = auth.uid() and exists (select 1 from reports r where r.id = report_id and report_can('reports.prepare', r.fund_id)));
create policy versions_read on report_versions for select
  using (exists (select 1 from reports r where r.id = report_id and (report_can('fund.view', r.fund_id) or report_can('reports.prepare', r.fund_id))));
create policy versions_write on report_versions for insert
  with check (by_user = auth.uid() and exists (select 1 from reports r where r.id = report_id
    and (report_can('reports.prepare', r.fund_id) or report_can('reports.review', r.fund_id) or report_can('reports.publish', r.fund_id))));

-- ───────────────────────── Internal comments (never published) ─────────────────────────
create table report_comments (
  id          uuid primary key default gen_random_uuid(),
  report_id   text not null references reports,
  page_id     text not null,
  block_id    text not null,
  parent_id   uuid references report_comments,  -- replies
  author      uuid not null references auth.users default auth.uid(),
  body        text not null check (length(body) between 1 and 4000),
  resolved_at timestamptz,
  resolved_by uuid references auth.users,
  created_at  timestamptz not null default now()
);
alter table report_comments enable row level security;

create policy comments_read on report_comments for select
  using (exists (select 1 from reports r where r.id = report_id
    and (report_can('reports.prepare', r.fund_id) or report_can('reports.review', r.fund_id) or report_can('reports.publish', r.fund_id))));
create policy comments_write on report_comments for insert
  with check (author = auth.uid() and exists (select 1 from reports r where r.id = report_id
    and (report_can('reports.prepare', r.fund_id) or report_can('reports.review', r.fund_id))));
create policy comments_resolve on report_comments for update
  using (exists (select 1 from reports r where r.id = report_id and (report_can('reports.prepare', r.fund_id) or report_can('reports.review', r.fund_id))))
  with check (resolved_by = auth.uid());

-- Only resolving changes a comment; its text and author stay as written.
create or replace function check_comment_change() returns trigger language plpgsql as $$
begin
  if new.body <> old.body or new.author <> old.author or new.report_id <> old.report_id or new.block_id <> old.block_id then
    raise exception 'Comments are not edited; reply instead';
  end if;
  return new;
end $$;
create trigger comment_change before update on report_comments for each row execute function check_comment_change();
create trigger comments_no_delete before delete on report_comments for each row execute function forbid_history_change();
