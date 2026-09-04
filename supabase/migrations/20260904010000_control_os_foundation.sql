-- CONTROL OS · Supabase foundation
-- Safe to commit: this migration contains no credentials.

create extension if not exists pgcrypto;
create schema if not exists app_private;

create type public.global_role as enum ('CLIENT', 'COACH', 'OPERATOR', 'ADMIN', 'SUPER_ADMIN');
create type public.member_role as enum ('OWNER', 'MANAGER', 'MEMBER', 'VIEWER');
create type public.record_status as enum ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED', 'CANCELLED');
create type public.task_status as enum ('PENDING', 'IN_PROGRESS', 'BLOCKED', 'DONE');
create type public.data_visibility as enum ('PUBLIC', 'INTERNAL', 'OWNER_ONLY');

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  status public.record_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plan_versions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  version integer not null check (version > 0),
  duration_weeks integer not null default 12 check (duration_weeks > 0),
  price_amount numeric(12,2),
  currency char(3) default 'USD',
  status public.record_status not null default 'ACTIVE',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_id, version)
);

create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  plan_version_id uuid not null references public.plan_versions(id) on delete cascade,
  key text not null,
  enabled boolean not null default true,
  limit_value integer,
  config jsonb not null default '{}'::jsonb,
  unique (plan_version_id, key)
);

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  status public.record_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stages (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  position integer not null check (position > 0),
  name text not null,
  description text,
  unique (program_id, position)
);

create table public.weeks (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.stages(id) on delete cascade,
  week_number integer not null check (week_number between 1 and 52),
  title text not null,
  objective text,
  content jsonb not null default '{}'::jsonb,
  unique (stage_id, week_number)
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  country_code char(2),
  timezone text not null default 'America/Lima',
  status public.record_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  global_role public.global_role not null default 'CLIENT',
  locale text not null default 'es',
  timezone text not null default 'America/Lima',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'MEMBER',
  status public.record_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  plan_version_id uuid not null references public.plan_versions(id),
  program_id uuid not null references public.programs(id),
  coach_id uuid references public.profiles(id),
  starts_on date not null,
  current_week integer not null default 1 check (current_week between 1 and 52),
  status public.record_status not null default 'ACTIVE',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  enrollment_id uuid references public.enrollments(id) on delete cascade,
  week_id uuid references public.weeks(id),
  title text not null,
  description text,
  status public.task_status not null default 'PENDING',
  priority smallint not null default 2 check (priority between 1 and 3),
  assigned_to uuid references public.profiles(id),
  due_at timestamptz,
  completed_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.evidences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id),
  storage_path text not null unique,
  file_name text not null,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  notes text,
  created_at timestamptz not null default now()
);

create table public.kpi_definitions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  code text not null,
  name text not null,
  unit text not null,
  direction text not null default 'UP' check (direction in ('UP', 'DOWN', 'NEUTRAL')),
  visibility public.data_visibility not null default 'PUBLIC',
  target_value numeric,
  status public.record_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  unique nulls not distinct (organization_id, code)
);

create table public.kpi_values (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  kpi_definition_id uuid not null references public.kpi_definitions(id) on delete cascade,
  period_start date not null,
  value numeric not null,
  evidence_url text,
  recorded_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, kpi_definition_id, period_start)
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  enrollment_id uuid references public.enrollments(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  owner_id uuid references public.profiles(id),
  visibility public.data_visibility not null default 'PUBLIC',
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  organization_id uuid references public.organizations(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  entity_type text not null,
  entity_id text,
  payload jsonb not null default '{}'::jsonb,
  ip inet,
  created_at timestamptz not null default now()
);

create index memberships_user_idx on public.memberships(user_id, status);
create index enrollments_org_idx on public.enrollments(organization_id, status);
create index tasks_org_status_idx on public.tasks(organization_id, status);
create index tasks_assignee_idx on public.tasks(assigned_to, status);
create index kpi_values_org_period_idx on public.kpi_values(organization_id, period_start desc);
create index notes_org_created_idx on public.notes(organization_id, created_at desc);
create index audit_events_org_created_idx on public.audit_events(organization_id, created_at desc);

create or replace function app_private.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function app_private.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.global_role in ('COACH', 'OPERATOR', 'ADMIN', 'SUPER_ADMIN')
  );
$$;

create or replace function app_private.belongs_to(target_org uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select app_private.is_staff() or exists (
    select 1 from public.memberships m
    where m.organization_id = target_org
      and m.user_id = auth.uid()
      and m.status = 'ACTIVE'
  );
$$;

create or replace function app_private.can_manage(target_org uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select app_private.is_staff() or exists (
    select 1 from public.memberships m
    where m.organization_id = target_org
      and m.user_id = auth.uid()
      and m.status = 'ACTIVE'
      and m.role in ('OWNER', 'MANAGER')
  );
$$;

create or replace function app_private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', new.email));
  return new;
end;
$$;

create or replace function app_private.protect_profile_role()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.global_role is distinct from old.global_role and not app_private.is_staff() then
    raise exception 'Only staff can change global roles';
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function app_private.handle_new_user();

create trigger protect_profile_role
before update on public.profiles
for each row execute function app_private.protect_profile_role();

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'plans', 'plan_versions', 'programs', 'organizations', 'profiles',
    'memberships', 'enrollments', 'tasks', 'kpi_values', 'notes'
  ] loop
    execute format(
      'create trigger touch_%1$s_updated_at before update on public.%1$I for each row execute function app_private.touch_updated_at()',
      table_name
    );
  end loop;
end $$;

alter table public.plans enable row level security;
alter table public.plan_versions enable row level security;
alter table public.entitlements enable row level security;
alter table public.programs enable row level security;
alter table public.stages enable row level security;
alter table public.weeks enable row level security;
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.enrollments enable row level security;
alter table public.tasks enable row level security;
alter table public.evidences enable row level security;
alter table public.kpi_definitions enable row level security;
alter table public.kpi_values enable row level security;
alter table public.notes enable row level security;
alter table public.audit_events enable row level security;

create policy reference_plans_read on public.plans for select to authenticated using (true);
create policy reference_plan_versions_read on public.plan_versions for select to authenticated using (true);
create policy reference_entitlements_read on public.entitlements for select to authenticated using (true);
create policy reference_programs_read on public.programs for select to authenticated using (true);
create policy reference_stages_read on public.stages for select to authenticated using (true);
create policy reference_weeks_read on public.weeks for select to authenticated using (true);
create policy reference_plans_staff on public.plans for all to authenticated using (app_private.is_staff()) with check (app_private.is_staff());
create policy reference_plan_versions_staff on public.plan_versions for all to authenticated using (app_private.is_staff()) with check (app_private.is_staff());
create policy reference_entitlements_staff on public.entitlements for all to authenticated using (app_private.is_staff()) with check (app_private.is_staff());
create policy reference_programs_staff on public.programs for all to authenticated using (app_private.is_staff()) with check (app_private.is_staff());
create policy reference_stages_staff on public.stages for all to authenticated using (app_private.is_staff()) with check (app_private.is_staff());
create policy reference_weeks_staff on public.weeks for all to authenticated using (app_private.is_staff()) with check (app_private.is_staff());

create policy profiles_read on public.profiles for select to authenticated
using (id = auth.uid() or app_private.is_staff() or exists (
  select 1 from public.memberships mine join public.memberships theirs using (organization_id)
  where mine.user_id = auth.uid() and mine.status = 'ACTIVE' and theirs.user_id = profiles.id and theirs.status = 'ACTIVE'
));
create policy profiles_self_update on public.profiles for update to authenticated
using (id = auth.uid()) with check (id = auth.uid());

create policy organizations_read on public.organizations for select to authenticated using (app_private.belongs_to(id));
create policy organizations_staff_write on public.organizations for all to authenticated using (app_private.is_staff()) with check (app_private.is_staff());
create policy memberships_read on public.memberships for select to authenticated using (app_private.belongs_to(organization_id));
create policy memberships_manage on public.memberships for all to authenticated using (app_private.can_manage(organization_id)) with check (app_private.can_manage(organization_id));

create policy enrollments_read on public.enrollments for select to authenticated using (app_private.belongs_to(organization_id));
create policy enrollments_manage on public.enrollments for all to authenticated using (app_private.can_manage(organization_id)) with check (app_private.can_manage(organization_id));
create policy tasks_read on public.tasks for select to authenticated using (app_private.belongs_to(organization_id));
create policy tasks_manage on public.tasks for all to authenticated using (app_private.can_manage(organization_id)) with check (app_private.can_manage(organization_id));
create policy tasks_assignee_update on public.tasks for update to authenticated
using (assigned_to = auth.uid() and app_private.belongs_to(organization_id))
with check (assigned_to = auth.uid() and app_private.belongs_to(organization_id));
create policy evidences_read on public.evidences for select to authenticated using (app_private.belongs_to(organization_id));
create policy evidences_insert on public.evidences for insert to authenticated
with check (uploaded_by = auth.uid() and app_private.belongs_to(organization_id));
create policy evidences_manage on public.evidences for all to authenticated using (app_private.can_manage(organization_id)) with check (app_private.can_manage(organization_id));

create policy kpi_definitions_read on public.kpi_definitions for select to authenticated
using (organization_id is null or app_private.belongs_to(organization_id));
create policy kpi_definitions_manage on public.kpi_definitions for all to authenticated
using (organization_id is not null and app_private.can_manage(organization_id))
with check (organization_id is not null and app_private.can_manage(organization_id));
create policy kpi_values_read on public.kpi_values for select to authenticated using (
  app_private.belongs_to(organization_id) and exists (
    select 1 from public.kpi_definitions d where d.id = kpi_definition_id and (
      d.visibility = 'PUBLIC' or app_private.is_staff() or exists (
        select 1 from public.memberships m where m.organization_id = kpi_values.organization_id
        and m.user_id = auth.uid() and m.role = 'OWNER' and m.status = 'ACTIVE'
      )
    )
  )
);
create policy kpi_values_manage on public.kpi_values for all to authenticated using (app_private.can_manage(organization_id)) with check (app_private.can_manage(organization_id));

create policy notes_read on public.notes for select to authenticated using (
  app_private.belongs_to(organization_id) and (
    visibility = 'PUBLIC' or app_private.is_staff() or (visibility = 'OWNER_ONLY' and owner_id = auth.uid())
  )
);
create policy notes_create on public.notes for insert to authenticated
with check (author_id = auth.uid() and app_private.belongs_to(organization_id) and (visibility <> 'INTERNAL' or app_private.is_staff()));
create policy notes_author_update on public.notes for update to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid() and app_private.belongs_to(organization_id) and (visibility <> 'INTERNAL' or app_private.is_staff()));
create policy notes_manage on public.notes for all to authenticated using (app_private.can_manage(organization_id)) with check (app_private.can_manage(organization_id));
create policy audit_staff_read on public.audit_events for select to authenticated using (app_private.is_staff());

grant usage on schema app_private to authenticated;
grant execute on function app_private.is_staff() to authenticated;
grant execute on function app_private.belongs_to(uuid) to authenticated;
grant execute on function app_private.can_manage(uuid) to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke insert, update, delete on public.audit_events from authenticated;
grant usage, select on all sequences in schema public to authenticated;

insert into storage.buckets (id, name, public, file_size_limit)
values ('control-os-evidence', 'control-os-evidence', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

create policy evidence_objects_read on storage.objects for select to authenticated
using (bucket_id = 'control-os-evidence' and app_private.belongs_to((storage.foldername(name))[1]::uuid));
create policy evidence_objects_insert on storage.objects for insert to authenticated
with check (bucket_id = 'control-os-evidence' and app_private.belongs_to((storage.foldername(name))[1]::uuid));
create policy evidence_objects_manage on storage.objects for all to authenticated
using (bucket_id = 'control-os-evidence' and app_private.can_manage((storage.foldername(name))[1]::uuid))
with check (bucket_id = 'control-os-evidence' and app_private.can_manage((storage.foldername(name))[1]::uuid));

with inserted as (
  insert into public.plans (code, name, description)
  values
    ('CONTROL-START', 'CONTROL Start', 'Base operativa y hábitos de ejecución.'),
    ('CONTROL-GROWTH', 'CONTROL Growth', 'Ejecución con indicadores y acompañamiento.'),
    ('CONTROL-SCALE', 'CONTROL Scale', 'Escalamiento con gobierno y control avanzado.')
  on conflict (code) do update set name = excluded.name, description = excluded.description
  returning id, code
)
insert into public.plan_versions (plan_id, version, duration_weeks, status, published_at)
select id, 1, 12, 'ACTIVE', now() from inserted
on conflict (plan_id, version) do nothing;

insert into public.entitlements (plan_version_id, key, enabled, limit_value)
select pv.id, seed.key, seed.enabled, seed.limit_value
from public.plan_versions pv
join public.plans p on p.id = pv.plan_id and pv.version = 1
cross join lateral (
  values
    ('PROGRAM_12_WEEKS', true, 12),
    ('EVIDENCE_UPLOADS', true, 50),
    ('KPI_TRACKING', p.code <> 'CONTROL-START', null),
    ('COACHING', p.code in ('CONTROL-GROWTH', 'CONTROL-SCALE'), null),
    ('ADVANCED_GOVERNANCE', p.code = 'CONTROL-SCALE', null)
) as seed(key, enabled, limit_value)
on conflict (plan_version_id, key) do update
set enabled = excluded.enabled, limit_value = excluded.limit_value;

insert into public.programs (code, name, description)
values ('CONTROL-OS-12W', 'CONTROL OS · 12 semanas', 'Ruta de implementación y escalamiento con control.')
on conflict (code) do update set name = excluded.name, description = excluded.description;

with program as (select id from public.programs where code = 'CONTROL-OS-12W')
insert into public.stages (program_id, position, name, description)
select program.id, seed.position, seed.name, seed.description
from program cross join (values
  (1, 'Diagnóstico', 'Visibilidad, línea base y prioridades.'),
  (2, 'Sistema', 'Procesos, responsables y cadencia.'),
  (3, 'Ejecución', 'Implementación guiada con evidencias.'),
  (4, 'Escalamiento', 'Optimización, gobierno y siguiente ciclo.')
) as seed(position, name, description)
on conflict (program_id, position) do update set name = excluded.name, description = excluded.description;

with program as (select id from public.programs where code = 'CONTROL-OS-12W'),
stage_map as (select s.id, s.position from public.stages s join program p on p.id = s.program_id)
insert into public.weeks (stage_id, week_number, title, objective)
select stage_map.id, seed.week_number, seed.title, seed.objective
from (values
  (1, 1, 'Punto de partida', 'Acordar línea base, alcance y resultados.'),
  (1, 2, 'Números bajo control', 'Definir los indicadores que guían decisiones.'),
  (1, 3, 'Prioridades', 'Concentrar recursos en los cuellos de botella.'),
  (2, 4, 'Mapa operativo', 'Convertir la operación en un sistema visible.'),
  (2, 5, 'Responsables', 'Asignar propiedad y criterios de cierre.'),
  (2, 6, 'Cadencia', 'Instalar rituales de seguimiento efectivos.'),
  (3, 7, 'Ejecución', 'Cerrar compromisos con evidencia verificable.'),
  (3, 8, 'Calidad', 'Medir consistencia y corregir desviaciones.'),
  (3, 9, 'Automatización', 'Reducir trabajo repetitivo y riesgo manual.'),
  (4, 10, 'Capacidad', 'Preparar equipo y procesos para crecer.'),
  (4, 11, 'Gobierno', 'Asegurar control, seguridad y trazabilidad.'),
  (4, 12, 'Siguiente ciclo', 'Consolidar resultados y definir el próximo plan.')
) as seed(stage_position, week_number, title, objective)
join stage_map on stage_map.position = seed.stage_position
on conflict (stage_id, week_number) do update set title = excluded.title, objective = excluded.objective;

insert into public.kpi_definitions (organization_id, code, name, unit, direction, visibility)
values
  (null, 'REVENUE', 'Ingresos', 'currency', 'UP', 'OWNER_ONLY'),
  (null, 'GROSS_MARGIN', 'Margen bruto', 'percent', 'UP', 'OWNER_ONLY'),
  (null, 'TASK_COMPLETION', 'Cumplimiento de tareas', 'percent', 'UP', 'PUBLIC'),
  (null, 'EVIDENCE_RATE', 'Tareas con evidencia', 'percent', 'UP', 'PUBLIC')
on conflict (organization_id, code) do update set name = excluded.name, unit = excluded.unit, direction = excluded.direction, visibility = excluded.visibility;
