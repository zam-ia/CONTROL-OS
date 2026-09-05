import test from 'node:test';
import assert from 'node:assert/strict';
import {
  seed,
  execute,
  getOrg,
  available,
  progress,
  requirements,
  goalProgress,
  programProgress,
  health,
} from '../lib/control.ts';
const org = 'norte';
const run = (s, c, mode = 'client') => execute(s, org, mode, c);
function ready() {
  let s = seed();
  for (const task of getOrg(s, org).tasks.filter((t) => t.week === 1))
    s = run(s, {
      type: 'submit',
      taskId: task.id,
      text: 'Evidencia ficticia con fuente de datos.',
    });
  s = run(s, { type: 'weekFlag', week: 1, field: 'content', checked: true });
  s = run(s, { type: 'weekFlag', week: 1, field: 'checklist', checked: true });
  return run(s, {
    type: 'kpi',
    week: 1,
    code: 'margin',
    value: 15,
    period: '2026-09-04',
    source: 'Registro ficticio',
  });
}
test('seed: one organization per plan and 12 weeks each', () => {
  const s = seed();
  assert.equal(s.orgs.length, 3);
  assert.equal(new Set(s.orgs.map((o) => o.planId)).size, 3);
  s.orgs.forEach((o) => {
    assert.equal(o.weeks.length, 12);
    assert.equal(o.tasks.length, 36);
  });
});
test('week 2 requires approved week 1', () => {
  const s = seed();
  assert.match(available(s, getOrg(s, org), 2), /semana 1/);
  assert.equal(available(s, getOrg(s, org), 1), '');
});
test('diagnostic plan excludes stage 2', () => {
  const s = seed();
  assert.match(available(s, getOrg(s, 'orbita'), 4), /no está incluida/);
});
test('required evidence cannot be empty', () =>
  assert.throws(
    () => run(seed(), { type: 'submit', taskId: 'norte-1-0', text: '' }),
    /información/,
  ));
test('a task in another demo organization is not selected', () =>
  assert.throws(
    () =>
      run(seed(), {
        type: 'submit',
        taskId: 'orbita-2-0',
        text: 'Evidencia ficticia',
      }),
    /no encontrada/,
  ));
test('submitting evidence enters REVIEW not DONE', () => {
  const s = run(seed(), {
    type: 'submit',
    taskId: 'norte-1-0',
    text: 'Evidencia ficticia',
  });
  assert.equal(getOrg(s, org).tasks[0].status, 'REVIEW');
});
test('immutable domain updates', () => {
  const s = seed();
  run(s, { type: 'submit', taskId: 'norte-1-0', text: 'Evidencia ficticia' });
  assert.equal(getOrg(s, org).tasks[0].evidence.length, 0);
});
test('blocked task needs reason', () =>
  assert.throws(() =>
    run(seed(), { type: 'block', taskId: 'norte-1-0', text: '' }),
  ));
test('blocked task can submit a new evidence', () => {
  let s = run(seed(), {
    type: 'block',
    taskId: 'norte-1-0',
    text: 'Falta información',
  });
  s = run(s, {
    type: 'submit',
    taskId: 'norte-1-0',
    text: 'Información nueva verificable',
  });
  assert.equal(getOrg(s, org).tasks[0].blocker, '');
});
test('incomplete gate cannot be submitted', () =>
  assert.throws(
    () => run(seed(), { type: 'submitGate', week: 1 }),
    /requisitos/,
  ));
test('100% executed is not gate approval', () => {
  const s = ready();
  assert.equal(progress(getOrg(s, org), 1), 100);
  assert.equal(getOrg(s, org).weeks[0].gate, 'OPEN');
  assert.equal(programProgress(s, getOrg(s, org)), 0);
});
test('hybrid gate remains REVIEW', () => {
  const s = run(ready(), { type: 'submitGate', week: 1 });
  assert.equal(getOrg(s, org).weeks[0].gate, 'REVIEW');
  assert.ok(available(s, getOrg(s, org), 2));
});
test('client mode cannot approve gate', () =>
  assert.throws(
    () =>
      run(ready(), {
        type: 'approveGate',
        week: 1,
        text: 'Aprobación ficticia',
      }),
    /administración/,
  ));
test('gate cannot approve until all evidence accepted', () => {
  const s = run(ready(), { type: 'submitGate', week: 1 });
  assert.throws(
    () =>
      run(
        s,
        { type: 'approveGate', week: 1, text: 'Aprobación ficticia' },
        'admin',
      ),
    /cada evidencia/,
  );
});
test('full client to consultant journey unlocks next week', () => {
  let s = run(ready(), { type: 'submitGate', week: 1 });
  for (const t of getOrg(s, org).tasks.filter((t) => t.week === 1))
    s = run(
      s,
      {
        type: 'reviewTask',
        taskId: t.id,
        text: 'Revisión ficticia aceptada',
        checked: true,
      },
      'admin',
    );
  s = run(
    s,
    {
      type: 'approveGate',
      week: 1,
      text: 'Línea base de demostración aprobada',
    },
    'admin',
  );
  assert.equal(getOrg(s, org).current, 2);
  assert.equal(available(s, getOrg(s, org), 2), '');
  assert.equal(getOrg(s, org).events[0].actor, 'admin');
});
test('requested changes retain original evidence', () => {
  let s = run(seed(), {
    type: 'submit',
    taskId: 'norte-1-0',
    text: 'Evidencia versión uno',
  });
  s = run(
    s,
    {
      type: 'reviewTask',
      taskId: 'norte-1-0',
      text: 'Falta la fuente original',
      checked: false,
    },
    'admin',
  );
  s = run(s, {
    type: 'submit',
    taskId: 'norte-1-0',
    text: 'Evidencia versión dos con fuente',
  });
  const t = getOrg(s, org).tasks[0];
  assert.equal(t.evidence.length, 2);
  assert.equal(t.evidence[0].status, 'CHANGES_REQUESTED');
});
test('cannot change frozen reviewed week flags', () =>
  assert.throws(() =>
    run(run(ready(), { type: 'submitGate', week: 1 }), {
      type: 'weekFlag',
      week: 1,
      field: 'content',
      checked: false,
    }),
  ));
test('KPI validates finite range', () => {
  for (const value of [101, NaN, Infinity, -101])
    assert.throws(() =>
      run(seed(), {
        type: 'kpi',
        week: 1,
        code: 'margin',
        value,
        period: '2026-09-04',
        source: 'test',
      }),
    );
});
test('KPI invalid and impossible dates rejected', () => {
  for (const period of ['not-a-date', '2026-02-30'])
    assert.throws(() =>
      run(seed(), {
        type: 'kpi',
        week: 1,
        code: 'margin',
        value: 15,
        period,
        source: 'test',
      }),
    );
});
test('KPI duplicate metric-period rejected', () =>
  assert.throws(
    () =>
      run(ready(), {
        type: 'kpi',
        week: 1,
        code: 'margin',
        value: 20,
        period: '2026-09-04',
        source: 'test',
      }),
    /Ya existe/,
  ));
test('KPI does not modify CONTROL Score', () => {
  const s = ready();
  assert.deepEqual(getOrg(s, org).control, [10, 12, 16, 10]);
});
test('descending goals calculate progress correctly', () => {
  assert.equal(goalProgress({ baseline: 40, target: 20, current: 30 }), 50);
  assert.equal(goalProgress({ baseline: 40, target: 20, current: 15 }), 100);
});
test('new plan version preserves enrolled contract', () => {
  const s = seed(),
    p = getOrg(s, org).planId;
  const n = run(s, { type: 'planVersion', planId: p, checked: true }, 'admin');
  assert.equal(n.plans.length, 4);
  assert.equal(getOrg(n, org).planId, p);
  assert.ok(available(n, getOrg(n, org), 10));
});
test('duplicate open intervention rejected', () => {
  const c = {
    type: 'intervene',
    text: 'Datos pendientes',
    action: 'Solicitar evidencia',
    owner: 'Consultor',
    due: '2026-09-05',
  };
  assert.throws(() => run(run(seed(), c, 'admin'), c, 'admin'), /Ya existe/);
});
test('health thresholds reject equal or out of bounds', () => {
  for (const pair of [
    [50, 50],
    [101, 50],
    [75, -1],
  ])
    assert.throws(() =>
      run(
        seed(),
        { type: 'thresholds', green: pair[0], amber: pair[1] },
        'admin',
      ),
    );
});
test('separate internal intervention timeline flag', () => {
  const s = run(
    seed(),
    {
      type: 'intervene',
      text: 'Bloqueo de datos',
      action: 'Revisar fuente',
      owner: 'Consultor',
      due: '2026-09-05',
    },
    'admin',
  );
  assert.equal(getOrg(s, org).events[0].internal, true);
});
test('risk includes inactivity with explainable causes', () => {
  const s = seed();
  const h = health(s, getOrg(s, 'orbita'));
  assert.ok(h.reasons.some((x) => x.includes('sin actividad')));
  assert.ok(h.score >= 0 && h.score <= 100);
});
test('out of range rubric rejected', () =>
  assert.throws(() =>
    run(
      seed(),
      {
        type: 'score',
        values: [26, 10, 10, 10],
        text: 'Justificación con evidencia',
      },
      'admin',
    ),
  ));
test('unknown commands fail closed', () =>
  assert.throws(() => run(seed(), { type: 'hack' }), /no reconocida/));
test('same state serialization retains submitted evidence', () => {
  const s = ready();
  const restored = JSON.parse(JSON.stringify(s));
  assert.deepEqual(
    requirements(getOrg(restored, org), 1),
    requirements(getOrg(s, org), 1),
  );
});
test('evidence keeps allowed file metadata beside the description', () => {
  const files = [{ id: 'f1', name: 'sustento.pdf', size: 1200, type: 'PDF' }];
  const s = run(seed(), {
    type: 'submit',
    taskId: 'norte-1-0',
    text: 'Sustento con documento verificable',
    files,
  });
  assert.deepEqual(getOrg(s, org).tasks[0].evidence[0].files, files);
});
test('admin creates a module with plan, week and files', () => {
  const s = run(
    seed(),
    {
      type: 'createModule',
      title: 'Finanzas prácticas',
      description: 'Material para completar el tablero financiero.',
      week: 6,
      planId: 'all',
      files: [{ id: 'f2', name: 'tablero.xlsx', size: 3200, type: 'EXCEL' }],
    },
    'admin',
  );
  assert.equal(s.modules[0].week, 6);
  assert.equal(s.modules[0].files[0].type, 'EXCEL');
});
test('module rejects disguised or unsupported file metadata', () => {
  assert.throws(
    () =>
      run(
        seed(),
        {
          type: 'createModule',
          title: 'Archivo inválido',
          description: 'No debe aceptar ejecutables disfrazados.',
          week: 1,
          planId: 'all',
          files: [{ id: 'bad', name: 'archivo.exe', size: 100, type: 'EXCEL' }],
        },
        'admin',
      ),
    /Solo se aceptan/,
  );
});
test('client cannot manage modules or users', () => {
  assert.throws(
    () => run(seed(), { type: 'deleteModule', targetId: 'module-w1' }),
    /administración/,
  );
  assert.throws(
    () => run(seed(), { type: 'toggleUser', targetId: 'user-orbita' }),
    /administración/,
  );
});
test('suspending a user preserves the record', () => {
  const s = run(
    seed(),
    { type: 'toggleUser', targetId: 'user-orbita' },
    'admin',
  );
  assert.equal(
    s.users.find((user) => user.id === 'user-orbita').status,
    'ACTIVO',
  );
});
test('finance rejects non-positive amounts and records valid entries', () => {
  assert.throws(
    () =>
      run(
        seed(),
        {
          type: 'finance',
          kind: 'INGRESO',
          amount: 0,
          category: 'Cuota',
          period: '2026-09-04',
          status: 'PAGADO',
          note: 'Pago demo',
        },
        'admin',
      ),
    /Importe/,
  );
  const s = run(
    seed(),
    {
      type: 'finance',
      kind: 'INGRESO',
      amount: 500,
      category: 'Cuota',
      period: '2026-09-04',
      status: 'PAGADO',
      note: 'Pago demo',
    },
    'admin',
  );
  assert.equal(getOrg(s, org).finances[0].amount, 500);
});
test('follow-up records owner and can be completed', () => {
  let s = run(
    seed(),
    {
      type: 'followUp',
      text: 'Validar la propuesta final',
      owner: 'Consultor',
      due: '2026-09-10',
    },
    'admin',
  );
  const follow = getOrg(s, org).followUps[0];
  s = run(s, { type: 'completeFollowUp', targetId: follow.id }, 'admin');
  assert.equal(getOrg(s, org).followUps[0].status, 'COMPLETADO');
});
