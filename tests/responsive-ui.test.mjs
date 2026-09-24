import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const app = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const business = readFileSync(
  new URL('../app/business/page.tsx', import.meta.url),
  'utf8',
);
const css = readFileSync(
  new URL('../app/globals.css', import.meta.url),
  'utf8',
);
const businessCss = readFileSync(
  new URL('../app/business/business.css', import.meta.url),
  'utf8',
);
const criticalCss = readFileSync(
  new URL('../app/responsive-critical.css', import.meta.url),
  'utf8',
);
const teamAgendaMigration = readFileSync(
  new URL(
    '../supabase/migrations/20260924185947_business_team_agenda_history.sql',
    import.meta.url,
  ),
  'utf8',
);
const businessStateApi = readFileSync(
  new URL('../app/api/business/state/route.ts', import.meta.url),
  'utf8',
);

test('client mobile navigation exposes Inicio, Ruta, Empresa and Más', () => {
  assert.match(app, /className="mobile-bottom-nav"/);
  for (const label of ['Inicio', 'Ruta', 'Empresa', 'Más']) {
    assert.match(app, new RegExp(`<span>${label}<\\/span>`));
  }
  for (const label of ['Portafolio', 'Programa']) {
    assert.match(app, new RegExp(`<span>${label}<\\/span>`));
  }
});

test('logout remains visible and explicit in responsive navigation', () => {
  assert.match(app, /className="sidebar-logout"/);
  assert.match(app, /<span>Cerrar sesión<\/span>/);
  assert.match(app, /const logout = \(\) =>/);
  assert.match(css, /\.sidebar-logout/);
  assert.match(css, /bottom: calc\(82px \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(business, /className="business-logout"/);
  assert.match(businessCss, /\.business-logout/);
});

test('responsive breakpoints include mobile cards, safe areas and touch targets', () => {
  assert.match(css, /@media \(max-width: 767px\)/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /\[data-slot='table-cell'\]::before/);
  assert.match(css, /min-height: 44px/);
  assert.match(businessCss, /\.business-table td::before/);
});

test('login adapts from phones through tablets and desktop screens', () => {
  assert.match(criticalCss, /@media \(max-width: 900px\)/);
  assert.match(criticalCss, /@media \(max-width: 767px\)/);
  assert.match(criticalCss, /@media \(max-width: 380px\)/);
  assert.match(criticalCss, /min-height: 100dvh/);
  assert.match(criticalCss, /width: min\(520px, calc\(100% - 40px\)\)/);
  assert.match(criticalCss, /width: calc\(100% - 24px\)/);
  assert.match(criticalCss, /\.auth-card input[\s\S]*min-height: 48px/);
  assert.match(criticalCss, /\.auth-card \[data-slot='button'\][\s\S]*min-height: 48px/);
});

test('financial, client and team tables provide mobile labels', () => {
  for (const label of [
    'Fecha',
    'Concepto',
    'Cliente',
    'Margen',
    'Persona',
    'Supervisor',
  ]) {
    assert.match(business, new RegExp(`data-label="${label}"`));
  }
});

test('Mi Empresa explains business fields in plain language', () => {
  for (const copy of [
    '¿Qué cliente te pagó?',
    '¿Qué le vendiste?',
    '¿En qué gastaste?',
    '¿Este gasto se repite?',
    '¿Qué tipo de cliente es? (opcional)',
    '¿Cuántos puedes vender o atender al mes?',
  ]) {
    assert.match(business, new RegExp(copy.replace(/[?()]/g, '\\$&')));
  }
});

test('income and expense forms can create related records and resume', () => {
  assert.match(business, /No aparece: añadir cliente/);
  assert.match(business, /No aparece: añadir servicio/);
  assert.match(business, /openRelatedForm\('client', 'income'/);
  assert.match(business, /openRelatedForm\('service', 'expense'/);
  assert.match(business, /setFormDrafts/);
  assert.match(business, /setForm\(returnForm\)/);
  assert.match(businessCss, /\.business-inline-create/);
});

test('team can be edited or ended without deleting its history', () => {
  assert.match(business, /Añadir persona/);
  assert.match(business, /Registrar cese/);
  assert.match(business, /openTeamForm/);
  assert.match(business, /openTeamEndForm/);
  assert.match(business, /type: 'saveTeamMember'/);
  assert.match(business, /type: 'endTeamMember'/);
  assert.match(business, /sus gastos, tareas y resultados anteriores no se borran/);
});

test('company agenda provides month week and day views with assignments', () => {
  for (const copy of [
    'AGENDA DE TU EMPRESA',
    'Mes',
    'Semana',
    'Día',
    'Nueva tarea',
    'Nuevo evento',
    'Asignar a una persona',
    'Asignar a un puesto',
  ]) {
    assert.match(business, new RegExp(copy));
  }
  assert.match(businessCss, /\.business-calendar-grid\.is-month/);
  assert.match(businessCss, /\.business-calendar-grid\.is-week/);
  assert.match(businessCss, /grid-template-columns: 1fr/);
});

test('position profiles connect documents, team tasks and KPI reports', () => {
  assert.match(business, /PERFILES DE PUESTO/);
  assert.match(business, /Adjuntar perfil existente/);
  assert.match(business, /KPIS POR PUESTO/);
  assert.match(business, /Resultados vinculados con tareas reales/);
  assert.match(business, /positionPerformance/);
});

test('database migration preserves team history and tenant isolation', () => {
  assert.match(teamAgendaMigration, /business_team_cost_periods/);
  assert.match(teamAgendaMigration, /termination_reason/);
  assert.match(teamAgendaMigration, /business_position_documents/);
  assert.match(teamAgendaMigration, /business_team_member_id/);
  assert.match(teamAgendaMigration, /business_position_id/);
  assert.match(teamAgendaMigration, /enable row level security/);
  assert.match(teamAgendaMigration, /app_private\.belongs_to/);
  assert.match(teamAgendaMigration, /app_private\.can_manage/);
});

test('business workspace synchronizes per authenticated organization', () => {
  assert.match(business, /fetch\('\/api\/business\/state'/);
  assert.match(businessStateApi, /control-os-access-token/);
  assert.match(businessStateApi, /business_workspaces/);
  assert.match(businessStateApi, /centra_business_state/);
  assert.match(businessStateApi, /state\.workspace\.organizationId !== context\.organizationId/);
});
