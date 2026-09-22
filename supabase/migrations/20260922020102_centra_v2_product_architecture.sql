-- CENTRA v2 product architecture
-- Additive migration: preserves CONTROL method history and legacy routes/tables.

create schema if not exists app_private;

create table if not exists public.centra_feature_flags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  flag_key text not null,
  enabled boolean not null default false,
  rollout_percentage smallint not null default 0 check (rollout_percentage between 0 and 100),
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (organization_id, flag_key)
);

alter table public.tasks add column if not exists origin text not null default 'program';
alter table public.tasks add column if not exists supervisor_id uuid references public.profiles(id) on delete set null;
alter table public.tasks add column if not exists starts_at timestamptz;
alter table public.tasks add column if not exists process_id uuid references public.business_processes(id) on delete set null;
alter table public.tasks add column if not exists business_client_id uuid references public.business_clients(id) on delete set null;
alter table public.tasks add column if not exists intervention_id uuid;
alter table public.tasks add column if not exists recurring_template_id uuid references public.tasks(id) on delete set null;
alter table public.tasks add column if not exists recurrence_rule jsonb;
alter table public.tasks add column if not exists evidence_required boolean not null default false;
alter table public.tasks add column if not exists review_state text not null default 'not_required';
alter table public.tasks add column if not exists canceled_at timestamptz;

do $migration$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'tasks_origin_check'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks add constraint tasks_origin_check check (
      origin in ('program', 'company', 'process', 'recurring_checklist', 'intervention')
    );
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'tasks_review_state_check'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks add constraint tasks_review_state_check check (
      review_state in ('not_required', 'pending', 'in_review', 'changes_requested', 'approved')
    );
  end if;
end
$migration$;

create table if not exists public.deliverables (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  enrollment_id uuid references public.enrollments(id) on delete cascade,
  week_id uuid references public.weeks(id) on delete set null,
  title text not null,
  instructions text,
  approval_criteria jsonb not null default '[]'::jsonb,
  required boolean not null default true,
  due_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'available', 'submitted', 'in_review', 'changes_requested', 'approved', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.evidence_submissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  deliverable_id uuid not null references public.deliverables(id) on delete cascade,
  version integer not null check (version > 0),
  submitted_by uuid not null references public.profiles(id) on delete restrict,
  response text,
  storage_paths text[] not null default '{}'::text[],
  status text not null default 'submitted' check (status in ('draft', 'submitted', 'in_review', 'changes_requested', 'approved')),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (deliverable_id, version)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  evidence_submission_id uuid not null references public.evidence_submissions(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete restrict,
  decision text not null check (decision in ('approved', 'changes_requested', 'commented')),
  feedback text not null,
  correction_due_at timestamptz,
  attachment_paths text[] not null default '{}'::text[],
  created_at timestamptz not null default now()
);

create table if not exists public.interventions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  enrollment_id uuid references public.enrollments(id) on delete cascade,
  evidence_submission_id uuid references public.evidence_submissions(id) on delete set null,
  cause text not null,
  signal jsonb not null default '{}'::jsonb,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  action text not null,
  commitment_at timestamptz,
  result text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'waiting_client', 'resolved', 'canceled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $migration$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'tasks_intervention_id_fkey'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks add constraint tasks_intervention_id_fkey
    foreign key (intervention_id) references public.interventions(id) on delete set null;
  end if;
end
$migration$;

create table if not exists public.control_score_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  enrollment_id uuid references public.enrollments(id) on delete cascade,
  score numeric(5,2) not null check (score between 0 and 100),
  health text not null check (health in ('in_control', 'attention', 'at_risk')),
  components jsonb not null,
  overrides jsonb not null default '[]'::jsonb,
  calculated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null
);

create table if not exists public.business_financial_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  account_type text not null check (account_type in ('cash', 'bank', 'digital_wallet', 'other')),
  currency char(3) not null default 'PEN',
  opening_balance numeric(18,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists public.business_financial_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  direction text not null check (direction in ('income', 'expense')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, direction, name)
);

create table if not exists public.business_invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.business_clients(id) on delete restrict,
  service_id uuid references public.business_services(id) on delete set null,
  invoice_number text,
  issued_on date not null,
  due_on date not null,
  currency char(3) not null default 'PEN',
  total numeric(18,2) not null check (total > 0),
  status text not null default 'pending' check (status in ('draft', 'pending', 'partial', 'paid', 'overdue', 'canceled')),
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (due_on >= issued_on),
  unique nulls not distinct (organization_id, invoice_number)
);

create table if not exists public.business_invoice_payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  invoice_id uuid not null references public.business_invoices(id) on delete cascade,
  account_id uuid references public.business_financial_accounts(id) on delete set null,
  paid_on date not null,
  amount numeric(18,2) not null check (amount > 0),
  reference text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.business_team_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text,
  status text not null default 'active' check (status in ('active', 'paused', 'ended')),
  monthly_cost numeric(18,2) check (monthly_cost is null or monthly_cost >= 0),
  modality text check (modality is null or modality in ('payroll', 'contractor', 'freelance')),
  supervisor_id uuid references public.business_team_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (organization_id, profile_id)
);

create table if not exists public.business_positions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  area text,
  purpose text not null,
  kpis jsonb not null default '[]'::jsonb,
  backup_position_id uuid references public.business_positions(id) on delete set null,
  status text not null default 'active' check (status in ('draft', 'active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists public.business_position_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  team_member_id uuid not null references public.business_team_members(id) on delete cascade,
  position_id uuid not null references public.business_positions(id) on delete cascade,
  starts_on date not null,
  ends_on date,
  scope text,
  created_at timestamptz not null default now(),
  check (ends_on is null or ends_on >= starts_on),
  unique (team_member_id, position_id, starts_on)
);

create table if not exists public.business_position_functions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  position_id uuid not null references public.business_positions(id) on delete cascade,
  position smallint not null check (position between 1 and 100),
  function_text text not null,
  completion_criteria text,
  process_id uuid references public.business_processes(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (position_id, position)
);

create table if not exists public.business_checklist_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  position_id uuid not null references public.business_positions(id) on delete cascade,
  name text not null,
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly', 'custom')),
  recurrence_rule jsonb,
  next_generation_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_checklist_template_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  template_id uuid not null references public.business_checklist_templates(id) on delete cascade,
  position smallint not null check (position between 1 and 100),
  task text not null,
  completion_criteria text not null,
  evidence_required boolean not null default false,
  priority text not null default 'normal' check (priority in ('critical', 'high', 'normal')),
  process_id uuid references public.business_processes(id) on delete set null,
  unique (template_id, position)
);

create table if not exists public.business_checklist_instances (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  template_id uuid not null references public.business_checklist_templates(id) on delete restrict,
  assignee_id uuid not null references public.business_team_members(id) on delete restrict,
  scheduled_for date not null,
  due_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'overdue', 'canceled')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (template_id, assignee_id, scheduled_for)
);

create table if not exists public.business_process_steps (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  process_id uuid not null references public.business_processes(id) on delete cascade,
  position smallint not null check (position between 1 and 500),
  action text not null,
  responsible_position_id uuid references public.business_positions(id) on delete set null,
  completion_criteria text not null,
  resource_url text,
  evidence_required boolean not null default false,
  automatable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (process_id, position)
);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  event_type text not null check (event_type in ('meeting', 'program', 'collection', 'deadline', 'other')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  owner_id uuid references public.profiles(id) on delete set null,
  related_entity text,
  related_entity_id uuid,
  external_provider text,
  external_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at),
  unique nulls not distinct (organization_id, external_provider, external_id)
);

create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  notification_type text not null check (notification_type in ('action_required', 'reminder', 'approval', 'changes_requested', 'risk', 'system')),
  title text not null,
  body text,
  destination text not null,
  deduplication_key text,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique nulls not distinct (recipient_id, deduplication_key)
);

create index if not exists tasks_org_origin_status_due_idx on public.tasks(organization_id, origin, status, due_at);
create index if not exists tasks_process_id_idx on public.tasks(process_id);
create index if not exists tasks_business_client_id_idx on public.tasks(business_client_id);
create index if not exists deliverables_org_status_due_idx on public.deliverables(organization_id, status, due_at);
create index if not exists evidence_submissions_org_deliverable_idx on public.evidence_submissions(organization_id, deliverable_id, version desc);
create index if not exists reviews_org_created_idx on public.reviews(organization_id, created_at desc);
create index if not exists interventions_org_status_priority_idx on public.interventions(organization_id, status, priority);
create index if not exists control_score_snapshots_org_calculated_idx on public.control_score_snapshots(organization_id, calculated_at desc);
create index if not exists business_invoices_org_status_due_idx on public.business_invoices(organization_id, status, due_on);
create index if not exists business_invoice_payments_invoice_idx on public.business_invoice_payments(invoice_id);
create index if not exists business_team_members_org_status_idx on public.business_team_members(organization_id, status);
create index if not exists business_position_assignments_position_idx on public.business_position_assignments(position_id);
create index if not exists business_checklist_instances_org_status_due_idx on public.business_checklist_instances(organization_id, status, due_at);
create index if not exists business_process_steps_process_idx on public.business_process_steps(process_id, position);
create index if not exists calendar_events_org_starts_idx on public.calendar_events(organization_id, starts_at);
create index if not exists task_comments_task_created_idx on public.task_comments(task_id, created_at);
create index if not exists notifications_recipient_read_created_idx on public.notifications(recipient_id, read_at, created_at desc);

do $migration$
declare
  target_table text;
begin
  foreach target_table in array array[
    'centra_feature_flags', 'deliverables', 'evidence_submissions', 'reviews',
    'interventions', 'control_score_snapshots', 'business_financial_accounts',
    'business_financial_categories', 'business_invoices', 'business_invoice_payments',
    'business_team_members', 'business_positions', 'business_position_assignments',
    'business_position_functions', 'business_checklist_templates',
    'business_checklist_template_items', 'business_checklist_instances',
    'business_process_steps', 'calendar_events', 'task_comments'
  ]
  loop
    execute format('alter table public.%I enable row level security', target_table);
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = target_table
        and policyname = target_table || '_tenant_read'
    ) then
      execute format(
        'create policy %I on public.%I for select to authenticated using ((select app_private.belongs_to(organization_id)))',
        target_table || '_tenant_read', target_table
      );
    end if;
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = target_table
        and policyname = target_table || '_tenant_manage'
    ) then
      execute format(
        'create policy %I on public.%I for all to authenticated using ((select app_private.can_manage(organization_id))) with check ((select app_private.can_manage(organization_id)))',
        target_table || '_tenant_manage', target_table
      );
    end if;
  end loop;
end
$migration$;

alter table public.notifications enable row level security;

do $migration$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public'
      and tablename = 'centra_feature_flags'
      and policyname = 'centra_feature_flags_global_read'
  ) then
    create policy centra_feature_flags_global_read
    on public.centra_feature_flags for select to authenticated
    using (organization_id is null);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public'
      and tablename = 'evidence_submissions'
      and policyname = 'evidence_submissions_member_insert'
  ) then
    create policy evidence_submissions_member_insert
    on public.evidence_submissions for insert to authenticated
    with check (
      (select app_private.belongs_to(organization_id))
      and submitted_by = (select auth.uid())
    );
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public'
      and tablename = 'task_comments'
      and policyname = 'task_comments_member_insert'
  ) then
    create policy task_comments_member_insert
    on public.task_comments for insert to authenticated
    with check (
      (select app_private.belongs_to(organization_id))
      and author_id = (select auth.uid())
    );
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public'
      and tablename = 'notifications'
      and policyname = 'notifications_recipient_read'
  ) then
    create policy notifications_recipient_read
    on public.notifications for select to authenticated
    using (
      recipient_id = (select auth.uid())
      or (select app_private.can_manage(organization_id))
    );
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public'
      and tablename = 'notifications'
      and policyname = 'notifications_manager_insert'
  ) then
    create policy notifications_manager_insert
    on public.notifications for insert to authenticated
    with check ((select app_private.can_manage(organization_id)));
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public'
      and tablename = 'notifications'
      and policyname = 'notifications_recipient_mark_read'
  ) then
    create policy notifications_recipient_mark_read
    on public.notifications for update to authenticated
    using (recipient_id = (select auth.uid()))
    with check (recipient_id = (select auth.uid()));
  end if;
end
$migration$;

grant select on table
  public.centra_feature_flags, public.deliverables, public.evidence_submissions,
  public.reviews, public.interventions, public.control_score_snapshots,
  public.business_financial_accounts, public.business_financial_categories,
  public.business_invoices, public.business_invoice_payments,
  public.business_team_members, public.business_positions,
  public.business_position_assignments, public.business_position_functions,
  public.business_checklist_templates, public.business_checklist_template_items,
  public.business_checklist_instances, public.business_process_steps,
  public.calendar_events, public.task_comments, public.notifications
to authenticated;

grant insert, update on table
  public.deliverables, public.evidence_submissions, public.reviews,
  public.interventions, public.business_financial_accounts,
  public.business_financial_categories, public.business_invoices,
  public.business_invoice_payments, public.business_team_members,
  public.business_positions, public.business_position_assignments,
  public.business_position_functions, public.business_checklist_templates,
  public.business_checklist_template_items, public.business_checklist_instances,
  public.business_process_steps, public.calendar_events, public.task_comments
to authenticated;

grant insert on table public.notifications to authenticated;
grant update (read_at) on table public.notifications to authenticated;

insert into public.centra_feature_flags (organization_id, flag_key, enabled, rollout_percentage, config)
values
  (null, 'centra_brand', true, 100, '{"legacy_brand":"CONTROL OS"}'::jsonb),
  (null, 'centra_navigation_v2', true, 100, '{"preserve_legacy_routes":true}'::jsonb),
  (null, 'centra_unified_tasks', false, 0, '{"shadow_legacy_business_tasks":true}'::jsonb),
  (null, 'centra_live_supabase_data', false, 0, '{"requires_verified_auth_and_rls":true}'::jsonb)
on conflict (organization_id, flag_key) do update
set enabled = excluded.enabled,
    rollout_percentage = excluded.rollout_percentage,
    config = excluded.config,
    updated_at = now();

comment on table public.centra_feature_flags is 'Incremental CENTRA rollout controls. Legacy tables and routes remain until equivalence is verified.';
comment on column public.tasks.origin is 'Canonical task origin: program, company, process, recurring_checklist, or intervention.';
comment on table public.control_score_snapshots is 'Explainable immutable score snapshots; UI reads components instead of recalculating full history.';
