-- Aurum Platform — fund administration core schema (Supabase / Postgres)
-- Mirrors src/lib/accounting/* so the UI can switch from sample data to live tables.
-- Money is stored as bigint cents; every journal entry must balance.

create extension if not exists "pgcrypto";

-- ───────────────────────── Identity & access ─────────────────────────
create type app_role as enum ('staff_admin', 'staff_accounting', 'staff_operations', 'investor_signatory', 'investor_viewer');

create table profiles (
  user_id      uuid primary key references auth.users on delete cascade,
  full_name    text not null,
  role         app_role not null,
  created_at   timestamptz not null default now()
);

create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where user_id = auth.uid() and role::text like 'staff_%');
$$;

-- ───────────────────────── Master data ─────────────────────────
create table funds (
  id              text primary key,
  name            text not null,
  legal_form      text not null,
  domicile        text not null,
  base_currency   char(3) not null check (base_currency in ('USD','BRL','EUR')),
  vintage         int,
  strategy        text,
  status          text not null default 'Fundraising',
  target_size     bigint,
  gp_name         text not null,
  manager_name    text,
  hurdle_rate     numeric(6,4) not null default 0.08,
  carry_rate      numeric(6,4) not null default 0.20,
  catch_up        numeric(6,4) not null default 1.00,
  equalization_rate numeric(6,4) not null default 0.08,
  co_administrator text,
  created_at      timestamptz not null default now()
);

create table investors (
  id              text primary key,
  legal_name      text not null,
  investor_type   text not null,
  jurisdiction    text not null,
  tax_form        text not null check (tax_form in ('W-9','W-8BEN','W-8BEN-E','W-8IMY')),
  kyc_status      text not null default 'Pending',
  relationship_manager text,
  created_at      timestamptz not null default now()
);

-- Which portal users may see which investing entities.
create table investor_users (
  investor_id text references investors on delete cascade,
  user_id     uuid references auth.users on delete cascade,
  can_sign    boolean not null default false,
  notices     text[] not null default '{calls,distributions,reports,tax}',
  primary key (investor_id, user_id)
);

create or replace function my_investor_ids() returns setof text
language sql stable security definer set search_path = public as $$
  select investor_id from investor_users where user_id = auth.uid();
$$;

create table fund_closes (
  id          uuid primary key default gen_random_uuid(),
  fund_id     text not null references funds,
  close_date  date not null,
  sequence    int not null,
  status      text not null default 'Scheduled' check (status in ('Scheduled','Posted')),
  unique (fund_id, sequence)
);

create table commitments (
  id            uuid primary key default gen_random_uuid(),
  fund_id       text not null references funds,
  investor_id   text not null references investors,
  close_id      uuid not null references fund_closes,
  amount_cents  bigint not null check (amount_cents > 0),
  unique (fund_id, investor_id)
);

-- ───────────────────────── General ledger ─────────────────────────
create table accounts (
  code        text primary key,
  name        text not null,
  type        text not null check (type in ('asset','liability','equity','income','expense')),
  partner_level boolean not null default false
);

insert into accounts (code, name, type, partner_level) values
  ('1000','Cash and cash equivalents','asset',false),
  ('1100','Investments, at cost','asset',false),
  ('1150','Unrealized appreciation on investments','asset',false),
  ('1200','Capital contributions receivable','asset',true),
  ('2300','Equalization interest payable','liability',false),
  ('3000','Partners'' capital — contributions','equity',true),
  ('3100','Partners'' capital — distributions','equity',true),
  ('4000','Investment income','income',false),
  ('4100','Net realized gain on investments','income',false),
  ('4200','Net change in unrealized appreciation','income',false),
  ('5000','Management fees','expense',false),
  ('5100','Fund expenses','expense',false),
  ('5200','Organizational costs','expense',false);

create table journal_entries (
  id          uuid primary key default gen_random_uuid(),
  fund_id     text not null references funds,
  entry_no    text not null,
  entry_date  date not null,
  memo        text not null,
  source      text not null,
  source_ref  text,
  posted_by   uuid references auth.users,
  posted_at   timestamptz not null default now(),
  reverses    uuid references journal_entries,
  unique (fund_id, entry_no)
);

create table journal_lines (
  id            bigint generated always as identity primary key,
  entry_id      uuid not null references journal_entries on delete restrict,
  account_code  text not null references accounts,
  investor_id   text references investors,
  debit_cents   bigint not null default 0 check (debit_cents >= 0),
  credit_cents  bigint not null default 0 check (credit_cents >= 0),
  check ((debit_cents = 0) <> (credit_cents = 0))
);

create index on journal_lines (entry_id);
create index on journal_lines (account_code, investor_id);

-- Partner-level accounts must carry an investor; others must not.
create or replace function check_partner_tag() returns trigger language plpgsql as $$
declare is_partner boolean;
begin
  select partner_level into is_partner from accounts where code = new.account_code;
  if is_partner and new.investor_id is null then
    raise exception 'Account % requires an investor tag', new.account_code;
  end if;
  if not is_partner and new.investor_id is not null then
    raise exception 'Account % must not carry an investor tag', new.account_code;
  end if;
  return new;
end $$;
create trigger journal_lines_partner_tag before insert on journal_lines for each row execute function check_partner_tag();

-- Every entry must balance; checked at commit so lines can be inserted one by one.
create or replace function check_entry_balanced() returns trigger language plpgsql as $$
declare dr bigint; cr bigint;
begin
  select coalesce(sum(debit_cents),0), coalesce(sum(credit_cents),0) into dr, cr
  from journal_lines where entry_id = new.entry_id;
  if dr <> cr then
    raise exception 'Journal entry % is unbalanced: debits % vs credits %', new.entry_id, dr, cr;
  end if;
  return null;
end $$;
create constraint trigger journal_lines_balanced after insert on journal_lines
  deferrable initially deferred for each row execute function check_entry_balanced();

-- Posted books are immutable: corrections are made with reversing entries.
create or replace function forbid_change() returns trigger language plpgsql as $$
begin raise exception 'Posted journal data cannot be modified; post a reversing entry instead'; end $$;
create trigger journal_lines_immutable before update or delete on journal_lines for each row execute function forbid_change();
create trigger journal_entries_immutable before update or delete on journal_entries for each row execute function forbid_change();

-- ───────────────────────── Capital activity ─────────────────────────
create table capital_calls (
  id            uuid primary key default gen_random_uuid(),
  fund_id       text not null references funds,
  call_number   int not null,
  notice_date   date not null,
  due_date      date not null check (due_date > notice_date),
  basis         text not null default 'commitment' check (basis in ('commitment','unfunded')),
  status        text not null default 'Draft' check (status in ('Draft','In review','Approved','Issued','Partially funded','Funded','Cancelled')),
  prepared_by   uuid references auth.users,
  reviewed_by   uuid references auth.users,
  approved_by   uuid references auth.users,
  check (reviewed_by is null or reviewed_by <> prepared_by), -- four-eyes
  unique (fund_id, call_number)
);

create table capital_call_items (
  id            bigint generated always as identity primary key,
  call_id       uuid not null references capital_calls on delete cascade,
  kind          text not null check (kind in ('investment','management_fee','fund_expense','organizational')),
  description   text not null,
  amount_cents  bigint not null check (amount_cents > 0)
);

create table capital_call_allocations (
  call_id       uuid not null references capital_calls on delete cascade,
  investor_id   text not null references investors,
  amount_cents  bigint not null,
  paid_cents    bigint not null default 0,
  paid_date     date,
  bank_txn_id   uuid,
  primary key (call_id, investor_id)
);

create table distributions (
  id                uuid primary key default gen_random_uuid(),
  fund_id           text not null references funds,
  payment_date      date not null,
  source            text not null,
  return_of_capital_cents bigint not null default 0,
  realized_gain_cents     bigint not null default 0,
  income_cents            bigint not null default 0,
  status            text not null default 'Draft' check (status in ('Draft','In review','Approved','Scheduled','Paid')),
  waterfall         jsonb,            -- tier-by-tier result at approval
  prepared_by       uuid references auth.users,
  approved_by       uuid references auth.users
);

create table distribution_allocations (
  distribution_id uuid not null references distributions on delete cascade,
  investor_id     text not null references investors,
  gross_cents     bigint not null,
  withholding_cents bigint not null default 0,
  primary key (distribution_id, investor_id)
);

create table valuations (
  id          uuid primary key default gen_random_uuid(),
  fund_id     text not null references funds,
  as_of       date not null,
  change_cents bigint not null,
  memo        text not null
);

create table transfers (
  id            uuid primary key default gen_random_uuid(),
  fund_id       text not null references funds,
  from_investor text not null references investors,
  to_investor   text not null references investors,
  fraction      numeric(9,8) not null check (fraction > 0 and fraction <= 1),
  requested_on  date not null,
  effective_on  date not null,
  status        text not null default 'Requested' check (status in ('Requested','GP consent','Documentation','Completed','Withdrawn')),
  consideration text
);

create table equalizations (
  id            uuid primary key default gen_random_uuid(),
  close_id      uuid not null references fund_closes,
  investor_id   text not null references investors,
  principal_cents bigint not null,  -- positive = paid in by incoming partner; negative = refunded to existing partner
  interest_cents  bigint not null default 0
);

-- ───────────────────────── Banking (Plaid / statements) ─────────────────────────
create table bank_accounts (
  id              uuid primary key default gen_random_uuid(),
  fund_id         text references funds,
  investor_id     text references investors,
  institution     text not null,
  account_name    text not null,
  mask            text not null,
  currency        char(3) not null,
  purpose         text not null,
  connection      text not null default 'Manual statements' check (connection in ('Plaid','Bank API','Statement import','Manual statements')),
  plaid_item_id   text,           -- access token lives in Vault, never in this table
  verified_at     timestamptz,
  check ((fund_id is null) <> (investor_id is null))
);

create table bank_transactions (
  id              uuid primary key default gen_random_uuid(),
  bank_account_id uuid not null references bank_accounts,
  external_id     text not null,            -- Plaid transaction_id or statement line ref
  posted_date     date not null,
  amount_cents    bigint not null,          -- positive = inflow
  description     text,
  counterparty    text,
  matched_entry   uuid references journal_entries,
  unique (bank_account_id, external_id)
);

-- ───────────────────────── Investor self-service ─────────────────────────
create table profile_change_requests (
  id            uuid primary key default gen_random_uuid(),
  investor_id   text not null references investors,
  field         text not null,
  old_value     jsonb,
  new_value     jsonb not null,
  control       text not null,           -- e.g. 'callback + 5-day hold' for bank changes
  submitted_by  uuid not null references auth.users,
  submitted_at  timestamptz not null default now(),
  status        text not null default 'Pending review' check (status in ('Pending review','Approved','Rejected')),
  reviewed_by   uuid references auth.users,
  check (reviewed_by is null or reviewed_by <> submitted_by)
);

-- ───────────────────────── Row-level security ─────────────────────────
alter table funds enable row level security;
alter table investors enable row level security;
alter table commitments enable row level security;
alter table journal_entries enable row level security;
alter table journal_lines enable row level security;
alter table capital_calls enable row level security;
alter table capital_call_allocations enable row level security;
alter table distributions enable row level security;
alter table distribution_allocations enable row level security;
alter table bank_accounts enable row level security;
alter table bank_transactions enable row level security;
alter table profile_change_requests enable row level security;

-- Staff: full access to everything.
create policy staff_all_funds on funds for all using (is_staff()) with check (is_staff());
create policy staff_all_investors on investors for all using (is_staff()) with check (is_staff());
create policy staff_all_commitments on commitments for all using (is_staff()) with check (is_staff());
create policy staff_all_je on journal_entries for all using (is_staff()) with check (is_staff());
create policy staff_all_jl on journal_lines for all using (is_staff()) with check (is_staff());
create policy staff_all_calls on capital_calls for all using (is_staff()) with check (is_staff());
create policy staff_all_call_alloc on capital_call_allocations for all using (is_staff()) with check (is_staff());
create policy staff_all_dist on distributions for all using (is_staff()) with check (is_staff());
create policy staff_all_dist_alloc on distribution_allocations for all using (is_staff()) with check (is_staff());
create policy staff_all_bank on bank_accounts for all using (is_staff()) with check (is_staff());
create policy staff_all_bank_txn on bank_transactions for all using (is_staff()) with check (is_staff());
create policy staff_all_pcr on profile_change_requests for all using (is_staff()) with check (is_staff());

-- Investors: read only their own records; funds they are invested in.
create policy lp_read_investor on investors for select using (id in (select my_investor_ids()));
create policy lp_read_commitments on commitments for select using (investor_id in (select my_investor_ids()));
create policy lp_read_funds on funds for select using (id in (select fund_id from commitments where investor_id in (select my_investor_ids())));
create policy lp_read_call_alloc on capital_call_allocations for select using (investor_id in (select my_investor_ids()));
create policy lp_read_calls on capital_calls for select using (
  status not in ('Draft','In review') and id in (select call_id from capital_call_allocations where investor_id in (select my_investor_ids()))
);
create policy lp_read_dist_alloc on distribution_allocations for select using (investor_id in (select my_investor_ids()));
create policy lp_read_bank on bank_accounts for select using (investor_id in (select my_investor_ids()));
create policy lp_read_own_pcr on profile_change_requests for select using (investor_id in (select my_investor_ids()));
create policy lp_create_pcr on profile_change_requests for insert with check (
  investor_id in (select my_investor_ids()) and submitted_by = auth.uid() and status = 'Pending review'
);

-- Partner capital balances from the ledger (allocated income is computed by the accounting engine).
-- security_invoker keeps RLS in force for portal users.
create view partner_capital with (security_invoker = true) as
select je.fund_id,
       jl.investor_id,
       sum(case when jl.account_code = '3000' then jl.credit_cents - jl.debit_cents else 0 end) as called_cents,
       sum(case when jl.account_code = '1200' then jl.debit_cents - jl.credit_cents else 0 end) as receivable_cents,
       sum(case when jl.account_code = '3100' then jl.debit_cents - jl.credit_cents else 0 end) as distributed_cents
from journal_lines jl
join journal_entries je on je.id = jl.entry_id
where jl.investor_id is not null
group by je.fund_id, jl.investor_id;
