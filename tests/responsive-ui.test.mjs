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
