-- CONTROL Platform · Business OS foundation
-- Safe to commit: no credentials. Designed to be re-runnable after migrations 01-07.

create schema if not exists app_private;

alter table public.memberships
add column if not exists permissions jsonb not null default '{}'::jsonb;

create table if not exists public.business_staff_access (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  staff_user_id uuid not null references public.profiles(id) on delete cascade,
  scopes text[] not null default '{}'::text[],
  consent_recorded boolean not null default false,
  reason text not null,
  expires_at timestamptz,
  granted_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, staff_user_id)
);

create or replace function app_private.has_business_scope(target_org uuid, requested_scope text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = target_org
      and m.user_id = auth.uid()
      and m.status = 'ACTIVE'
      and (
        m.role in ('OWNER', 'MANAGER')
        or m.permissions @> jsonb_build_object(requested_scope, true)
      )
  ) or exists (
    select 1
    from public.business_staff_access a
    join public.profiles p on p.id = a.staff_user_id
    where a.organization_id = target_org
      and a.staff_user_id = auth.uid()
      and a.consent_recorded
      and (a.expires_at is null or a.expires_at > now())
      and (requested_scope = any(a.scopes) or 'business_admin' = any(a.scopes))
      and p.status = 'ACTIVE'
  );
$$;

create or replace function app_private.can_manage_business(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.organization_id = target_org
      and m.user_id = auth.uid()
      and m.status = 'ACTIVE'
      and m.role in ('OWNER', 'MANAGER')
  ) or app_private.has_business_scope(target_org, 'business_write');
$$;

create table if not exists public.business_workspaces (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  status text not null default 'PROVISIONING'
    check (status in ('PROVISIONING', 'ACTIVE', 'SUSPENDED', 'ARCHIVED', 'ERROR')),
  mode text not null default 'SHARED' check (mode in ('SHARED', 'DEDICATED')),
  currency char(3) not null default 'PEN',
  timezone text not null default 'America/Lima',
  settings jsonb not null default '{}'::jsonb,
  entitlements_version integer not null default 1 check (entitlements_version > 0),
  canonical_url text,
  provisioned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  segment text,
  status text not null default 'ACTIVE'
    check (status in ('PROSPECT', 'ACTIVE', 'PAUSED', 'ENDED')),
  owner_user_id uuid references public.profiles(id) on delete set null,
  starts_on date,
  tax_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  category text,
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE', 'PAUSED', 'RETIRED', 'TEST')),
  list_price numeric(18,2) check (list_price is null or list_price >= 0),
  cost_estimate numeric(18,2) check (cost_estimate is null or cost_estimate >= 0),
  capacity_month numeric(18,2) check (capacity_month is null or capacity_month >= 0),
  capacity_unit text,
  icp_reference text,
  priority_offer boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_client_services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.business_clients(id) on delete cascade,
  service_id uuid not null references public.business_services(id) on delete cascade,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'PAUSED', 'ENDED')),
  starts_on date,
  ends_on date,
  agreed_price numeric(18,2) check (agreed_price is null or agreed_price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, service_id, starts_on)
);

create table if not exists public.business_income_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entry_date date not null,
  client_id uuid references public.business_clients(id) on delete set null,
  service_id uuid references public.business_services(id) on delete set null,
  category text,
  description text not null,
  quantity numeric(18,4) not null default 1 check (quantity > 0),
  unit_price numeric(18,2) not null default 0 check (unit_price >= 0),
  discount numeric(18,2) not null default 0 check (discount >= 0),
  net_amount numeric(18,2) not null check (net_amount >= 0),
  status text not null default 'POSTED' check (status in ('DRAFT', 'POSTED', 'VOIDED')),
  payment_status text not null default 'PENDING'
    check (payment_status in ('PENDING', 'COLLECTED', 'OVERDUE', 'CANCELED')),
  payment_channel text,
  external_source text,
  external_id text,
  source_activity_id uuid,
  created_by uuid references public.profiles(id),
  voided_at timestamptz,
  void_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (organization_id, external_source, external_id)
);

create table if not exists public.business_expense_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entry_date date not null,
  supplier text,
  expense_type text not null check (expense_type in ('FIXED', 'VARIABLE', 'MIXED')),
  category text not null,
  description text not null,
  gross_amount numeric(18,2) not null check (gross_amount > 0),
  allocation_type text not null default 'GENERAL'
    check (allocation_type in ('GENERAL', 'DIRECT_CLIENT', 'DIRECT_SERVICE', 'DISTRIBUTED')),
  status text not null default 'POSTED' check (status in ('DRAFT', 'POSTED', 'VOIDED')),
  payment_status text not null default 'PENDING'
    check (payment_status in ('PENDING', 'PAID', 'OVERDUE', 'CANCELED')),
  external_source text,
  external_id text,
  source_activity_id uuid,
  created_by uuid references public.profiles(id),
  voided_at timestamptz,
  void_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (organization_id, external_source, external_id)
);

create table if not exists public.business_expense_allocations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  expense_id uuid not null references public.business_expense_entries(id) on delete cascade,
  client_id uuid references public.business_clients(id) on delete set null,
  service_id uuid references public.business_services(id) on delete set null,
  percentage numeric(7,4) check (percentage is null or percentage between 0 and 100),
  allocated_amount numeric(18,2) not null check (allocated_amount > 0),
  allocation_basis text not null default 'DIRECT'
    check (allocation_basis in ('DIRECT', 'HOURS', 'UNITS', 'REVENUE_SHARE', 'MANUAL')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (client_id is not null or service_id is not null)
);

create table if not exists public.business_financial_periods (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  starts_on date not null,
  ends_on date not null,
  status text not null default 'OPEN' check (status in ('OPEN', 'LOCKED')),
  opening_balance numeric(18,2) not null default 0,
  snapshot_version integer not null default 0 check (snapshot_version >= 0),
  locked_by uuid references public.profiles(id),
  locked_at timestamptz,
  reopened_by uuid references public.profiles(id),
  reopened_at timestamptz,
  reopen_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on),
  unique (organization_id, starts_on, ends_on)
);

create table if not exists public.business_budgets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  period_id uuid not null references public.business_financial_periods(id) on delete cascade,
  category text not null,
  budget_amount numeric(18,2) not null check (budget_amount >= 0),
  owner_user_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (period_id, category)
);

create table if not exists public.business_objectives (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  objective_type text not null default 'OPERATIONAL'
    check (objective_type in ('FINANCIAL', 'OPERATIONAL', 'FOUNDER', 'COMMERCIAL', 'STRATEGIC')),
  title text not null,
  owner_user_id uuid references public.profiles(id),
  due_on date,
  status text not null default 'ON_TRACK'
    check (status in ('DRAFT', 'ON_TRACK', 'AT_RISK', 'OFF_TRACK', 'ACHIEVED', 'PAUSED', 'CANCELED')),
  source text not null default 'MANUAL'
    check (source in ('MANUAL', 'CONTROL_METHOD', 'PROCESS', 'MEETING', 'ALERT')),
  source_activity_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_objective_checkpoints (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  objective_id uuid not null references public.business_objectives(id) on delete cascade,
  position smallint not null check (position between 1 and 30),
  title text not null,
  completed boolean not null default false,
  completed_at timestamptz,
  completed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (objective_id, position)
);

create table if not exists public.business_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  objective_id uuid references public.business_objectives(id) on delete set null,
  process_id uuid,
  title text not null,
  assigned_to uuid references public.profiles(id),
  priority smallint not null default 2 check (priority between 1 and 3),
  due_at timestamptz,
  status text not null default 'TODO'
    check (status in ('TODO', 'IN_PROGRESS', 'REVIEW', 'BLOCKED', 'DONE', 'CANCELED')),
  source text not null default 'MANUAL'
    check (source in ('MANUAL', 'CONTROL_METHOD', 'PROCESS', 'MEETING', 'ALERT')),
  source_activity_id uuid,
  evidence_required boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_processes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  process_level text not null default 'PROCESS'
    check (process_level in ('MACRO', 'PROCESS', 'SUBPROCESS')),
  owner_user_id uuid references public.profiles(id),
  trigger_input text,
  expected_output text,
  sla_text text,
  kpi_definition_id uuid references public.kpi_definitions(id) on delete set null,
  status text not null default 'DRAFT'
    check (status in ('DRAFT', 'ACTIVE', 'REVIEW', 'ARCHIVED')),
  current_version integer not null default 1 check (current_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $migration$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'business_tasks_process_id_fkey'
      and conrelid = 'public.business_tasks'::regclass
  ) then
    alter table public.business_tasks
    add constraint business_tasks_process_id_fkey
    foreign key (process_id) references public.business_processes(id) on delete set null;
  end if;
end
$migration$;

create table if not exists public.business_sops (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  process_id uuid not null references public.business_processes(id) on delete cascade,
  title text not null,
  version integer not null check (version > 0),
  status text not null default 'DRAFT'
    check (status in ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED')),
  objective text,
  roles jsonb not null default '[]'::jsonb,
  preconditions jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  exceptions jsonb not null default '[]'::jsonb,
  exit_criteria text,
  approved_by uuid references public.profiles(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (process_id, version)
);

create table if not exists public.business_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  resource_type text not null,
  resource_id uuid,
  period_id uuid references public.business_financial_periods(id) on delete set null,
  payload jsonb not null,
  content_hash text not null,
  source_counts jsonb not null default '{}'::jsonb,
  generated_by uuid references public.profiles(id),
  generated_at timestamptz not null default now(),
  unique (organization_id, content_hash)
);

create table if not exists public.business_evidence_references (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_activity_id uuid,
  business_resource_type text not null,
  business_resource_id uuid not null,
  snapshot_id uuid references public.business_snapshots(id) on delete set null,
  validation_status text not null default 'PENDING'
    check (validation_status in ('PENDING', 'VALIDATED', 'REJECTED')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.business_exports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  export_type text not null,
  filters jsonb not null default '{}'::jsonb,
  status text not null default 'QUEUED'
    check (status in ('QUEUED', 'RUNNING', 'READY', 'FAILED', 'EXPIRED')),
  storage_path text,
  error_code text,
  requested_by uuid references public.profiles(id),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_integration_events (
  event_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_type text not null,
  contract_version integer not null default 1 check (contract_version > 0),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'PENDING' check (status in ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED')),
  correlation_id uuid not null default gen_random_uuid(),
  available_at timestamptz not null default now(),
  processed_at timestamptz,
  attempts integer not null default 0 check (attempts >= 0),
  last_error_code text,
  created_at timestamptz not null default now()
);

create table if not exists app_private.business_sso_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  user_id uuid not null references public.profiles(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  state_hash text not null,
  nonce_hash text not null,
  redirect_uri text not null,
  return_url text,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function app_private.validate_business_allocation_total()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_expense uuid;
  allowed_amount numeric(18,2);
  allocated_amount numeric(18,2);
begin
  if tg_op = 'DELETE' then
    target_expense := old.expense_id;
  else
    target_expense := new.expense_id;
  end if;
  select e.gross_amount into allowed_amount
  from public.business_expense_entries e where e.id = target_expense;

  select coalesce(sum(a.allocated_amount), 0) into allocated_amount
  from public.business_expense_allocations a where a.expense_id = target_expense;

  if allocated_amount > allowed_amount then
    raise exception 'Expense allocations exceed gross amount';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function app_private.prevent_locked_period_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_org uuid;
  target_date date;
begin
  if tg_op = 'DELETE' then
    target_org := old.organization_id;
    target_date := old.entry_date;
  else
    target_org := new.organization_id;
    target_date := new.entry_date;
  end if;
  if exists (
    select 1 from public.business_financial_periods p
    where p.organization_id = target_org
      and p.status = 'LOCKED'
      and target_date between p.starts_on and p.ends_on
  ) then
    raise exception 'Financial period is locked';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function app_private.protect_business_snapshot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'Business snapshots are immutable';
end;
$$;

create or replace function app_private.audit_business_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_org uuid;
  target_id text;
begin
  if tg_op = 'DELETE' then
    target_org := old.organization_id;
    target_id := old.id::text;
  else
    target_org := new.organization_id;
    target_id := new.id::text;
  end if;
  insert into public.audit_events (
    organization_id, actor_id, event_type, entity_type, entity_id, payload
  ) values (
    target_org,
    auth.uid(),
    upper(tg_table_name || '_' || tg_op),
    tg_table_name,
    target_id,
    jsonb_build_object('operation', tg_op)
  );
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create index if not exists business_staff_access_org_idx on public.business_staff_access(organization_id, staff_user_id);
create index if not exists business_clients_org_status_idx on public.business_clients(organization_id, status);
create index if not exists business_services_org_status_idx on public.business_services(organization_id, status);
create index if not exists business_income_org_date_idx on public.business_income_entries(organization_id, entry_date desc);
create index if not exists business_expense_org_date_idx on public.business_expense_entries(organization_id, entry_date desc);
create index if not exists business_allocations_expense_idx on public.business_expense_allocations(expense_id);
create index if not exists business_allocations_client_idx on public.business_expense_allocations(organization_id, client_id);
create index if not exists business_allocations_service_idx on public.business_expense_allocations(organization_id, service_id);
create index if not exists business_objectives_org_idx on public.business_objectives(organization_id, status, due_on);
create index if not exists business_tasks_org_idx on public.business_tasks(organization_id, status, due_at);
create index if not exists business_processes_org_idx on public.business_processes(organization_id, status);
create index if not exists business_events_pending_idx on public.business_integration_events(status, available_at);
create index if not exists business_sso_codes_expiry_idx on app_private.business_sso_codes(expires_at) where used_at is null;

do $migration$
declare
  table_name text;
begin
  foreach table_name in array array[
    'business_staff_access', 'business_workspaces', 'business_clients',
    'business_services', 'business_client_services', 'business_income_entries',
    'business_expense_entries', 'business_expense_allocations',
    'business_financial_periods', 'business_budgets', 'business_objectives',
    'business_objective_checkpoints', 'business_tasks', 'business_processes',
    'business_sops', 'business_exports'
  ] loop
    if not exists (
      select 1 from pg_trigger
      where tgname = 'touch_' || table_name || '_updated_at'
        and tgrelid = ('public.' || table_name)::regclass
    ) then
      execute format(
        'create trigger touch_%1$s_updated_at before update on public.%1$I for each row execute function app_private.touch_updated_at()',
        table_name
      );
    end if;
  end loop;

  if not exists (select 1 from pg_trigger where tgname = 'validate_business_allocation_total') then
    create constraint trigger validate_business_allocation_total
    after insert or update or delete on public.business_expense_allocations
    deferrable initially deferred
    for each row execute function app_private.validate_business_allocation_total();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'lock_business_income_period') then
    create trigger lock_business_income_period
    before insert or update or delete on public.business_income_entries
    for each row execute function app_private.prevent_locked_period_change();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'lock_business_expense_period') then
    create trigger lock_business_expense_period
    before insert or update or delete on public.business_expense_entries
    for each row execute function app_private.prevent_locked_period_change();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'protect_business_snapshot') then
    create trigger protect_business_snapshot
    before update or delete on public.business_snapshots
    for each row execute function app_private.protect_business_snapshot();
  end if;

  foreach table_name in array array[
    'business_income_entries', 'business_expense_entries',
    'business_expense_allocations', 'business_financial_periods',
    'business_staff_access'
  ] loop
    if not exists (
      select 1 from pg_trigger
      where tgname = 'audit_' || table_name
        and tgrelid = ('public.' || table_name)::regclass
    ) then
      execute format(
        'create trigger audit_%1$s after insert or update or delete on public.%1$I for each row execute function app_private.audit_business_change()',
        table_name
      );
    end if;
  end loop;
end
$migration$;

do $migration$
declare
  table_name text;
begin
  foreach table_name in array array[
    'business_staff_access', 'business_workspaces', 'business_clients',
    'business_services', 'business_client_services', 'business_income_entries',
    'business_expense_entries', 'business_expense_allocations',
    'business_financial_periods', 'business_budgets', 'business_objectives',
    'business_objective_checkpoints', 'business_tasks', 'business_processes',
    'business_sops', 'business_snapshots', 'business_evidence_references',
    'business_exports', 'business_integration_events'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end
$migration$;

do $migration$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_staff_access_read') then
    create policy business_staff_access_read on public.business_staff_access for select to authenticated
    using (staff_user_id = auth.uid() or app_private.can_manage_business(organization_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_staff_access_manage') then
    create policy business_staff_access_manage on public.business_staff_access for all to authenticated
    using (app_private.can_manage_business(organization_id))
    with check (app_private.can_manage_business(organization_id));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_workspaces_read') then
    create policy business_workspaces_read on public.business_workspaces for select to authenticated
    using (app_private.belongs_to(organization_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_workspaces_manage') then
    create policy business_workspaces_manage on public.business_workspaces for all to authenticated
    using (app_private.has_business_scope(organization_id, 'business_admin'))
    with check (app_private.has_business_scope(organization_id, 'business_admin'));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_clients_read') then
    create policy business_clients_read on public.business_clients for select to authenticated
    using (app_private.belongs_to(organization_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_clients_manage') then
    create policy business_clients_manage on public.business_clients for all to authenticated
    using (app_private.can_manage_business(organization_id))
    with check (app_private.can_manage_business(organization_id));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_services_read') then
    create policy business_services_read on public.business_services for select to authenticated
    using (app_private.belongs_to(organization_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_services_manage') then
    create policy business_services_manage on public.business_services for all to authenticated
    using (app_private.can_manage_business(organization_id))
    with check (app_private.can_manage_business(organization_id));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_client_services_read') then
    create policy business_client_services_read on public.business_client_services for select to authenticated
    using (app_private.belongs_to(organization_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_client_services_manage') then
    create policy business_client_services_manage on public.business_client_services for all to authenticated
    using (app_private.can_manage_business(organization_id))
    with check (app_private.can_manage_business(organization_id));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_income_read') then
    create policy business_income_read on public.business_income_entries for select to authenticated
    using (app_private.has_business_scope(organization_id, 'finance_read'));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_income_manage') then
    create policy business_income_manage on public.business_income_entries for all to authenticated
    using (app_private.has_business_scope(organization_id, 'finance_write'))
    with check (app_private.has_business_scope(organization_id, 'finance_write'));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_expense_read') then
    create policy business_expense_read on public.business_expense_entries for select to authenticated
    using (app_private.has_business_scope(organization_id, 'finance_read'));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_expense_manage') then
    create policy business_expense_manage on public.business_expense_entries for all to authenticated
    using (app_private.has_business_scope(organization_id, 'finance_write'))
    with check (app_private.has_business_scope(organization_id, 'finance_write'));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_allocations_read') then
    create policy business_allocations_read on public.business_expense_allocations for select to authenticated
    using (app_private.has_business_scope(organization_id, 'finance_read'));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_allocations_manage') then
    create policy business_allocations_manage on public.business_expense_allocations for all to authenticated
    using (app_private.has_business_scope(organization_id, 'finance_write'))
    with check (app_private.has_business_scope(organization_id, 'finance_write'));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_periods_read') then
    create policy business_periods_read on public.business_financial_periods for select to authenticated
    using (app_private.has_business_scope(organization_id, 'finance_read'));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_periods_manage') then
    create policy business_periods_manage on public.business_financial_periods for all to authenticated
    using (app_private.has_business_scope(organization_id, 'finance_write'))
    with check (app_private.has_business_scope(organization_id, 'finance_write'));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_budgets_read') then
    create policy business_budgets_read on public.business_budgets for select to authenticated
    using (app_private.has_business_scope(organization_id, 'finance_read'));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_budgets_manage') then
    create policy business_budgets_manage on public.business_budgets for all to authenticated
    using (app_private.has_business_scope(organization_id, 'finance_write'))
    with check (app_private.has_business_scope(organization_id, 'finance_write'));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_objectives_read') then
    create policy business_objectives_read on public.business_objectives for select to authenticated
    using (app_private.belongs_to(organization_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_objectives_manage') then
    create policy business_objectives_manage on public.business_objectives for all to authenticated
    using (app_private.can_manage_business(organization_id))
    with check (app_private.can_manage_business(organization_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_objective_checkpoints_read') then
    create policy business_objective_checkpoints_read on public.business_objective_checkpoints for select to authenticated
    using (app_private.belongs_to(organization_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_objective_checkpoints_manage') then
    create policy business_objective_checkpoints_manage on public.business_objective_checkpoints for all to authenticated
    using (app_private.can_manage_business(organization_id))
    with check (app_private.can_manage_business(organization_id));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_tasks_read') then
    create policy business_tasks_read on public.business_tasks for select to authenticated
    using (app_private.belongs_to(organization_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_tasks_manage') then
    create policy business_tasks_manage on public.business_tasks for all to authenticated
    using (app_private.can_manage_business(organization_id) or assigned_to = auth.uid())
    with check (app_private.can_manage_business(organization_id) or assigned_to = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_processes_read') then
    create policy business_processes_read on public.business_processes for select to authenticated
    using (app_private.belongs_to(organization_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_processes_manage') then
    create policy business_processes_manage on public.business_processes for all to authenticated
    using (app_private.can_manage_business(organization_id))
    with check (app_private.can_manage_business(organization_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_sops_read') then
    create policy business_sops_read on public.business_sops for select to authenticated
    using (app_private.belongs_to(organization_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_sops_manage') then
    create policy business_sops_manage on public.business_sops for all to authenticated
    using (app_private.can_manage_business(organization_id))
    with check (app_private.can_manage_business(organization_id));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_snapshots_read') then
    create policy business_snapshots_read on public.business_snapshots for select to authenticated
    using (app_private.has_business_scope(organization_id, 'finance_read'));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_snapshots_create') then
    create policy business_snapshots_create on public.business_snapshots for insert to authenticated
    with check (app_private.has_business_scope(organization_id, 'finance_write'));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_evidence_references_read') then
    create policy business_evidence_references_read on public.business_evidence_references for select to authenticated
    using (app_private.belongs_to(organization_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_evidence_references_manage') then
    create policy business_evidence_references_manage on public.business_evidence_references for all to authenticated
    using (app_private.can_manage_business(organization_id))
    with check (app_private.can_manage_business(organization_id));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_exports_read') then
    create policy business_exports_read on public.business_exports for select to authenticated
    using (requested_by = auth.uid() or app_private.has_business_scope(organization_id, 'finance_read'));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_exports_create') then
    create policy business_exports_create on public.business_exports for insert to authenticated
    with check (requested_by = auth.uid() and app_private.belongs_to(organization_id));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'business_events_read') then
    create policy business_events_read on public.business_integration_events for select to authenticated
    using (app_private.has_business_scope(organization_id, 'business_admin'));
  end if;
end
$migration$;

grant execute on function app_private.has_business_scope(uuid, text) to authenticated;
grant execute on function app_private.can_manage_business(uuid) to authenticated;
grant select, insert, update, delete on
  public.business_staff_access,
  public.business_workspaces,
  public.business_clients,
  public.business_services,
  public.business_client_services,
  public.business_income_entries,
  public.business_expense_entries,
  public.business_expense_allocations,
  public.business_financial_periods,
  public.business_budgets,
  public.business_objectives,
  public.business_objective_checkpoints,
  public.business_tasks,
  public.business_processes,
  public.business_sops,
  public.business_snapshots,
  public.business_evidence_references,
  public.business_exports
to authenticated;

revoke all on app_private.business_sso_codes from anon, authenticated;
revoke all on public.business_integration_events from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit)
values ('control-business-files', 'control-business-files', false, 26214400)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

do $migration$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and policyname = 'business_files_read') then
    create policy business_files_read on storage.objects for select to authenticated
    using (
      bucket_id = 'control-business-files'
      and app_private.belongs_to((storage.foldername(name))[1]::uuid)
    );
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and policyname = 'business_files_manage') then
    create policy business_files_manage on storage.objects for all to authenticated
    using (
      bucket_id = 'control-business-files'
      and app_private.can_manage_business((storage.foldername(name))[1]::uuid)
    )
    with check (
      bucket_id = 'control-business-files'
      and app_private.can_manage_business((storage.foldername(name))[1]::uuid)
    );
  end if;
end
$migration$;

insert into public.entitlements (plan_version_id, key, enabled, limit_value, config)
select
  pv.id,
  seed.key,
  seed.enabled,
  seed.limit_value,
  seed.config
from public.plan_versions pv
join public.plans p on p.id = pv.plan_id
cross join lateral (
  values
    ('BUSINESS_ACCESS', p.code <> 'CONTROL-START', null::integer, '{}'::jsonb),
    ('BUSINESS_FINANCE', p.code <> 'CONTROL-START', null::integer, '{}'::jsonb),
    ('BUSINESS_PROCESSES', p.code = 'CONTROL-SCALE', null::integer, '{}'::jsonb),
    ('BUSINESS_TEAM', p.code = 'CONTROL-SCALE', null::integer, '{}'::jsonb),
    ('BUSINESS_EXPORTS', p.code <> 'CONTROL-START', null::integer, '{"formats":["csv","json","pdf"]}'::jsonb)
) as seed(key, enabled, limit_value, config)
on conflict (plan_version_id, key) do update
set enabled = excluded.enabled,
    limit_value = excluded.limit_value,
    config = excluded.config;

alter table public.profiles disable trigger protect_profile_role;

update public.profiles p
set username = 'aldaircrizam'
from auth.users u
where p.id = u.id
  and lower(u.email) = 'admin@crisdalcompany.com'
  and p.username is distinct from 'aldaircrizam'
  and not exists (
    select 1 from public.profiles existing
    where lower(existing.username) = 'aldaircrizam'
      and existing.id <> p.id
  );

alter table public.profiles enable trigger protect_profile_role;

comment on table public.business_workspaces is 'One Business OS workspace per global CONTROL organization.';
comment on table public.business_expense_allocations is 'Direct or distributed cost attribution used for client and service profitability.';
comment on table public.business_snapshots is 'Immutable evidence snapshots referenced by CONTROL OS gates.';
comment on table app_private.business_sso_codes is 'Hashed, one-time SSO launch codes; server access only.';
comment on table public.business_objective_checkpoints is 'Binary checkpoints; progress is derived and never manually entered.';
