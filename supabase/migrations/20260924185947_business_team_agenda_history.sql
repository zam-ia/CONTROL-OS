-- Historical team costs, company agenda assignments and position documents.
-- Additive only: ended collaborators and their related records are preserved.

alter table public.business_team_members
  add column if not exists hired_on date,
  add column if not exists ended_on date,
  add column if not exists termination_reason text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'business_team_members_employment_dates_check'
      and conrelid = 'public.business_team_members'::regclass
  ) then
    alter table public.business_team_members
      add constraint business_team_members_employment_dates_check
      check (ended_on is null or hired_on is null or ended_on >= hired_on);
  end if;
end $$;

create table if not exists public.business_team_cost_periods (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  team_member_id uuid not null references public.business_team_members(id) on delete restrict,
  starts_on date not null,
  ends_on date,
  monthly_cost numeric(18,2) not null check (monthly_cost >= 0),
  modality text not null check (modality in ('payroll', 'contractor', 'freelance')),
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_on is null or ends_on >= starts_on),
  unique (team_member_id, starts_on)
);

create unique index if not exists business_team_cost_periods_one_open_idx
  on public.business_team_cost_periods(team_member_id)
  where ends_on is null;

create index if not exists business_team_cost_periods_org_dates_idx
  on public.business_team_cost_periods(organization_id, starts_on desc, ends_on);

insert into public.business_team_cost_periods (
  organization_id,
  team_member_id,
  starts_on,
  monthly_cost,
  modality,
  notes
)
select
  member.organization_id,
  member.id,
  coalesce(member.hired_on, member.created_at::date),
  member.monthly_cost,
  member.modality,
  'Periodo inicial creado al habilitar el historial de costos.'
from public.business_team_members member
where member.monthly_cost is not null
  and member.modality is not null
  and not exists (
    select 1
    from public.business_team_cost_periods period
    where period.team_member_id = member.id
  );

alter table public.tasks
  add column if not exists business_team_member_id uuid references public.business_team_members(id) on delete set null,
  add column if not exists business_position_id uuid references public.business_positions(id) on delete set null,
  add column if not exists alert_minutes integer not null default 0,
  add column if not exists task_category text not null default 'other';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'tasks_alert_minutes_check'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks add constraint tasks_alert_minutes_check
      check (alert_minutes between 0 and 10080);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'tasks_task_category_check'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks add constraint tasks_task_category_check
      check (task_category in ('visit', 'operations', 'recording', 'sales', 'admin', 'other'));
  end if;
end $$;

create index if not exists tasks_business_team_member_due_idx
  on public.tasks(business_team_member_id, due_at)
  where canceled_at is null;

create index if not exists tasks_business_position_due_idx
  on public.tasks(business_position_id, due_at)
  where canceled_at is null;

alter table public.calendar_events
  add column if not exists description text,
  add column if not exists location text,
  add column if not exists alert_minutes integer not null default 0,
  add column if not exists business_team_member_id uuid references public.business_team_members(id) on delete set null,
  add column if not exists position_id uuid references public.business_positions(id) on delete set null,
  add column if not exists business_client_id uuid references public.business_clients(id) on delete set null,
  add column if not exists status text not null default 'scheduled';

alter table public.calendar_events
  drop constraint if exists calendar_events_event_type_check;

alter table public.calendar_events
  add constraint calendar_events_event_type_check
  check (event_type in (
    'meeting', 'program', 'collection', 'deadline', 'visit', 'operation',
    'recording', 'other'
  ));

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'calendar_events_alert_minutes_check'
      and conrelid = 'public.calendar_events'::regclass
  ) then
    alter table public.calendar_events add constraint calendar_events_alert_minutes_check
      check (alert_minutes between 0 and 10080);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'calendar_events_status_check'
      and conrelid = 'public.calendar_events'::regclass
  ) then
    alter table public.calendar_events add constraint calendar_events_status_check
      check (status in ('scheduled', 'done', 'canceled'));
  end if;
end $$;

create index if not exists calendar_events_team_starts_idx
  on public.calendar_events(business_team_member_id, starts_at)
  where status <> 'canceled';

create index if not exists calendar_events_position_starts_idx
  on public.calendar_events(position_id, starts_at)
  where status <> 'canceled';

create table if not exists public.business_position_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  position_id uuid not null references public.business_positions(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  mime_type text,
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes between 1 and 10485760),
  version integer not null default 1 check (version > 0),
  active boolean not null default true,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (position_id, version)
);

create index if not exists business_position_documents_org_position_idx
  on public.business_position_documents(organization_id, position_id, active);

alter table public.business_team_cost_periods enable row level security;
alter table public.business_position_documents enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and policyname = 'business_team_cost_periods_tenant_read'
  ) then
    create policy business_team_cost_periods_tenant_read
      on public.business_team_cost_periods for select to authenticated
      using ((select app_private.belongs_to(organization_id)));
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and policyname = 'business_team_cost_periods_tenant_manage'
  ) then
    create policy business_team_cost_periods_tenant_manage
      on public.business_team_cost_periods for all to authenticated
      using ((select app_private.can_manage(organization_id)))
      with check ((select app_private.can_manage(organization_id)));
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and policyname = 'business_position_documents_tenant_read'
  ) then
    create policy business_position_documents_tenant_read
      on public.business_position_documents for select to authenticated
      using ((select app_private.belongs_to(organization_id)));
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and policyname = 'business_position_documents_tenant_manage'
  ) then
    create policy business_position_documents_tenant_manage
      on public.business_position_documents for all to authenticated
      using ((select app_private.can_manage(organization_id)))
      with check ((select app_private.can_manage(organization_id)));
  end if;
end $$;

revoke all on public.business_team_cost_periods from anon;
revoke all on public.business_position_documents from anon;
grant select, insert, update, delete on public.business_team_cost_periods to authenticated;
grant select, insert, update, delete on public.business_position_documents to authenticated;

comment on table public.business_team_cost_periods is
  'Immutable employment cost periods used to preserve historical fixed personnel costs after changes or termination.';
comment on column public.business_team_members.ended_on is
  'Last employment date. Ending a collaborator never deletes related finance, tasks, calendar or KPI history.';
comment on table public.business_position_documents is
  'Versioned position-profile documents stored in the private business-files bucket.';
