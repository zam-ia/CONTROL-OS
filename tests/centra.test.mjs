import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../lib/centra.ts', import.meta.url), 'utf8');
const js = ts.transpile(source, { module: ts.ModuleKind.CommonJS });
const module = { exports: {} };
vm.runInNewContext(js, { module, exports: module.exports });
const { centraPhases, phaseForWeek, nextAction, implementationHealth } = module.exports;

test('CENTRA exposes onboarding plus 13 implementation weeks', () => {
  assert.deepEqual(
    Array.from(centraPhases.flatMap((phase) => Array.from(phase.weeks))),
    Array.from({ length: 14 }, (_, index) => index),
  );
  assert.equal(phaseForWeek(13).name, 'Agencia Delegable y Escalable');
});

test('next action prioritizes urgency and excludes closed tasks', () => {
  const selected = nextAction([
    { id: 'done', title: 'Terminada', due: '2026-09-20', status: 'DONE', priority: 1 },
    { id: 'later', title: 'Luego', due: '2026-09-25', status: 'PENDING', priority: 2 },
    { id: 'now', title: 'Ahora', due: '2026-09-24', status: 'PENDING', priority: 1 },
  ]);
  assert.equal(selected?.id, 'now');
});

test('implementation health is explicit and reproducible', () => {
  assert.equal(implementationHealth(80), 'EN CONTROL');
  assert.equal(implementationHealth(60), 'ATENCIÓN');
  assert.equal(implementationHealth(59), 'EN RIESGO');
});
