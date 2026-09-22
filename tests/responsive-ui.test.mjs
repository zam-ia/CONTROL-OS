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
