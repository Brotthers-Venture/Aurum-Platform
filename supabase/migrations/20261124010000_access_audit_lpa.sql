-- Aurum Platform — access control, audit log and LPA review with human approval.
-- Role/permission seeds are generated from src/lib/access.ts.

-- ───────────────────────── Roles, permissions, scopes ─────────────────────────
create table permissions (
  key    text primary key,
  area   text not null,
  label  text not null
);

create table roles (
  id          text primary key,
  name        text not null,
  audience    text not null check (audience in ('Aurum staff','Client (GP)','Investor','External')),
  description text not null
);

create table role_permissions (
  role_id        text references roles on delete cascade,
  permission_key text references permissions on delete cascade,
  primary key (role_id, permission_key)
);

-- A user can hold several role grants, each limited to a scope and optionally expiring.
create table user_roles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  role_id     text not null references roles,
  scope_type  text not null check (scope_type in ('platform','fund','investor')),
  scope_id    text,                      -- fund id or investor id; null for platform scope
  granted_by  uuid references auth.users,
  granted_at  timestamptz not null default now(),
  expires_at  timestamptz,
  check ((scope_type = 'platform') = (scope_id is null)),
  check (granted_by is null or granted_by <> user_id)   -- nobody grants their own access
);

create or replace function has_permission(p_key text, p_fund text default null) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from user_roles ur
    join role_permissions rp on rp.role_id = ur.role_id and rp.permission_key = p_key
    where ur.user_id = auth.uid()
      and (ur.expires_at is null or ur.expires_at > now())
      and (ur.scope_type = 'platform' or (ur.scope_type = 'fund' and ur.scope_id = p_fund))
  );
$$;

-- ───────────────────────── Audit log (append-only) ─────────────────────────
create table audit_log (
  id          bigint generated always as identity primary key,
  at          timestamptz not null default now(),
  user_id     uuid references auth.users,
  action      text not null,
  object_type text not null,
  object_id   text,
  detail      jsonb,
  ip          inet
);

create or replace function forbid_audit_change() returns trigger language plpgsql as $$
begin raise exception 'The audit log is append-only'; end $$;
create trigger audit_log_immutable before update or delete on audit_log
  for each row execute function forbid_audit_change();

-- ───────────────────────── LPA review ─────────────────────────
create table lpa_documents (
  id          uuid primary key default gen_random_uuid(),
  fund_id     text not null references funds,
  kind        text not null check (kind in ('LPA','Amendment','Side letter')),
  name        text not null,
  document_date date not null,
  investor_id text references investors,            -- side letters only
  storage_path text not null,                        -- Supabase Storage object
  sha256      text not null,                         -- proves which file was reviewed
  uploaded_by uuid not null references auth.users,
  uploaded_at timestamptz not null default now(),
  check ((kind = 'Side letter') = (investor_id is not null))
);

create table lpa_reviews (
  id                 uuid primary key default gen_random_uuid(),
  fund_id            text not null references funds,
  version            int not null,
  effective_date     date not null,
  model              text not null,
  status             text not null default 'Aurum review' check (status in ('Aurum review','GP confirmation','Applied','Returned','Superseded')),
  prepared_by        uuid not null references auth.users,
  prepared_at        timestamptz not null default now(),
  aurum_approved_by  uuid references auth.users,
  aurum_approved_at  timestamptz,
  gp_approved_by     uuid references auth.users,
  gp_approved_at     timestamptz,
  unique (fund_id, version),
  -- four-eyes: three different people prepare, approve for Aurum and confirm for the GP
  check (aurum_approved_by is null or aurum_approved_by <> prepared_by),
  check (gp_approved_by is null or (gp_approved_by <> prepared_by and gp_approved_by <> aurum_approved_by)),
  check (status <> 'Applied' or (aurum_approved_by is not null and gp_approved_by is not null))
);

create table lpa_review_documents (
  review_id   uuid references lpa_reviews on delete cascade,
  document_id uuid references lpa_documents,
  primary key (review_id, document_id)
);

create table lpa_terms (
  id            uuid primary key default gen_random_uuid(),
  review_id     uuid not null references lpa_reviews on delete cascade,
  term_key      text not null,
  status        text not null check (status in ('extracted','not_found','ambiguous')),
  value         text,
  document_id   uuid references lpa_documents,
  clause        text,
  page          int,
  quote         text,
  readings      jsonb,
  verification  text not null check (verification in ('verified','needs_decision','not_applicable')),
  decision      text check (decision in ('approved','corrected','rejected','reading_selected','confirmed_absent')),
  decided_value text,
  decision_source text,                -- required when an approver corrects or enters a value
  decision_note text,                  -- required when choosing between readings
  decided_by    uuid references auth.users,
  decided_at    timestamptz,
  unique (review_id, term_key),
  -- nothing implied: an extracted value must carry its quote and location
  check (status <> 'extracted' or (value is not null and quote is not null and clause is not null and page is not null)),
  check (status <> 'not_found' or value is null),
  check (status <> 'ambiguous' or jsonb_array_length(readings) >= 2),
  check (decision is distinct from 'corrected' or (decided_value is not null and decision_source is not null)),
  check (decision is distinct from 'reading_selected' or decision_note is not null)
);

-- The preparer cannot decide terms on their own review.
create or replace function check_term_decider() returns trigger language plpgsql as $$
declare preparer uuid;
begin
  if new.decided_by is null then return new; end if;
  select prepared_by into preparer from lpa_reviews where id = new.review_id;
  if new.decided_by = preparer then
    raise exception 'Four-eyes: the preparer of review % cannot decide its terms', new.review_id;
  end if;
  return new;
end $$;
create trigger lpa_terms_decider before insert or update on lpa_terms for each row execute function check_term_decider();

-- A review can only move to GP confirmation once every term is decided and none rejected.
create or replace function check_review_complete() returns trigger language plpgsql as $$
begin
  if new.status in ('GP confirmation','Applied') and exists (
    select 1 from lpa_terms where review_id = new.id and (decision is null or decision = 'rejected')
  ) then
    raise exception 'Review % has undecided or rejected terms', new.id;
  end if;
  return new;
end $$;
create trigger lpa_reviews_complete before update on lpa_reviews for each row execute function check_review_complete();

-- Applied economics, versioned by effective date; earlier periods keep earlier versions.
create table fund_economics_versions (
  id             uuid primary key default gen_random_uuid(),
  fund_id        text not null references funds,
  review_id      uuid not null references lpa_reviews,
  effective_date date not null,
  terms          jsonb not null,
  applied_at     timestamptz not null default now(),
  unique (fund_id, effective_date)
);
create or replace function forbid_economics_change() returns trigger language plpgsql as $$
begin raise exception 'Applied economics are immutable; approve a new version instead'; end $$;
create trigger fund_economics_immutable before update or delete on fund_economics_versions
  for each row execute function forbid_economics_change();

-- ───────────────────────── RLS ─────────────────────────
alter table user_roles enable row level security;
alter table audit_log enable row level security;
alter table lpa_documents enable row level security;
alter table lpa_reviews enable row level security;
alter table lpa_terms enable row level security;
alter table fund_economics_versions enable row level security;

create policy manage_user_roles on user_roles for all using (has_permission('platform.users.manage')) with check (has_permission('platform.users.manage'));
create policy own_user_roles on user_roles for select using (user_id = auth.uid());
create policy read_audit on audit_log for select using (has_permission('platform.audit.view'));
create policy insert_audit on audit_log for insert with check (user_id = auth.uid());

create policy lpa_docs_read on lpa_documents for select using (has_permission('fund.view', fund_id));
create policy lpa_docs_write on lpa_documents for insert with check (has_permission('economics.prepare', fund_id) and uploaded_by = auth.uid());
create policy lpa_reviews_read on lpa_reviews for select using (has_permission('fund.view', fund_id));
create policy lpa_reviews_prepare on lpa_reviews for insert with check (has_permission('economics.prepare', fund_id) and prepared_by = auth.uid());
create policy lpa_reviews_approve on lpa_reviews for update using (has_permission('economics.approve', fund_id));
create policy lpa_terms_read on lpa_terms for select using (exists (select 1 from lpa_reviews r where r.id = review_id and has_permission('fund.view', r.fund_id)));
create policy lpa_terms_decide on lpa_terms for update using (exists (select 1 from lpa_reviews r where r.id = review_id and has_permission('economics.approve', r.fund_id)));
create policy economics_read on fund_economics_versions for select using (has_permission('fund.view', fund_id));

-- ───────────────────────── Seeds (generated) ─────────────────────────
insert into permissions (key, area, label) values
  ('platform.users.manage', 'Platform', 'Manage users and roles'),
  ('platform.audit.view', 'Platform', 'View audit log'),
  ('fund.view', 'Fund setup & economics', 'View funds'),
  ('fund.setup.edit', 'Fund setup & economics', 'Edit fund setup'),
  ('economics.prepare', 'Fund setup & economics', 'Run LPA review, prepare economics'),
  ('economics.approve', 'Fund setup & economics', 'Approve fund economics'),
  ('ledger.view', 'Accounting', 'View general ledger'),
  ('ledger.post', 'Accounting', 'Post journal entries'),
  ('ledger.close_period', 'Accounting', 'Close accounting periods'),
  ('calls.prepare', 'Capital activity', 'Prepare capital calls'),
  ('calls.review', 'Capital activity', 'Review capital calls'),
  ('calls.approve_gp', 'Capital activity', 'Approve calls as GP'),
  ('distributions.prepare', 'Capital activity', 'Prepare distributions'),
  ('distributions.approve_gp', 'Capital activity', 'Approve distributions as GP'),
  ('onboarding.manage', 'Investors & compliance', 'Manage onboarding'),
  ('kyc.decide', 'Investors & compliance', 'Decide KYC / AML matches'),
  ('investors.view_all', 'Investors & compliance', 'View all investor records'),
  ('investors.change_review', 'Investors & compliance', 'Approve investor profile changes'),
  ('banking.view', 'Banking', 'View bank accounts and transactions'),
  ('banking.connect', 'Banking', 'Connect bank accounts (Plaid)'),
  ('portal.view_own', 'Investor portal', 'View own investments and documents'),
  ('portal.sign', 'Investor portal', 'Sign subscription documents'),
  ('portal.change_bank', 'Investor portal', 'Request bank account changes');

insert into roles (id, name, audience, description) values
  ('platform_admin', 'Platform administrator', 'Aurum staff', 'Manages users, roles and settings. Cannot approve money movement or economics — administration is kept separate from operations.'),
  ('fund_services_head', 'Head of Fund Services', 'Aurum staff', 'Senior approver. Reviews capital activity and approves fund economics prepared by others.'),
  ('fund_accountant', 'Fund accountant', 'Aurum staff', 'Runs the books: prepares calls, distributions and entries, runs LPA reviews. Cannot approve own work.'),
  ('compliance_officer', 'Compliance officer', 'Aurum staff', 'Owns KYC/AML decisions, onboarding approval and investor profile changes, including bank account changes.'),
  ('relationship_manager', 'Relationship manager', 'Aurum staff', 'Client-facing. Invites investors and follows onboarding; no access to post or approve accounting.'),
  ('auditor', 'External auditor', 'External', 'Read-only access to the ledger, documents and audit log for the audit period. Expires automatically.'),
  ('gp_principal', 'GP principal', 'Client (GP)', 'Fund manager signatory. Final approval of capital calls, distributions and the fund economics Aurum prepares.'),
  ('gp_staff', 'GP team member', 'Client (GP)', 'Fund manager''s team (CFO, IR). Views funds, investors and reports; no approvals.'),
  ('investor_signatory', 'Investor — authorized signatory', 'Investor', 'Signs subscriptions and requests changes to banking and contacts.'),
  ('investor_viewer', 'Investor — viewer', 'Investor', 'Accountants, advisors and family members with read-only access to statements and documents.');

insert into role_permissions (role_id, permission_key) values
  ('platform_admin', 'platform.users.manage'),
  ('platform_admin', 'platform.audit.view'),
  ('platform_admin', 'fund.view'),
  ('platform_admin', 'ledger.view'),
  ('platform_admin', 'investors.view_all'),
  ('platform_admin', 'banking.view'),
  ('fund_services_head', 'platform.audit.view'),
  ('fund_services_head', 'fund.view'),
  ('fund_services_head', 'fund.setup.edit'),
  ('fund_services_head', 'economics.prepare'),
  ('fund_services_head', 'economics.approve'),
  ('fund_services_head', 'ledger.view'),
  ('fund_services_head', 'ledger.post'),
  ('fund_services_head', 'ledger.close_period'),
  ('fund_services_head', 'calls.prepare'),
  ('fund_services_head', 'calls.review'),
  ('fund_services_head', 'distributions.prepare'),
  ('fund_services_head', 'onboarding.manage'),
  ('fund_services_head', 'kyc.decide'),
  ('fund_services_head', 'investors.view_all'),
  ('fund_services_head', 'investors.change_review'),
  ('fund_services_head', 'banking.view'),
  ('fund_services_head', 'banking.connect'),
  ('fund_accountant', 'fund.view'),
  ('fund_accountant', 'economics.prepare'),
  ('fund_accountant', 'ledger.view'),
  ('fund_accountant', 'ledger.post'),
  ('fund_accountant', 'calls.prepare'),
  ('fund_accountant', 'calls.review'),
  ('fund_accountant', 'distributions.prepare'),
  ('fund_accountant', 'investors.view_all'),
  ('fund_accountant', 'banking.view'),
  ('compliance_officer', 'fund.view'),
  ('compliance_officer', 'onboarding.manage'),
  ('compliance_officer', 'kyc.decide'),
  ('compliance_officer', 'investors.view_all'),
  ('compliance_officer', 'investors.change_review'),
  ('compliance_officer', 'platform.audit.view'),
  ('relationship_manager', 'fund.view'),
  ('relationship_manager', 'onboarding.manage'),
  ('auditor', 'fund.view'),
  ('auditor', 'ledger.view'),
  ('auditor', 'platform.audit.view'),
  ('auditor', 'banking.view'),
  ('gp_principal', 'fund.view'),
  ('gp_principal', 'economics.approve'),
  ('gp_principal', 'ledger.view'),
  ('gp_principal', 'calls.approve_gp'),
  ('gp_principal', 'distributions.approve_gp'),
  ('gp_principal', 'investors.view_all'),
  ('gp_principal', 'banking.view'),
  ('gp_staff', 'fund.view'),
  ('gp_staff', 'ledger.view'),
  ('gp_staff', 'investors.view_all'),
  ('investor_signatory', 'portal.view_own'),
  ('investor_signatory', 'portal.sign'),
  ('investor_signatory', 'portal.change_bank'),
  ('investor_viewer', 'portal.view_own');
