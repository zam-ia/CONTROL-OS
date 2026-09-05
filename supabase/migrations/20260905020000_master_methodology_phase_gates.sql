-- CONTROL OS · Master methodology, access depth and phase gates
-- Safe to rerun. It keeps one methodology and separates it from commercial access.

alter table public.plans
  add column if not exists access_level text;

update public.plans
set access_level = case code
  when 'CONTROL-SCALE' then 'HIGH'
  when 'CONTROL-GROWTH' then 'MEDIUM'
  else 'LOW'
end
where access_level is null;

alter table public.plans
  alter column access_level set default 'LOW',
  alter column access_level set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'plans_access_level_check'
      and conrelid = 'public.plans'::regclass
  ) then
    alter table public.plans add constraint plans_access_level_check
      check (access_level in ('LOW', 'MEDIUM', 'HIGH'));
  end if;
end $$;

create table if not exists public.methodology_steps (
  id uuid primary key default gen_random_uuid(),
  code smallint not null unique check (code between 1 and 99),
  phase_number smallint not null check (phase_number between 1 and 20),
  week_number smallint not null check (week_number between 1 and 52),
  title text not null,
  execution_owner text not null check (execution_owner in ('C', 'E', 'C+E', 'A')),
  status public.record_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_dossiers (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  business_data jsonb not null default '{}'::jsonb,
  founder_data jsonb not null default '{}'::jsonb,
  required_data_total integer not null default 0 check (required_data_total >= 0),
  required_data_completed integer not null default 0 check (required_data_completed >= 0),
  status text not null default 'INCOMPLETE' check (status in ('INCOMPLETE', 'READY', 'VALIDATED')),
  validated_by uuid references public.profiles(id),
  validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (required_data_completed <= required_data_total)
);

create table if not exists public.control_artifacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  methodology_step_code smallint references public.methodology_steps(code),
  phase_number smallint not null check (phase_number between 0 and 20),
  week_number smallint not null check (week_number between 0 and 52),
  title text not null,
  artifact_type text not null,
  execution_owner text not null check (execution_owner in ('C', 'E', 'C+E', 'A')),
  payload jsonb not null default '{}'::jsonb,
  evidence_id uuid references public.evidences(id) on delete set null,
  status text not null default 'DRAFT' check (status in ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'CHANGES_REQUESTED', 'VALIDATED')),
  created_by uuid references public.profiles(id),
  validated_by uuid references public.profiles(id),
  validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.phase_gates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  enrollment_id uuid references public.enrollments(id) on delete cascade,
  phase_number smallint not null check (phase_number between 1 and 20),
  status text not null default 'OPEN' check (status in ('OPEN', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED')),
  feedback text,
  submitted_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (organization_id, enrollment_id, phase_number)
);

create table if not exists public.phase_gate_requirements (
  id uuid primary key default gen_random_uuid(),
  phase_gate_id uuid not null references public.phase_gates(id) on delete cascade,
  requirement_code text not null,
  label text not null,
  position smallint not null check (position > 0),
  completed boolean not null default false,
  completion_source text not null default 'TEAM' check (completion_source in ('CLIENT', 'TEAM', 'AUTO')),
  evidence_reference text,
  completed_by uuid references public.profiles(id),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (phase_gate_id, requirement_code)
);

create index if not exists methodology_steps_phase_week_idx
  on public.methodology_steps(phase_number, week_number, code);
create index if not exists control_artifacts_org_phase_idx
  on public.control_artifacts(organization_id, phase_number, week_number, status);
create index if not exists phase_gates_org_phase_idx
  on public.phase_gates(organization_id, phase_number, status);

insert into public.methodology_steps (code, phase_number, week_number, title, execution_owner)
values
  (1,1,1,'Levantamiento del tiempo del fundador','C'),
  (2,1,1,'Mapa de carga y dependencia del fundador','C+E'),
  (3,1,1,'Diagnóstico financiero inicial','C'),
  (4,1,1,'P&L simplificado','A'),
  (5,1,1,'Rentabilidad por servicio','C+E'),
  (6,1,1,'Rentabilidad por cliente','C+E'),
  (7,1,1,'Mapa de fugas CONTROL','E'),
  (8,1,1,'Mapa operativo actual AS-IS','C+E'),
  (9,1,1,'Inventario de procesos','C'),
  (10,1,1,'CONTROL Score Día 0','A'),
  (11,1,2,'Foto estratégica actual','C'),
  (12,1,2,'Visión operativa a 12 meses','C'),
  (13,1,2,'Mapa de restricciones','C+E'),
  (14,1,2,'Análisis de portafolio','C'),
  (15,1,2,'Matriz Foco CONTROL','A'),
  (16,1,2,'ICP operativo','C+E'),
  (17,1,2,'Claridad de propuesta','C+E'),
  (18,1,3,'Auditoría de oferta actual','C+E'),
  (19,1,3,'Oferta Mínima Rentable','C+E'),
  (20,1,3,'Priorización de problemas','E'),
  (21,1,3,'Backlog de mejoras','A'),
  (22,1,3,'Roadmap de 90 días','C+E'),
  (23,2,4,'Inventario total de trabajo','C'),
  (24,2,4,'Clasificación EDAE','C+E'),
  (25,2,4,'Registro de roles actuales','C'),
  (26,2,4,'Detección de roles mal construidos','E'),
  (27,2,4,'Organigrama funcional','E'),
  (28,2,4,'Matriz RACI','C+E'),
  (29,2,4,'Sistema de trabajo','C+E'),
  (30,2,4,'Cadencia operativa','C+E'),
  (31,2,5,'Selección de procesos críticos','E'),
  (32,2,5,'Diseño de procesos TO-BE','C+E'),
  (33,2,5,'Diseño de flujos','C+E'),
  (34,2,5,'Asignación de process owner','E'),
  (35,2,5,'Definición de SLA','C+E'),
  (36,2,5,'Definición de KPI por proceso','A'),
  (37,2,5,'Creación de SOP','C+E'),
  (38,2,5,'Backlog de automatizaciones','E'),
  (39,2,6,'Estructura de categorías financieras','E'),
  (40,2,6,'Tablero financiero mensual','C'),
  (41,2,6,'Rentabilidad continua','A'),
  (42,2,6,'Presupuesto mensual','C+E'),
  (43,2,6,'Umbrales por empresa','E'),
  (44,2,6,'CONTROL Board','A'),
  (45,2,6,'Reunión de control','C+E'),
  (46,2,6,'Bitácora de mejoras','C+E')
on conflict (code) do update set
  phase_number = excluded.phase_number,
  week_number = excluded.week_number,
  title = excluded.title,
  execution_owner = excluded.execution_owner,
  updated_at = now();

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'methodology_steps', 'organization_dossiers', 'control_artifacts',
    'phase_gates', 'phase_gate_requirements'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and policyname='methodology_steps_read') then
    create policy methodology_steps_read on public.methodology_steps for select to authenticated
      using (app_private.is_active_user());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and policyname='methodology_steps_manage') then
    create policy methodology_steps_manage on public.methodology_steps for all to authenticated
      using (app_private.is_staff()) with check (app_private.is_staff());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and policyname='organization_dossiers_read') then
    create policy organization_dossiers_read on public.organization_dossiers for select to authenticated
      using (app_private.belongs_to(organization_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and policyname='organization_dossiers_manage') then
    create policy organization_dossiers_manage on public.organization_dossiers for all to authenticated
      using (app_private.can_manage(organization_id)) with check (app_private.can_manage(organization_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and policyname='control_artifacts_read') then
    create policy control_artifacts_read on public.control_artifacts for select to authenticated
      using (app_private.belongs_to(organization_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and policyname='control_artifacts_manage') then
    create policy control_artifacts_manage on public.control_artifacts for all to authenticated
      using (app_private.can_manage(organization_id)) with check (app_private.can_manage(organization_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and policyname='phase_gates_read') then
    create policy phase_gates_read on public.phase_gates for select to authenticated
      using (app_private.belongs_to(organization_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and policyname='phase_gates_manage') then
    create policy phase_gates_manage on public.phase_gates for all to authenticated
      using (app_private.can_manage(organization_id)) with check (app_private.can_manage(organization_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and policyname='phase_gate_requirements_read') then
    create policy phase_gate_requirements_read on public.phase_gate_requirements for select to authenticated
      using (exists (
        select 1 from public.phase_gates gate
        where gate.id = phase_gate_id and app_private.belongs_to(gate.organization_id)
      ));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and policyname='phase_gate_requirements_manage') then
    create policy phase_gate_requirements_manage on public.phase_gate_requirements for all to authenticated
      using (exists (
        select 1 from public.phase_gates gate
        where gate.id = phase_gate_id and app_private.can_manage(gate.organization_id)
      )) with check (exists (
        select 1 from public.phase_gates gate
        where gate.id = phase_gate_id and app_private.can_manage(gate.organization_id)
      ));
  end if;
end $$;

grant select on public.methodology_steps to authenticated;
grant select, insert, update, delete on public.organization_dossiers, public.control_artifacts,
  public.phase_gates, public.phase_gate_requirements to authenticated;

comment on table public.methodology_steps is
  'Canonical CONTROL workflow. Commercial plans change access depth, never the methodology.';
comment on table public.phase_gates is
  'Evidence-based phase exits; elapsed time alone cannot approve a phase.';
