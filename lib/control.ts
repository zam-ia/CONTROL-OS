// Demo domain only. These checks are NOT a server authorization boundary.
export type Mode = 'client' | 'admin';
export type Attachment = {
  id: string;
  name: string;
  size: number;
  type: 'PDF' | 'WORD' | 'EXCEL';
};
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'REVIEW' | 'DONE';
export type Evidence = {
  id: string;
  text: string;
  at: string;
  status: 'SUBMITTED' | 'ACCEPTED' | 'CHANGES_REQUESTED';
  feedback: string;
  files: Attachment[];
};
export type Task = {
  id: string;
  week: number;
  title: string;
  due: string;
  priority: 'Alta' | 'Media' | 'Crítica';
  status: TaskStatus;
  evidence: Evidence[];
  blocker: string;
};
export type WeekRun = {
  number: number;
  content: boolean;
  checklist: boolean;
  kpi: boolean;
  gate: 'OPEN' | 'REVIEW' | 'APPROVED' | 'CHANGES';
  feedback: string;
};
export type Kpi = {
  id: string;
  code: string;
  value: number;
  period: string;
  source: string;
  at: string;
  status: 'REPORTED' | 'VALIDATED';
};
export type Event = {
  id: string;
  at: string;
  actor: Mode;
  text: string;
  internal: boolean;
};
export type Intervention = {
  id: string;
  reason: string;
  action: string;
  owner: string;
  due: string;
  severity: string;
  status: 'OPEN' | 'RESOLVED';
  outcome: string;
};
export type Goal = {
  id: string;
  title: string;
  baseline: number;
  target: number;
  current: number;
  unit: string;
  due: string;
};
export type FinanceEntry = {
  id: string;
  kind: 'INGRESO' | 'EGRESO';
  category: string;
  amount: number;
  date: string;
  status: 'PAGADO' | 'PENDIENTE' | 'VENCIDO';
  note: string;
};
export type FollowUp = {
  id: string;
  at: string;
  summary: string;
  owner: string;
  due: string;
  status: 'ABIERTO' | 'COMPLETADO';
};
export type Org = {
  id: string;
  name: string;
  person: string;
  planId: string;
  current: number;
  baseline: number[];
  control: number[];
  lastActivity: string;
  tasks: Task[];
  weeks: WeekRun[];
  kpis: Kpi[];
  goals: Goal[];
  events: Event[];
  interventions: Intervention[];
  notes: { text: string; shared: boolean }[];
  session: { title: string; date: string; agenda: string; attended: boolean };
  support: { id: string; text: string; reply: string }[];
  finances: FinanceEntry[];
  followUps: FollowUp[];
};
export type Plan = {
  id: string;
  name: string;
  version: number;
  stages: number[];
  team: number;
  sessions: number;
  advanced: boolean;
};
export type State = {
  schema: 1;
  orgs: Org[];
  plans: Plan[];
  thresholds: { green: number; amber: number };
  selected: string;
  modules: {
    id: string;
    title: string;
    description: string;
    week: number;
    planId: string;
    files: Attachment[];
    createdAt: string;
  }[];
  users: {
    id: string;
    name: string;
    email: string;
    role: 'CLIENTE' | 'CONSULTOR' | 'OPERADOR' | 'ADMIN';
    orgId: string;
    status: 'ACTIVO' | 'SUSPENDIDO';
    lastAccess: string;
  }[];
};
export const stages = [
  'Claridad y Diagnóstico',
  'Sistema Operativo Interno',
  'Delegación y Controles',
  'Escalar con Propósito',
];
export const weeks = [
  {
    title: 'Radiografía real del negocio',
    objective:
      'Establece tu línea base de tiempo, carga y números del negocio.',
    tasks: [
      'Registrar el tiempo real del fundador',
      'Mapear la carga operativa',
      'Documentar los números base',
    ],
    gate: 'Línea base verificable y datos críticos completos.',
  },
  {
    title: 'Dinero, fugas y rentabilidad',
    objective:
      'Comprende el margen, los costos y las fugas que afectan a tu negocio.',
    tasks: [
      'Preparar un P&L simplificado',
      'Priorizar las fugas presupuestarias',
      'Calcular el margen por servicio',
    ],
    gate: 'Un margen verificable y una lista priorizada de fugas.',
  },
  {
    title: 'Dirección y oferta clara',
    objective: 'Define tu cliente ideal, el foco y una oferta prioritaria.',
    tasks: [
      'Completar la matriz de foco',
      'Definir el perfil de cliente ideal',
      'Documentar la oferta y su unidad económica',
    ],
    gate: 'Una oferta prioritaria aprobada con unidad económica conocida.',
  },
  {
    title: 'Organización del trabajo',
    objective: 'Visualiza quién hace qué y dónde se concentran las decisiones.',
    tasks: [
      'Mapear los roles críticos',
      'Construir una matriz RACI ligera',
      'Inventariar las reuniones y decisiones',
    ],
    gate: 'Roles críticos con owner y decisiones sin dueño identificadas.',
  },
  {
    title: 'Procesos críticos',
    objective:
      'Documenta los procesos que sostienen la entrega, venta y operación.',
    tasks: [
      'Documentar el SOP de entrega',
      'Documentar el SOP comercial',
      'Asignar owner y KPI a tres procesos',
    ],
    gate: 'Tres procesos críticos con owner, SOP mínimo y KPI.',
  },
  {
    title: 'Control financiero operativo',
    objective: 'Convierte los números en una rutina de gestión.',
    tasks: [
      'Preparar el tablero financiero',
      'Definir presupuesto y punto de equilibrio',
      'Agendar la cadencia financiera',
    ],
    gate: 'Cadencia financiera definida y KPIs base cargados.',
  },
  {
    title: 'Delegación con responsabilidad',
    objective:
      'Mueve trabajo desde el fundador sin perder calidad ni trazabilidad.',
    tasks: [
      'Construir la matriz de delegación',
      'Acordar límites de decisión',
      'Transferir dos responsabilidades',
    ],
    gate: 'Dos responsabilidades transferidas con criterios de control.',
  },
  {
    title: 'Sistema de control y reuniones',
    objective: 'Opera con indicadores y reuniones cortas de decisión.',
    tasks: [
      'Configurar el CONTROL Board',
      'Realizar la reunión semanal',
      'Registrar las decisiones y responsables',
    ],
    gate: 'Dashboard activo y primera revisión ejecutada.',
  },
  {
    title: 'Automatización y reducción de fricción',
    objective: 'Reduce las tareas repetitivas sobre procesos estables.',
    tasks: [
      'Inventariar oportunidades de automatización',
      'Documentar un piloto',
      'Planificar el retiro de un control duplicado',
    ],
    gate: 'Un piloto y un control duplicado con plan de retiro.',
  },
  {
    title: 'Preparación para escalar',
    objective:
      'Valida capacidad, demanda y restricciones antes de aumentar volumen.',
    tasks: [
      'Construir el modelo de capacidad',
      'Documentar CAC y LTV',
      'Identificar el cuello de botella de crecimiento',
    ],
    gate: 'Cuello de botella del siguiente nivel identificado.',
  },
  {
    title: 'Escalamiento con propósito',
    objective: 'Define un crecimiento compatible con caja, margen y capacidad.',
    tasks: [
      'Construir los escenarios de crecimiento',
      'Definir disparadores de contratación',
      'Documentar guardrails y riesgos',
    ],
    gate: 'Escenario base aprobado con guardrails financieros y operativos.',
  },
  {
    title: 'Roadmap 90 y cierre',
    objective:
      'Convierte lo construido en un plan medible para los próximos 90 días.',
    tasks: [
      'Comparar línea base y resultados',
      'Preparar el roadmap de 90 días',
      'Asignar responsables y revisiones',
    ],
    gate: 'Plan de 90 días aprobado con métricas y responsables activos.',
  },
];
export const dimensions = [
  'Finanzas',
  'Operación',
  'Estrategia',
  'Adquisición',
];
export const definitions = [
  {
    code: 'margin',
    name: 'Margen operativo',
    unit: '%',
    min: -100,
    max: 100,
    financial: true,
  },
  {
    code: 'hours',
    name: 'Horas del fundador en operación',
    unit: 'h/sem',
    min: 0,
    max: 168,
    financial: false,
  },
  {
    code: 'revenue',
    name: 'Ingresos mensuales',
    unit: 'PEN',
    min: 0,
    max: 1e12,
    financial: true,
  },
  {
    code: 'cac',
    name: 'Costo de adquisición (CAC)',
    unit: 'PEN',
    min: 0,
    max: 1e10,
    financial: true,
  },
  {
    code: 'ltv',
    name: 'Valor del cliente (LTV)',
    unit: 'PEN',
    min: 0,
    max: 1e12,
    financial: true,
  },
];
export const statusLabels: Record<string, string> = {
  TODO: 'Pendiente',
  IN_PROGRESS: 'En curso',
  BLOCKED: 'Bloqueada',
  REVIEW: 'En revisión',
  DONE: 'Completada',
  OPEN: 'Abierto',
  APPROVED: 'Aprobado',
  CHANGES: 'Cambios solicitados',
  RESOLVED: 'Resuelta',
  REPORTED: 'Reportado',
  VALIDATED: 'Validado',
  SUBMITTED: 'Enviada',
  ACCEPTED: 'Aceptada',
  CHANGES_REQUESTED: 'Cambios solicitados',
  ACTIVO: 'Activo',
  SUSPENDIDO: 'Suspendido',
  PAGADO: 'Pagado',
  PENDIENTE: 'Pendiente',
  VENCIDO: 'Vencido',
  ABIERTO: 'Abierto',
  COMPLETADO: 'Completado',
};
export const now = () => new Date().toISOString();
const id = () => globalThis.crypto.randomUUID();
export function seed(): State {
  const today = new Date();
  const date = (days: number) => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  };
  const plans: Plan[] = [
    {
      id: 'diagnostico-v1',
      name: 'CONTROL Score',
      version: 1,
      stages: [1],
      team: 1,
      sessions: 1,
      advanced: false,
    },
    {
      id: 'implementacion-v1',
      name: 'CONTROL 90',
      version: 1,
      stages: [1, 2, 3],
      team: 5,
      sessions: 4,
      advanced: true,
    },
    {
      id: 'partnership-v1',
      name: 'CONTROL Partner',
      version: 1,
      stages: [1, 2, 3, 4],
      team: 10,
      sessions: 8,
      advanced: true,
    },
  ];
  const orgs: Org[] = [
    {
      id: 'norte',
      name: 'Estudio Norte',
      person: 'Ana Pérez',
      planId: plans[1].id,
      current: 1,
      baseline: [10, 12, 16, 10],
      control: [10, 12, 16, 10],
    },
    {
      id: 'orbita',
      name: 'Órbita Consultores',
      person: 'Diego Ruiz',
      planId: plans[0].id,
      current: 2,
      baseline: [8, 9, 12, 9],
      control: [9, 10, 12, 9],
    },
    {
      id: 'vertice',
      name: 'Vértice B2B',
      person: 'Lucía Torres',
      planId: plans[2].id,
      current: 10,
      baseline: [12, 11, 15, 12],
      control: [20, 21, 20, 18],
    },
  ].map(
    (base, index): Org => ({
      ...base,
      lastActivity: date(index === 1 ? -9 : 0),
      tasks: weeks.flatMap((w, i) =>
        w.tasks.map((title, j) => ({
          id: base.id + '-' + (i + 1) + '-' + j,
          week: i + 1,
          title,
          due: date(
            i < base.current - 1
              ? -10
              : index === 1
                ? -4
                : 2 + j + (i - base.current + 1) * 7,
          ),
          priority: j === 0 ? 'Alta' : 'Media',
          status: i < base.current - 1 ? 'DONE' : 'TODO',
          blocker: '',
          evidence:
            i < base.current - 1
              ? [
                  {
                    id: 'seed-' + i + '-' + j,
                    text: 'Evidencia ficticia validada para demostrar el histórico.',
                    at: date(-12),
                    status: 'ACCEPTED',
                    feedback: 'Validación ilustrativa',
                    files: [],
                  },
                ]
              : [],
        })),
      ),
      weeks: weeks.map((_, i) => ({
        number: i + 1,
        content: i < base.current - 1,
        checklist: i < base.current - 1,
        kpi: i < base.current - 1,
        gate: i < base.current - 1 ? 'APPROVED' : 'OPEN',
        feedback: '',
      })),
      kpis: [
        {
          id: 'baseline-margin',
          code: 'margin',
          value: 12 + index * 3,
          period: date(-30),
          source: 'Línea base ficticia',
          at: date(-30),
          status: 'VALIDATED',
        },
        {
          id: 'baseline-hours',
          code: 'hours',
          value: 45 - index * 7,
          period: date(-30),
          source: 'Registro ilustrativo',
          at: date(-30),
          status: 'VALIDATED',
        },
      ],
      goals: [
        {
          id: 'goal-margin',
          title: 'Mejorar el margen operativo',
          baseline: 12 + index * 3,
          target: 22 + index * 3,
          current: 12 + index * 3,
          unit: '%',
          due: date(30),
        },
        {
          id: 'goal-hours',
          title: 'Recuperar tiempo del fundador',
          baseline: 45 - index * 7,
          target: 30 - index * 7,
          current: 45 - index * 7,
          unit: 'h/sem',
          due: date(60),
        },
      ],
      events: [
        {
          id: 'welcome',
          at: now(),
          actor: 'admin',
          text: 'Workspace de demostración activado. Datos ficticios.',
          internal: false,
        },
      ],
      interventions: [],
      notes: [],
      session: {
        title: 'Revisión de implementación',
        date: date(3) + 'T15:00:00Z',
        agenda: 'Línea base, evidencia y próximos pasos.',
        attended: false,
      },
      support: [],
      finances: [
        {
          id: 'finance-' + base.id + '-1',
          kind: 'INGRESO',
          category: 'Programa CONTROL',
          amount: 2400 + index * 900,
          date: date(-12),
          status: index === 1 ? 'PENDIENTE' : 'PAGADO',
          note: 'Movimiento ficticio de demostración',
        },
        {
          id: 'finance-' + base.id + '-2',
          kind: 'EGRESO',
          category: 'Horas de consultoría',
          amount: 620 + index * 120,
          date: date(-7),
          status: 'PAGADO',
          note: 'Costo interno estimado',
        },
      ],
      followUps: [
        {
          id: 'follow-' + base.id,
          at: now(),
          summary: 'Revisar entregables y acordar el siguiente hito.',
          owner: 'Consultor demo',
          due: date(4),
          status: 'ABIERTO',
        },
      ],
    }),
  );
  return {
    schema: 1,
    orgs,
    plans,
    thresholds: { green: 75, amber: 50 },
    selected: 'norte',
    modules: [
      [
        'module-w1',
        'Mapa de Fugas™',
        'Detecta fugas financieras, operativas y comerciales antes de intentar vender más.',
        1,
        'Mapa_de_Fugas.xlsx',
        'EXCEL',
      ],
      [
        'module-w2',
        'Founder Freedom Map™',
        'Clasifica actividades para eliminar, automatizar, delegar o mantener.',
        2,
        'Founder_Freedom_Map.xlsx',
        'EXCEL',
      ],
      [
        'module-w3',
        'Profit per Client™',
        'Analiza ingresos, costos y margen real de cada cliente.',
        3,
        'Profit_per_Client.xlsx',
        'EXCEL',
      ],
      [
        'module-w4',
        'Agency KPI Board™',
        'Convierte ingresos, utilidad, margen, CAC, LTV y tiempo del fundador en señales de decisión.',
        4,
        'Agency_KPI_Board.xlsx',
        'EXCEL',
      ],
      [
        'module-w5',
        'SOP Fast Track™',
        'Documenta los procesos críticos con owner y criterio de salida.',
        5,
        'SOP_Fast_Track.docx',
        'WORD',
      ],
      [
        'module-w6',
        'Pricing Profit Calculator™',
        'Calcula el precio mínimo compatible con costos y margen objetivo.',
        6,
        'Pricing_Profit_Calculator.xlsx',
        'EXCEL',
      ],
      [
        'module-w7',
        'CEO Control Review™',
        'Guía una revisión ejecutiva de resultados, fugas y decisiones.',
        8,
        'CEO_Control_Review.pdf',
        'PDF',
      ],
    ].map(([moduleId, title, description, week, fileName, type]) => ({
      id: String(moduleId),
      title: String(title),
      description: String(description),
      week: Number(week),
      planId: 'all',
      files: [
        {
          id: 'file-' + moduleId,
          name: String(fileName),
          size: 184320,
          type: type as Attachment['type'],
        },
      ],
      createdAt: now(),
    })),
    users: [
      {
        id: 'user-admin',
        name: 'Administrador Crisdal',
        email: 'admin@crisdalcompany.com',
        role: 'ADMIN',
        orgId: '',
        status: 'ACTIVO',
        lastAccess: now(),
      },
      {
        id: 'user-norte',
        name: 'Ana Pérez',
        email: 'ana@estudionorte.demo',
        role: 'CLIENTE',
        orgId: 'norte',
        status: 'ACTIVO',
        lastAccess: now(),
      },
      {
        id: 'user-orbita',
        name: 'Diego Ruiz',
        email: 'diego@orbita.demo',
        role: 'CLIENTE',
        orgId: 'orbita',
        status: 'SUSPENDIDO',
        lastAccess: date(-9),
      },
      {
        id: 'user-consultor',
        name: 'Mario Consultor',
        email: 'mario@control.demo',
        role: 'CONSULTOR',
        orgId: '',
        status: 'ACTIVO',
        lastAccess: date(-1),
      },
    ],
  };
}
export function getOrg(s: State, orgId: string) {
  const o = s.orgs.find((x) => x.id === orgId);
  if (!o) throw Error('Empresa no encontrada.');
  return o;
}
export function getPlan(s: State, o: Org) {
  const p = s.plans.find((x) => x.id === o.planId);
  if (!p) throw Error('Plan no encontrado.');
  return p;
}
export function available(s: State, o: Org, week: number): string {
  if (!Number.isInteger(week) || week < 1 || week > 12)
    return 'Semana inexistente.';
  if (!getPlan(s, o).stages.includes(Math.ceil(week / 3)))
    return 'Esta etapa no está incluida en el plan contratado.';
  if (week > 1 && o.weeks[week - 2].gate !== 'APPROVED')
    return 'Falta aprobar el cierre de la semana ' + (week - 1) + '.';
  return '';
}
export function requirements(o: Org, w: number) {
  const r = o.weeks[w - 1];
  const tasks = o.tasks.filter((t) => t.week === w);
  return [
    { label: 'Contenido mínimo revisado', ok: r.content },
    {
      label: 'Microacciones enviadas con evidencia',
      ok: tasks.every(
        (t) => ['DONE', 'REVIEW'].includes(t.status) && t.evidence.length > 0,
      ),
    },
    { label: 'Checklist de cierre confirmado', ok: r.checklist },
    { label: 'Check-in KPI registrado para esta semana', ok: r.kpi },
  ];
}
export function progress(o: Org, w: number) {
  const r = o.weeks[w - 1];
  const ts = o.tasks.filter((t) => t.week === w);
  return Math.round(
    20 * Number(r.content) +
      (45 * ts.filter((t) => ['DONE', 'REVIEW'].includes(t.status)).length) /
        Math.max(1, ts.length) +
      20 * Number(r.checklist) +
      15 * Number(r.kpi),
  );
}
export function programProgress(s: State, o: Org) {
  const allowed = o.weeks.filter((w) =>
    getPlan(s, o).stages.includes(Math.ceil(w.number / 3)),
  );
  return Math.round(
    (100 * allowed.filter((w) => w.gate === 'APPROVED').length) /
      Math.max(1, allowed.length),
  );
}
export function goalProgress(g: Goal) {
  if (g.target === g.baseline) return g.current === g.target ? 100 : 0;
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(((g.current - g.baseline) / (g.target - g.baseline)) * 100),
    ),
  );
}
export function execution(o: Org) {
  const ts = o.tasks.filter((t) => t.week <= o.current);
  const finished = ts.filter((t) => t.status === 'DONE');
  return Math.round(
    (35 *
      finished.filter(
        (t) =>
          new Date(t.evidence.at(-1)?.at || now()) <=
          new Date(t.due + 'T23:59:59Z'),
      ).length) /
      Math.max(1, ts.length) +
      (20 * o.weeks.filter((w) => w.number <= o.current && w.kpi).length) /
        o.current +
      (20 * o.weeks.filter((w) => w.gate === 'APPROVED').length) / o.current +
      15 * Number(o.session.attended) +
      10 *
        Number(Date.now() - new Date(o.lastActivity).getTime() < 7 * 86400000),
  );
}
export function health(s: State, o: Org) {
  const days = Math.max(
    0,
    Math.floor((Date.now() - new Date(o.lastActivity).getTime()) / 86400000),
  );
  const active = o.tasks.filter((t) => t.week <= o.current);
  const overdue = active.filter(
    (t) =>
      t.status !== 'DONE' &&
      new Date(t.due + 'T23:59:59Z').getTime() < Date.now(),
  ).length;
  const blocked = active.filter((t) => t.status === 'BLOCKED').length;
  const score = Math.round(
    execution(o) * 0.25 +
      (days < 7 ? 15 : 0) +
      (overdue === 0 ? 15 : 0) +
      (o.weeks[o.current - 1].kpi ? 15 : 0) +
      (o.session.attended ? 10 : 0) +
      (blocked === 0 ? 10 : 0) +
      5,
  );
  const reasons = [
    ...(days >= 7 ? [days + ' días sin actividad significativa'] : []),
    ...(overdue ? [overdue + ' tareas vencidas'] : []),
    ...(blocked ? [blocked + ' bloqueos abiertos'] : []),
    ...(!o.weeks[o.current - 1].kpi ? ['Falta check-in de la semana'] : []),
  ];
  return {
    score,
    days,
    overdue,
    blocked,
    reasons,
    label:
      score >= s.thresholds.green
        ? 'Estable'
        : score >= s.thresholds.amber
          ? 'Atención'
          : 'En riesgo',
    color:
      score >= s.thresholds.green
        ? ''
        : score >= s.thresholds.amber
          ? 'amber'
          : 'red',
  };
}
export type Command = {
  type: string;
  taskId?: string;
  week?: number;
  text?: string;
  value?: number;
  code?: string;
  period?: string;
  source?: string;
  field?: string;
  checked?: boolean;
  outcome?: string;
  targetId?: string;
  action?: string;
  owner?: string;
  due?: string;
  severity?: string;
  values?: number[];
  shared?: boolean;
  title?: string;
  target?: number;
  baseline?: number;
  unit?: string;
  planId?: string;
  green?: number;
  amber?: number;
  files?: Attachment[];
  description?: string;
  status?: string;
  role?: string;
  email?: string;
  name?: string;
  orgId?: string;
  amount?: number;
  kind?: string;
  category?: string;
  note?: string;
};
export function execute(
  s: State,
  orgId: string,
  mode: Mode,
  c: Command,
): State {
  const next = structuredClone(s);
  const o = getOrg(next, orgId);
  const staff = [
    'approveGate',
    'changesGate',
    'reviewTask',
    'intervene',
    'resolve',
    'score',
    'planVersion',
    'thresholds',
    'reply',
    'validateKpi',
    'createModule',
    'deleteModule',
    'createUser',
    'toggleUser',
    'deleteUser',
    'finance',
    'followUp',
    'completeFollowUp',
  ];
  if (staff.includes(c.type) && mode !== 'admin')
    throw Error('Esta acción corresponde a la vista de administración.');
  const needText = (x: unknown, min = 3) => {
    if (typeof x !== 'string' || x.trim().length < min || x.length > 10000)
      throw Error('Escribe información suficiente (máximo 10 000 caracteres).');
    return x.trim();
  };
  const validDate = (x: unknown) => {
    if (
      typeof x !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(x) ||
      Number.isNaN(Date.parse(x)) ||
      new Date(x).toISOString().slice(0, 10) !== x
    )
      throw Error('Fecha no válida.');
    return x;
  };
  const validFiles = (files: Attachment[] | undefined, required = false) => {
    if (required && !files?.length)
      throw Error('Adjunta al menos un PDF, Word o Excel.');
    const result = files || [];
    if (result.length > 10) throw Error('Adjunta un máximo de 10 archivos.');
    if (
      result.some((file) => {
        const extension = file.name.split('.').pop()?.toLowerCase();
        const expected =
          extension === 'pdf'
            ? 'PDF'
            : extension === 'doc' || extension === 'docx'
              ? 'WORD'
              : extension === 'xls' || extension === 'xlsx'
                ? 'EXCEL'
                : '';
        return (
          !file.name ||
          !expected ||
          file.type !== expected ||
          !Number.isFinite(file.size) ||
          file.size <= 0 ||
          file.size > 15 * 1024 * 1024
        );
      })
    )
      throw Error('Solo se aceptan PDF, Word o Excel de hasta 15 MB.');
    return result;
  };
  const weekly = () => {
    const w = c.week;
    if (!w || available(next, o, w))
      throw Error(w ? available(next, o, w) : 'Selecciona una semana.');
    return o.weeks[w - 1];
  };
  let event = '';
  let internal = false;
  if (c.type === 'submit' || c.type === 'block' || c.type === 'reviewTask') {
    const t = o.tasks.find((t) => t.id === c.taskId);
    if (!t) throw Error('Tarea no encontrada en esta empresa.');
    const blocked = available(next, o, t.week);
    if (blocked) throw Error(blocked);
    if (t.status === 'DONE')
      throw Error('La tarea ya fue validada; el histórico se conserva.');
    if (o.weeks[t.week - 1].gate === 'REVIEW' && c.type !== 'reviewTask')
      throw Error('La semana está en revisión.');
    if (c.type === 'submit') {
      const text = needText(c.text, 10);
      const files = validFiles(c.files);
      t.evidence.push({
        id: id(),
        text,
        at: now(),
        status: 'SUBMITTED',
        feedback: '',
        files,
      });
      t.status = 'REVIEW';
      t.blocker = '';
      event = 'Evidencia enviada: ' + t.title;
    } else if (c.type === 'block') {
      t.blocker = needText(c.text);
      t.status = 'BLOCKED';
      event = 'Bloqueo declarado: ' + t.title;
    } else {
      if (t.status !== 'REVIEW' || !t.evidence.length)
        throw Error('No hay evidencia pendiente.');
      const e = t.evidence.at(-1)!;
      e.feedback = needText(c.text);
      e.status = c.checked ? 'ACCEPTED' : 'CHANGES_REQUESTED';
      t.status = c.checked ? 'DONE' : 'IN_PROGRESS';
      if (!c.checked && o.weeks[t.week - 1].gate === 'REVIEW') {
        o.weeks[t.week - 1].gate = 'CHANGES';
        o.weeks[t.week - 1].feedback = e.feedback;
      }
      event = 'Evidencia revisada: ' + t.title;
    }
  } else if (c.type === 'weekFlag') {
    const w = weekly();
    if (w.gate === 'APPROVED' || w.gate === 'REVIEW')
      throw Error('El cierre está enviado o aprobado.');
    if (c.field !== 'content' && c.field !== 'checklist')
      throw Error('Campo no editable.');
    w[c.field] = Boolean(c.checked);
    event =
      'Semana ' +
      w.number +
      ': ' +
      (c.field === 'content' ? 'contenido revisado' : 'checklist actualizado');
  } else if (c.type === 'submitGate') {
    const w = weekly();
    if (!['OPEN', 'CHANGES'].includes(w.gate))
      throw Error('El cierre ya fue enviado.');
    if (!requirements(o, w.number).every((r) => r.ok))
      throw Error('Completa los requisitos del cierre antes de enviarlo.');
    w.gate = 'REVIEW';
    event = 'Cierre de semana ' + w.number + ' enviado a revisión';
  } else if (c.type === 'approveGate' || c.type === 'changesGate') {
    const w = weekly();
    if (w.gate !== 'REVIEW')
      throw Error('El cierre no está pendiente de revisión.');
    w.feedback = needText(c.text);
    if (c.type === 'approveGate') {
      if (!requirements(o, w.number).every((r) => r.ok))
        throw Error('Los requisitos ya no se cumplen.');
      if (o.tasks.some((t) => t.week === w.number && t.status !== 'DONE'))
        throw Error('Valida cada evidencia antes de aprobar la semana.');
      w.gate = 'APPROVED';
      o.current = Math.min(12, w.number + 1);
      event = 'Cierre aprobado · Semana ' + w.number;
    } else {
      w.gate = 'CHANGES';
      event = 'Cambios solicitados · Semana ' + w.number;
    }
  } else if (c.type === 'kpi') {
    const d = definitions.find((d) => d.code === c.code);
    if (
      !d ||
      typeof c.value !== 'number' ||
      !Number.isFinite(c.value) ||
      c.value < d.min ||
      c.value > d.max
    )
      throw Error('Valor fuera del rango permitido.');
    const period = validDate(c.period);
    if (o.kpis.some((k) => k.code === c.code && k.period === period))
      throw Error(
        'Ya existe ese indicador para el período. Conserva su trazabilidad.',
      );
    const w = weekly();
    if (w.gate === 'APPROVED')
      throw Error('Registra el dato en una semana abierta.');
    o.kpis.push({
      id: id(),
      code: d.code,
      value: c.value,
      period,
      source: needText(c.source),
      at: now(),
      status: 'REPORTED',
    });
    w.kpi = true;
    event = 'KPI registrado: ' + d.name + ' (dato reportado, no validado)';
  } else if (c.type === 'validateKpi') {
    const k = o.kpis.find((k) => k.id === c.targetId);
    if (!k) throw Error('KPI no encontrado.');
    k.status = 'VALIDATED';
    event = 'Dato KPI validado por consultor';
  } else if (c.type === 'goal') {
    const g = o.goals.find((g) => g.id === c.targetId);
    if (!g || typeof c.value !== 'number' || !Number.isFinite(c.value))
      throw Error('Objetivo o valor inválido.');
    g.current = c.value;
    event = 'Avance actualizado: ' + g.title;
  } else if (c.type === 'createGoal') {
    if (
      ![c.baseline, c.target].every(
        (x) => typeof x === 'number' && Number.isFinite(x),
      )
    )
      throw Error('Introduce baseline y meta válidos.');
    o.goals.push({
      id: id(),
      title: needText(c.title),
      baseline: c.baseline!,
      current: c.baseline!,
      target: c.target!,
      unit: needText(c.unit, 1),
      due: validDate(c.due),
    });
    event = 'Objetivo creado: ' + c.title;
  } else if (c.type === 'intervene') {
    const reason = needText(c.text);
    if (o.interventions.some((i) => i.reason === reason && i.status === 'OPEN'))
      throw Error('Ya existe una intervención abierta para esta causa.');
    o.interventions.push({
      id: id(),
      reason,
      action: needText(c.action),
      owner: needText(c.owner),
      due: validDate(c.due),
      severity: c.severity || 'Preventiva',
      status: 'OPEN',
      outcome: '',
    });
    event = 'Intervención creada: ' + reason;
    internal = true;
  } else if (c.type === 'resolve') {
    const i = o.interventions.find((i) => i.id === c.targetId);
    if (!i || i.status === 'RESOLVED')
      throw Error('Intervención no disponible.');
    i.outcome = needText(c.text);
    i.status = 'RESOLVED';
    event = 'Intervención resuelta';
    internal = true;
  } else if (c.type === 'note') {
    o.notes.push({ text: needText(c.text), shared: Boolean(c.shared) });
    event = 'Nota personal guardada';
  } else if (c.type === 'support') {
    o.support.push({ id: id(), text: needText(c.text), reply: '' });
    event = 'Consulta de soporte abierta';
  } else if (c.type === 'reply') {
    const t = o.support.find((t) => t.id === c.targetId);
    if (!t) throw Error('Consulta no encontrada.');
    t.reply = needText(c.text);
    event = 'Respuesta de soporte registrada';
  } else if (c.type === 'attendance') {
    o.session.attended = Boolean(c.checked);
    event = 'Asistencia ' + (c.checked ? 'confirmada' : 'retirada');
  } else if (c.type === 'agreement') {
    const w = weekly();
    o.tasks.push({
      id: id(),
      week: w.number,
      title: needText(c.text),
      due: validDate(c.due),
      priority: 'Alta',
      status: 'TODO',
      evidence: [],
      blocker: '',
    });
    if (w.gate === 'REVIEW' || w.gate === 'APPROVED')
      throw Error('No se pueden añadir acuerdos a una semana enviada.');
    event = 'Acuerdo convertido en tarea: ' + c.text;
  } else if (c.type === 'score') {
    if (
      !c.values ||
      c.values.length !== 4 ||
      c.values.some((v) => !Number.isInteger(v) || v < 0 || v > 25)
    )
      throw Error('Cada dimensión debe tener de 0 a 25 puntos.');
    const evidence = needText(c.text, 10);
    const before = o.control.join('/');
    o.control = [...c.values];
    event =
      'CONTROL Score: ' +
      before +
      ' → ' +
      o.control.join('/') +
      '. Justificación: ' +
      evidence;
  } else if (c.type === 'thresholds') {
    if (
      !Number.isInteger(c.green) ||
      !Number.isInteger(c.amber) ||
      c.amber! < 0 ||
      c.green! > 100 ||
      c.amber! >= c.green!
    )
      throw Error('Umbrales: 0 ≤ amarillo < verde ≤ 100.');
    next.thresholds = { green: c.green!, amber: c.amber! };
    event = 'Umbrales de salud actualizados';
    internal = true;
  } else if (c.type === 'planVersion') {
    const p = next.plans.find((p) => p.id === c.planId);
    if (!p) throw Error('Plan no encontrado.');
    const v =
      Math.max(
        ...next.plans.filter((x) => x.name === p.name).map((x) => x.version),
      ) + 1;
    next.plans.push({
      ...p,
      id: id(),
      version: v,
      stages: c.checked ? [1, 2, 3, 4] : [1, 2, 3],
    });
    event =
      'Nueva versión de ' +
      p.name +
      ' v' +
      v +
      ' creada; contratos anteriores conservados';
    internal = true;
  } else if (c.type === 'createModule') {
    const week = Number(c.week);
    if (!Number.isInteger(week) || week < 1 || week > 12)
      throw Error('Selecciona una semana válida.');
    if (c.planId !== 'all' && !next.plans.some((p) => p.id === c.planId))
      throw Error('Plan no válido.');
    const files = validFiles(c.files, true);
    next.modules.unshift({
      id: id(),
      title: needText(c.title),
      description: needText(c.description),
      week,
      planId: c.planId || 'all',
      files,
      createdAt: now(),
    });
    event = 'Módulo creado: ' + c.title;
    internal = true;
  } else if (c.type === 'deleteModule') {
    const before = next.modules.length;
    next.modules = next.modules.filter((m) => m.id !== c.targetId);
    if (before === next.modules.length) throw Error('Módulo no encontrado.');
    event = 'Módulo eliminado';
    internal = true;
  } else if (c.type === 'createUser') {
    const email = needText(c.email).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw Error('Correo no válido.');
    if (next.users.some((u) => u.email.toLowerCase() === email))
      throw Error('El correo ya está registrado.');
    const role = c.role as State['users'][number]['role'];
    if (!['CLIENTE', 'CONSULTOR', 'OPERADOR', 'ADMIN'].includes(role))
      throw Error('Rol no válido.');
    if (role === 'CLIENTE' && !next.orgs.some((item) => item.id === c.orgId))
      throw Error('Asigna una empresa al cliente.');
    next.users.unshift({
      id: id(),
      name: needText(c.name),
      email,
      role,
      orgId: c.orgId || '',
      status: 'ACTIVO',
      lastAccess: '',
    });
    event = 'Usuario creado: ' + c.name;
    internal = true;
  } else if (c.type === 'toggleUser') {
    const user = next.users.find((u) => u.id === c.targetId);
    if (!user) throw Error('Usuario no encontrado.');
    if (user.id === 'user-admin')
      throw Error('El administrador principal no puede suspenderse.');
    user.status = user.status === 'ACTIVO' ? 'SUSPENDIDO' : 'ACTIVO';
    event =
      (user.status === 'ACTIVO'
        ? 'Usuario reactivado: '
        : 'Usuario suspendido: ') + user.name;
    internal = true;
  } else if (c.type === 'deleteUser') {
    const user = next.users.find((u) => u.id === c.targetId);
    if (!user) throw Error('Usuario no encontrado.');
    if (user.id === 'user-admin')
      throw Error('El administrador principal no puede eliminarse.');
    next.users = next.users.filter((u) => u.id !== c.targetId);
    event = 'Usuario eliminado: ' + user.name;
    internal = true;
  } else if (c.type === 'finance') {
    const amount = Number(c.amount);
    if (!Number.isFinite(amount) || amount <= 0)
      throw Error('Importe no válido.');
    const kind = c.kind as FinanceEntry['kind'];
    const status = c.status as FinanceEntry['status'];
    if (
      !['INGRESO', 'EGRESO'].includes(kind) ||
      !['PAGADO', 'PENDIENTE', 'VENCIDO'].includes(status)
    )
      throw Error('Clasificación financiera no válida.');
    o.finances.unshift({
      id: id(),
      kind,
      category: needText(c.category),
      amount,
      date: validDate(c.period),
      status,
      note: needText(c.note),
    });
    event = 'Movimiento financiero registrado: ' + c.category;
    internal = true;
  } else if (c.type === 'followUp') {
    o.followUps.unshift({
      id: id(),
      at: now(),
      summary: needText(c.text),
      owner: needText(c.owner),
      due: validDate(c.due),
      status: 'ABIERTO',
    });
    event = 'Seguimiento programado: ' + c.text;
    internal = true;
  } else if (c.type === 'completeFollowUp') {
    const follow = o.followUps.find((f) => f.id === c.targetId);
    if (!follow) throw Error('Seguimiento no encontrado.');
    follow.status = 'COMPLETADO';
    event = 'Seguimiento completado: ' + follow.summary;
    internal = true;
  } else throw Error('Acción no reconocida.');
  o.events.unshift({ id: id(), at: now(), actor: mode, text: event, internal });
  if (mode === 'client' && !['note'].includes(c.type)) o.lastActivity = now();
  return next;
}
