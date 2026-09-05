-- CONTROL OS · Modules 03–07 curriculum and operations
-- Safe to rerun. No credentials or passwords are stored here.

alter table public.lessons alter column video_url drop not null;
alter table public.lessons
  add column if not exists approval_criteria text,
  add column if not exists execution_owner text,
  add column if not exists resource_code text,
  add column if not exists resource_version text not null default '1.0.0';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'lessons_execution_owner_check'
      and conrelid = 'public.lessons'::regclass
  ) then
    alter table public.lessons add constraint lessons_execution_owner_check
      check (execution_owner is null or execution_owner in ('C', 'E', 'C+E', 'A'));
  end if;
end $$;

alter table public.modules
  add column if not exists code text,
  add column if not exists week_number smallint,
  add column if not exists category text,
  add column if not exists resource_version text not null default '1.0.0',
  add column if not exists resource_tier text not null default 'BASIC',
  add column if not exists tags text[] not null default '{}',
  add column if not exists related_lesson_code text,
  add column if not exists editable boolean not null default true,
  add column if not exists owner_editorial uuid references public.profiles(id),
  add column if not exists last_reviewed_at timestamptz;

create unique index if not exists modules_code_unique_idx
  on public.modules(code) where code is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'modules_resource_tier_check'
      and conrelid = 'public.modules'::regclass
  ) then
    alter table public.modules add constraint modules_resource_tier_check
      check (resource_tier in ('BASIC', 'COMPLETE', 'ADVANCED'));
  end if;
end $$;

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  opened_by uuid not null references public.profiles(id),
  lesson_id uuid references public.lessons(id) on delete set null,
  ticket_type text not null check (ticket_type in ('METHODOLOGY', 'TECHNICAL', 'ACCOMPANIMENT')),
  priority text not null default 'NORMAL' check (priority in ('NORMAL', 'HIGH', 'URGENT')),
  visibility text not null default 'PRIVATE' check (visibility in ('PRIVATE', 'COMMUNITY')),
  subject text not null,
  description text not null,
  status text not null default 'OPEN' check (status in ('OPEN', 'ASSIGNED', 'ANSWERED', 'CLOSED')),
  assignee_id uuid references public.profiles(id),
  sla_due_at timestamptz not null,
  answered_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ticket_type <> 'TECHNICAL' or visibility = 'PRIVATE')
);

create table if not exists public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  stage_number smallint check (stage_number between 0 and 20),
  plan_version_id uuid references public.plan_versions(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete cascade,
  capacity integer check (capacity is null or capacity > 0),
  starts_at timestamptz not null,
  meeting_url text not null check (meeting_url ~ '^https://'),
  recording_url text check (recording_url is null or recording_url ~ '^https://'),
  recording_consent_required boolean not null default true,
  status public.record_status not null default 'ACTIVE',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_org_status_sla_idx
  on public.support_tickets(organization_id, status, sla_due_at);
create index if not exists live_sessions_start_idx
  on public.live_sessions(starts_at, status);

alter table public.support_tickets enable row level security;
alter table public.live_sessions enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and policyname='support_tickets_read') then
    create policy support_tickets_read on public.support_tickets for select to authenticated
      using (app_private.belongs_to(organization_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and policyname='support_tickets_insert') then
    create policy support_tickets_insert on public.support_tickets for insert to authenticated
      with check (opened_by = auth.uid() and app_private.belongs_to(organization_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and policyname='support_tickets_staff_manage') then
    create policy support_tickets_staff_manage on public.support_tickets for all to authenticated
      using (app_private.is_staff()) with check (app_private.is_staff());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and policyname='live_sessions_read') then
    create policy live_sessions_read on public.live_sessions for select to authenticated
      using (app_private.is_active_user() and (organization_id is null or app_private.belongs_to(organization_id)));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and policyname='live_sessions_manage') then
    create policy live_sessions_manage on public.live_sessions for all to authenticated
      using (app_private.is_staff()) with check (app_private.is_staff());
  end if;
end $$;

grant select, insert, update, delete on public.support_tickets, public.live_sessions to authenticated;

insert into public.methodology_steps (code, phase_number, week_number, title, execution_owner)
select 46 + row_number() over (), phase_number, week_number, title, execution_owner
from (values
  (3,7,'Matriz Stop Doing / EDAE','C'), (3,7,'Organigrama funcional por asientos','C'),
  (3,7,'Matriz de autoridad y decisiones','C+E'), (3,7,'Fichas de delegación CONTROL','C'),
  (3,7,'Mapa de capacidad del equipo','C+E'), (3,7,'Checkpoint de delegación','C+E'),
  (3,8,'KPIs por rol y proceso','C+E'), (3,8,'Scorecards por rol','C'),
  (3,8,'Cadencia Weekly Control','C+E'), (3,8,'Protocolo de excepciones','C+E'),
  (3,8,'Checklists QA','C'), (3,8,'Checkpoint de control','C+E'),
  (3,9,'Matriz de autonomía','C+E'), (3,9,'Decision Log del CEO','C'),
  (3,9,'Sprint de delegación 30D','C+E'), (3,9,'Perfect CEO Week','C'),
  (3,9,'Política de control y revisión','C+E'), (3,9,'CONTROL Score #3','C+E'),
  (4,10,'Scale Readiness Assessment','C'), (4,10,'Restricción de crecimiento','C+E'),
  (4,10,'Economics of Growth','C+E'), (4,10,'North Star 12M','C'),
  (4,10,'Plan de capacidad de escala','C+E'), (4,10,'Decisión Go / Go condicionado / No Go','C+E'),
  (4,11,'ICP rentable','C'), (4,11,'Escalera de valor','C+E'),
  (4,11,'Motor de adquisición','C+E'), (4,11,'Sistema de autoridad','C'),
  (4,11,'Funnel Economics','C+E'), (4,11,'Backlog de experimentos','C'),
  (4,12,'Roadmap 90D de escala','C+E'), (4,12,'Forecast de caja y capacidad','C+E'),
  (4,12,'Registro de riesgos','C'), (4,12,'CEO Dashboard final','C+E'),
  (4,12,'Partnership Readiness','C+E'), (4,12,'CONTROL Score final y continuidad','C+E')
) as curriculum(phase_number, week_number, title, execution_owner)
on conflict (code) do update set
  phase_number=excluded.phase_number, week_number=excluded.week_number,
  title=excluded.title, execution_owner=excluded.execution_owner, updated_at=now();

insert into public.lessons (
  code, stage_number, week_number, title, description, objective,
  duration_seconds, video_url, learnings, action_text, activity_type,
  resource_type, deliverable, points, requires_review, required_for_unlock,
  status, approval_criteria, execution_owner, resource_code, resource_version
)
select code, stage_number, week_number, title, objective, objective,
  600, null, jsonb_build_array(objective), action_text, 'TEMPLATE',
  'TEMPLATE', deliverable, 25, true, true, 'DRAFT', approval_criteria,
  execution_owner, resource_code, '1.0.0'
from (values
  ('3.1.1',3,7,'El trabajo que debes dejar de hacer','Identificar trabajo que debe salir de la agenda del founder.','Clasificar 20 actividades y seleccionar Top 5.','Matriz EDAE + Top 5 firmado.','Top 5 con destino, responsable y fecha.','C','RES-001'),
  ('3.1.2',3,7,'Diseña los asientos antes de pensar en personas','Separar funciones de personas.','Diseñar asientos a 12 meses.','Organigrama funcional + fichas.','Funciones críticas con owner claro.','C','RES-002'),
  ('3.1.3',3,7,'Quién decide qué','Definir derechos de decisión.','Registrar decisiones y niveles de autoridad.','Matriz de decisiones.','Responsable, límite y escalamiento definidos.','C+E','RES-003'),
  ('3.1.4',3,7,'Delegar sin tirar tareas por encima del muro','Estandarizar handoffs.','Completar tres fichas reales.','Tres fichas de delegación.','Resultado, estándar, recursos, KPI y revisión.','C','RES-004'),
  ('3.1.5',3,7,'Capacidad real del equipo','Medir carga antes de delegar o contratar.','Estimar capacidad y ajustes.','Mapa de capacidad.','Cuello de botella y acción definidos.','C+E','RES-005'),
  ('3.1.6',3,7,'Checkpoint de delegación','Cerrar la semana con decisiones implementables.','Revisar entregables de delegación.','Checkpoint de delegación.','Sprint de delegación definido.','C+E','RES-001'),
  ('3.2.1',3,8,'Controla resultados, no movimientos','Escoger KPIs útiles.','Definir KPIs por rol o proceso.','Set inicial de KPIs.','Fórmula, fuente, frecuencia, owner, meta y umbral.','C+E','RES-006'),
  ('3.2.2',3,8,'Scorecard por rol','Crear accountability semanal.','Construir scorecards críticos.','Scorecards aprobados.','Máximo siete métricas y semáforo.','C','RES-007'),
  ('3.2.3',3,8,'La reunión que evita 30 mensajes','Diseñar cadencia de control.','Configurar Weekly Control.','Cadencia y reunión agendada.','Agenda breve y acciones con owner y fecha.','C+E','RES-008'),
  ('3.2.4',3,8,'Qué hacer cuando algo se sale del estándar','Gestionar excepciones.','Definir eventos de escalamiento.','Protocolo de excepciones.','Umbral, canal, responsable, SLA y evidencia.','C+E','RES-009'),
  ('3.2.5',3,8,'Calidad sin microgestión','Instalar criterios de aceptación.','Crear controles para tres procesos.','Tres checklists QA.','Criterios objetivos antes de la entrega.','C','RES-011'),
  ('3.2.6',3,8,'Checkpoint de control','Validar delegación y control.','Revisar scorecards, reuniones y QA.','Checkpoint semana 8.','Scorecards y reunión activos.','C+E','RES-008'),
  ('3.3.1',3,9,'Escalera de autonomía','Asignar autonomía por responsabilidad.','Definir nivel actual y objetivo.','Matriz de autonomía.','Nivel y fecha de revisión por responsabilidad.','C+E','RES-012'),
  ('3.3.2',3,9,'El tablero de decisiones del CEO','Reducir decisiones operativas del founder.','Rediseñar flujo de decisiones.','Decision Log y política.','Trazabilidad sin microgestión.','C','RES-013'),
  ('3.3.3',3,9,'Sprint de 30 días para soltar operación','Ejecutar delegación controlada.','Transferir de tres a cinco responsabilidades.','Sprint 30D.','Owner, checkpoints, riesgo y métrica.','C+E','RES-014'),
  ('3.3.4',3,9,'Rediseña la agenda del fundador','Mover horas a funciones de CEO.','Comparar semana ideal con baseline.','Perfect CEO Week.','Bloques estratégicos protegidos.','C','RES-015'),
  ('3.3.5',3,9,'Control sin volver a meterte en todo','Revisar por excepción.','Definir política de control.','Política de control.','Sin controles duplicados.','C+E','RES-016'),
  ('3.3.6',3,9,'Cierre Etapa 3 + CONTROL Score #3','Medir reducción de dependencia.','Repetir mediciones y gate.','Score #3 + informe.','Roles, scorecards, sprint y founder hours.','C+E','RES-033'),
  ('4.1.1',4,10,'¿De verdad debes escalar ahora?','Evaluar readiness.','Completar evaluación de cinco dimensiones.','Scale Readiness Score.','Sin rojos críticos sin mitigación.','C','RES-017'),
  ('4.1.2',4,10,'Encuentra tu cuello de botella de crecimiento','Identificar restricción con datos.','Priorizar restricción y evidencia.','Restricción + hipótesis.','Justificación basada en datos.','C+E','RES-018'),
  ('4.1.3',4,10,'Economía unitaria del crecimiento','Medir economics al aumentar volumen.','Simular tres escenarios.','Escenarios de crecimiento.','Ingresos, margen, CAC, capacidad y caja.','C+E','RES-019'),
  ('4.1.4',4,10,'Escalar para qué','Traducir propósito a meta.','Definir resultado 12M.','North Star 12M.','Meta cuantificada y trade-offs.','C','RES-020'),
  ('4.1.5',4,10,'Plan de capacidad','Preparar recursos antes de vender más.','Modelar personas y herramientas.','Plan de capacidad.','Fecha, costo y trigger por recurso.','C+E','RES-021'),
  ('4.1.6',4,10,'Checkpoint de preparación','Decidir Go, condicionado o No Go.','Revisar readiness y economics.','Decisión de escalamiento.','Datos, condiciones y bloqueos explícitos.','C+E','RES-017'),
  ('4.2.1',4,11,'ICP rentable, no solo ICP atractivo','Validar ICP por margen y fit.','Puntuar segmentos.','ICP prioritario.','Economía y fit operativo.','C','RES-022'),
  ('4.2.2',4,11,'Arquitectura de oferta y escalera de valor','Alinear entrada, core y expansión.','Diseñar escalera de valor.','Escalera de valor.','Promesa, precio, costo, margen y paso.','C+E','RES-023'),
  ('4.2.3',4,11,'Motor de adquisición','Definir canales y responsable.','Diseñar motor principal y secundario.','Mapa de adquisición.','KPI, cadencia, presupuesto y handoff.','C+E','RES-024'),
  ('4.2.4',4,11,'Sistema de autoridad','Convertir experiencia en activos.','Definir pilares e ideas ancla.','Authority Content Map.','Contenido conectado a dolor o evidencia.','C','RES-025'),
  ('4.2.5',4,11,'Embudo que termina en utilidad','Diseñar funnel rentable.','Registrar conversiones y metas.','Funnel Economics.','Conversión, CAC y margen calculados.','C+E','RES-026'),
  ('4.2.6',4,11,'Backlog de experimentos','Crear hipótesis medibles.','Priorizar tres experimentos.','Backlog 30D.','Métrica, duración, presupuesto y criterio.','C','RES-027'),
  ('4.3.1',4,12,'Plan de escala 90 días','Convertir prioridades en roadmap.','Definir objetivos e iniciativas.','Roadmap 90D.','Owner, KPI, baseline, target y fechas.','C+E','RES-028'),
  ('4.3.2',4,12,'Pronóstico de caja y capacidad','Proteger caja y entrega.','Proyectar ventas, costos y capacidad.','Forecast 90D.','Tres escenarios y caja mínima.','C+E','RES-029'),
  ('4.3.3',4,12,'Registro de riesgos de escala','Anticipar riesgos.','Registrar top diez riesgos.','Matriz de riesgos.','Probabilidad, impacto, owner y trigger.','C','RES-030'),
  ('4.3.4',4,12,'CEO Dashboard final','Consolidar indicadores de gobierno.','Seleccionar indicadores y fuentes.','CONTROL Board final.','Owner, frecuencia y decisión asociada.','C+E','RES-031'),
  ('4.3.5',4,12,'Readiness para Partnership','Validar baseline y fuentes.','Verificar fórmula, periodo y exclusiones.','Informe de readiness.','Baseline y fuentes verificables.','C+E','RES-032'),
  ('4.3.6',4,12,'Cierre CONTROL: evidencia, Score final y próximo ciclo','Comparar antes y después.','Registrar resultados y continuidad.','Score final + Plan post.','Resultado observado separado de promesa.','C+E','RES-033')
) as curriculum(code,stage_number,week_number,title,objective,action_text,deliverable,approval_criteria,execution_owner,resource_code)
on conflict (code) do update set
  stage_number=excluded.stage_number, week_number=excluded.week_number,
  title=excluded.title, description=excluded.description, objective=excluded.objective,
  action_text=excluded.action_text, deliverable=excluded.deliverable,
  approval_criteria=excluded.approval_criteria, execution_owner=excluded.execution_owner,
  resource_code=excluded.resource_code, resource_version=excluded.resource_version,
  updated_at=now();

insert into public.modules (
  code, week_number, title, description, category, resource_tier,
  resource_version, tags, editable, status
)
select code, week_number, title,
  'Plantilla editable con guía de uso y ejemplo resuelto vinculada a la ruta CONTROL.',
  category, tier, '1.0.0', array[category, 'CONTROL', 'plantilla'], true, 'DRAFT'
from (values
  ('RES-001',7,'Matriz Stop Doing / EDAE','Delegación','COMPLETE'),
  ('RES-002',7,'Organigrama Funcional v2','Delegación','COMPLETE'),
  ('RES-003',7,'Matriz de Autoridad y Decisiones','Delegación','COMPLETE'),
  ('RES-004',7,'Ficha de Delegación CONTROL','Delegación','COMPLETE'),
  ('RES-005',7,'Calculadora de Capacidad Semanal','Delegación','COMPLETE'),
  ('RES-006',8,'Ficha KPI CONTROL','Control','COMPLETE'),
  ('RES-007',8,'Scorecard de Rol','Control','COMPLETE'),
  ('RES-008',8,'Agenda Weekly Control','Control','COMPLETE'),
  ('RES-009',8,'Matriz de Escalamiento','Control','COMPLETE'),
  ('RES-010',8,'Registro de Incidentes','Control','COMPLETE'),
  ('RES-011',8,'Checklist QA / Definition of Done','Control','COMPLETE'),
  ('RES-012',9,'Matriz de Autonomía','Delegación','COMPLETE'),
  ('RES-013',9,'Decision Log','Control','COMPLETE'),
  ('RES-014',9,'Sprint 30D','Delegación','COMPLETE'),
  ('RES-015',9,'Perfect CEO Week','Delegación','COMPLETE'),
  ('RES-016',9,'Política de Control y Revisión','Control','COMPLETE'),
  ('RES-017',10,'Scale Readiness Assessment','Crecimiento','ADVANCED'),
  ('RES-018',10,'Mapa de Restricciones de Crecimiento','Crecimiento','ADVANCED'),
  ('RES-019',10,'Calculadora Economics of Growth','Crecimiento','ADVANCED'),
  ('RES-020',10,'Canvas Objetivo 12M','Estrategia','ADVANCED'),
  ('RES-021',10,'Capacity Growth Plan','Crecimiento','ADVANCED'),
  ('RES-022',11,'ICP Rentable Scorecard','Crecimiento','ADVANCED'),
  ('RES-023',11,'Offer Ladder Canvas','Crecimiento','ADVANCED'),
  ('RES-024',11,'Growth Engine Canvas','Crecimiento','ADVANCED'),
  ('RES-025',11,'Mapa de Autoridad','Crecimiento','ADVANCED'),
  ('RES-026',11,'Funnel Economics Sheet','Crecimiento','ADVANCED'),
  ('RES-027',11,'Growth Experiment Backlog','Crecimiento','ADVANCED'),
  ('RES-028',12,'Roadmap 90D de Escala','Crecimiento','ADVANCED'),
  ('RES-029',12,'Forecast Cash + Capacity','Crecimiento','ADVANCED'),
  ('RES-030',12,'Risk Register CONTROL','Crecimiento','ADVANCED'),
  ('RES-031',12,'CEO Dashboard','Control','ADVANCED'),
  ('RES-032',12,'Partnership Readiness Checklist','Partnership','ADVANCED'),
  ('RES-033',12,'Reporte Antes / Después','Partnership','ADVANCED'),
  ('RES-034',12,'Plantilla de Caso de Éxito interno','Ejemplos','ADVANCED')
) as resources(code,week_number,title,category,tier)
on conflict (code) where code is not null do update set
  week_number=excluded.week_number, title=excluded.title, category=excluded.category,
  resource_tier=excluded.resource_tier, resource_version=excluded.resource_version,
  tags=excluded.tags, editable=excluded.editable, updated_at=now();

insert into public.entitlements (plan_version_id, key, enabled, limit_value, config)
select pv.id, entitlement.key, entitlement.enabled, entitlement.limit_value, entitlement.config
from public.plan_versions pv
join public.plans p on p.id = pv.plan_id
cross join lateral (
  values
    ('max_stage_access', true, case p.access_level when 'HIGH' then 4 when 'MEDIUM' then 3 else 1 end, '{}'::jsonb),
    ('resource_tier', true, null, jsonb_build_object('value', case p.access_level when 'HIGH' then 'ADVANCED' when 'MEDIUM' then 'COMPLETE' else 'BASIC' end)),
    ('support_sla', true, case p.access_level when 'HIGH' then 8 when 'MEDIUM' then 24 else 48 end, jsonb_build_object('unit','hours')),
    ('private_support', p.access_level <> 'LOW', null, '{}'::jsonb),
    ('post_90d_plan', p.access_level = 'HIGH', null, '{}'::jsonb)
) as entitlement(key, enabled, limit_value, config)
on conflict (plan_version_id, key) do update set
  enabled=excluded.enabled, limit_value=excluded.limit_value, config=excluded.config;

comment on table public.support_tickets is
  'Methodology, technical and accompaniment requests with plan-based SLA and tenant privacy.';
comment on column public.lessons.video_url is
  'Optional while a lesson is draft. When published, use a YouTube URL; CONTROL OS does not host video files.';
