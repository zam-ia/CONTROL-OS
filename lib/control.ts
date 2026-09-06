// Local prototype domain. These checks are NOT a server authorization boundary.
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
  unit: string;
  due: string;
  checkpoints: {
    id: string;
    title: string;
    completed: boolean;
  }[];
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
export type LessonStatus =
  | 'NO_INICIADO'
  | 'EN_PROGRESO'
  | 'ENVIADO'
  | 'EN_REVISION'
  | 'OBSERVADO'
  | 'APROBADO';
export type Lesson = {
  id: string;
  code: string;
  title: string;
  stage: number;
  week: number;
  planId: string;
  publication: 'BORRADOR' | 'PUBLICADO';
  description: string;
  objective: string;
  duration: number;
  videoUrl: string;
  thumbnailUrl: string;
  learnings: string[];
  action: string;
  resourceType: string;
  deliverable: string;
  due: string;
  points: number;
  requiresReview: boolean;
  requiredForUnlock: boolean;
  owner: 'C' | 'E' | 'C+E' | 'A';
  minAccess: 'LOW' | 'MEDIUM' | 'HIGH';
  approvalCriteria?: string;
  resourceId?: string;
  resourceVersion?: string;
};
export type LessonRun = {
  lessonId: string;
  videoCompleted: boolean;
  status: LessonStatus;
  response: string;
  feedback: string;
  due: string;
  manuallyUnlocked: boolean;
  requirementSkipped: boolean;
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
  support: {
    id: string;
    text: string;
    reply: string;
    type: 'METODOLOGICO' | 'TECNICO' | 'ACOMPANAMIENTO';
    priority: 'NORMAL' | 'ALTA' | 'URGENTE';
    privacy: 'PRIVADA' | 'COMUNIDAD';
    status: 'ABIERTO' | 'RESPONDIDO' | 'CERRADO';
    due: string;
    lessonId: string;
  }[];
  finances: FinanceEntry[];
  followUps: FollowUp[];
  lessonRuns: LessonRun[];
};
export type Plan = {
  id: string;
  name: string;
  version: number;
  stages: number[];
  team: number;
  sessions: number;
  advanced: boolean;
  accessLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  entitlements: {
    resourceTier: 'BASIC' | 'COMPLETE' | 'ADVANCED';
    reviewLimit: string;
    community: 'GENERAL' | 'PRIVADA';
    supportSlaHours: number;
    privateSupport: boolean;
    audit: 'NONE' | 'LIGHT' | 'FULL';
    post90DayPlan: boolean;
    maxStageAccess: number;
  };
};
export type MethodStep = {
  code: number;
  phase: 1 | 2 | 3 | 4;
  week: number;
  title: string;
  owner: 'C' | 'E' | 'C+E' | 'A';
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
    code?: string;
    category?: string;
    version?: string;
    tier?: 'BASIC' | 'COMPLETE' | 'ADVANCED';
    tags?: string[];
    relatedLesson?: string;
    editable?: boolean;
    editorialStatus?: 'LISTO' | 'EN_PRODUCCION';
  }[];
  users: {
    id: string;
    name: string;
    username: string;
    role: 'CLIENTE' | 'CONSULTOR' | 'OPERADOR' | 'ADMIN';
    orgId: string;
    status: 'ACTIVO' | 'SUSPENDIDO';
    lastAccess: string;
  }[];
  lessons: Lesson[];
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
export const methodOwnerLabels: Record<MethodStep['owner'], string> = {
  C: 'Cliente ejecuta',
  E: 'Equipo CONTROL ejecuta',
  'C+E': 'Trabajo colaborativo',
  A: 'Automático del sistema',
};
export const methodSteps: MethodStep[] = [
  [1, 1, 1, 'Levantamiento del tiempo del fundador', 'C'],
  [2, 1, 1, 'Mapa de carga y dependencia del fundador', 'C+E'],
  [3, 1, 1, 'Diagnóstico financiero inicial', 'C'],
  [4, 1, 1, 'P&L simplificado', 'A'],
  [5, 1, 1, 'Rentabilidad por servicio', 'C+E'],
  [6, 1, 1, 'Rentabilidad por cliente', 'C+E'],
  [7, 1, 1, 'Mapa de fugas CONTROL', 'E'],
  [8, 1, 1, 'Mapa operativo actual AS-IS', 'C+E'],
  [9, 1, 1, 'Inventario de procesos', 'C'],
  [10, 1, 1, 'CONTROL Score Día 0', 'A'],
  [11, 1, 2, 'Foto estratégica actual', 'C'],
  [12, 1, 2, 'Visión operativa a 12 meses', 'C'],
  [13, 1, 2, 'Mapa de restricciones', 'C+E'],
  [14, 1, 2, 'Análisis de portafolio', 'C'],
  [15, 1, 2, 'Matriz Foco CONTROL', 'A'],
  [16, 1, 2, 'ICP operativo', 'C+E'],
  [17, 1, 2, 'Claridad de propuesta', 'C+E'],
  [18, 1, 3, 'Auditoría de oferta actual', 'C+E'],
  [19, 1, 3, 'Oferta Mínima Rentable', 'C+E'],
  [20, 1, 3, 'Priorización de problemas', 'E'],
  [21, 1, 3, 'Backlog de mejoras', 'A'],
  [22, 1, 3, 'Roadmap de 90 días', 'C+E'],
  [23, 2, 4, 'Inventario total de trabajo', 'C'],
  [24, 2, 4, 'Clasificación EDAE', 'C+E'],
  [25, 2, 4, 'Registro de roles actuales', 'C'],
  [26, 2, 4, 'Detección de roles mal construidos', 'E'],
  [27, 2, 4, 'Organigrama funcional', 'E'],
  [28, 2, 4, 'Matriz RACI', 'C+E'],
  [29, 2, 4, 'Sistema de trabajo', 'C+E'],
  [30, 2, 4, 'Cadencia operativa', 'C+E'],
  [31, 2, 5, 'Selección de procesos críticos', 'E'],
  [32, 2, 5, 'Diseño de procesos TO-BE', 'C+E'],
  [33, 2, 5, 'Diseño de flujos', 'C+E'],
  [34, 2, 5, 'Asignación de process owner', 'E'],
  [35, 2, 5, 'Definición de SLA', 'C+E'],
  [36, 2, 5, 'Definición de KPI por proceso', 'A'],
  [37, 2, 5, 'Creación de SOP', 'C+E'],
  [38, 2, 5, 'Backlog de automatizaciones', 'E'],
  [39, 2, 6, 'Estructura de categorías financieras', 'E'],
  [40, 2, 6, 'Tablero financiero mensual', 'C'],
  [41, 2, 6, 'Rentabilidad continua', 'A'],
  [42, 2, 6, 'Presupuesto mensual', 'C+E'],
  [43, 2, 6, 'Umbrales por empresa', 'E'],
  [44, 2, 6, 'CONTROL Board', 'A'],
  [45, 2, 6, 'Reunión de control', 'C+E'],
  [46, 2, 6, 'Bitácora de mejoras', 'C+E'],
].map(([code, phase, week, title, owner]) => ({
  code: Number(code),
  phase: Number(phase) as MethodStep['phase'],
  week: Number(week),
  title: String(title),
  owner: owner as MethodStep['owner'],
}));
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
  NO_INICIADO: 'No iniciado',
  EN_PROGRESO: 'En progreso',
  ENVIADO: 'Enviado',
  EN_REVISION: 'En revisión',
  OBSERVADO: 'Observado',
  APROBADO: 'Aprobado',
  BORRADOR: 'Borrador',
  PUBLICADO: 'Publicado',
};
export const now = () => new Date().toISOString();
const id = () => globalThis.crypto.randomUUID();
function createOrganizationWorkspace(
  organizationId: string,
  name: string,
  person: string,
  planId: string,
  lessons: Lesson[],
): Org {
  const futureDate = (days: number) => {
    const value = new Date();
    value.setUTCDate(value.getUTCDate() + days);
    return value.toISOString().slice(0, 10);
  };
  return {
    id: organizationId,
    name,
    person,
    planId,
    current: 1,
    baseline: [0, 0, 0, 0],
    control: [0, 0, 0, 0],
    lastActivity: now(),
    tasks: weeks.flatMap((week, weekIndex) =>
      week.tasks.map((title, taskIndex) => ({
        id: organizationId + '-' + (weekIndex + 1) + '-' + taskIndex,
        week: weekIndex + 1,
        title,
        due: futureDate(2 + taskIndex + weekIndex * 7),
        priority: taskIndex === 0 ? 'Alta' : 'Media',
        status: 'TODO',
        evidence: [],
        blocker: '',
      })),
    ),
    weeks: weeks.map((_, index) => ({
      number: index + 1,
      content: false,
      checklist: false,
      kpi: false,
      gate: 'OPEN',
      feedback: '',
    })),
    kpis: [],
    goals: [],
    events: [
      {
        id: id(),
        at: now(),
        actor: 'admin',
        text: 'Empresa y espacio de trabajo creados.',
        internal: true,
      },
    ],
    interventions: [],
    notes: [],
    session: {
      title: 'Sesión de bienvenida',
      date: futureDate(3) + 'T15:00:00Z',
      agenda: 'Onboarding, objetivos y próximos pasos.',
      attended: false,
    },
    support: [],
    finances: [],
    followUps: [],
    lessonRuns: lessons
      .filter(
        (lesson) =>
          lesson.publication === 'PUBLICADO' &&
          (lesson.planId === 'all' || lesson.planId === planId),
      )
      .map((lesson, index) => ({
        lessonId: lesson.id,
        videoCompleted: false,
        status: 'NO_INICIADO',
        response: '',
        feedback: '',
        due: lesson.due,
        manuallyUnlocked: index === 0,
        requirementSkipped: false,
      })),
  };
}

// Curriculum source: CONTROL OS modules 03–04, version 1.1.
// YouTube links stay empty until the content team publishes each class.
export const advancedLessonBlueprints = [
  [
    '3.1.1',
    'El trabajo que debes dejar de hacer',
    'Identificar tareas que consumen al fundador y decidir si eliminar, delegar, automatizar o retener.',
    'Clasificar al menos 20 actividades y seleccionar las cinco que deben salir de la agenda en 30 días.',
    'RES-001',
    'Matriz EDAE + Top 5 firmado por founder.',
    '20 tareas clasificadas; Top 5 con destino, responsable y fecha.',
    'C',
  ],
  [
    '3.1.2',
    'Diseña los asientos antes de pensar en personas',
    'Separar las funciones del negocio de las personas actuales.',
    'Diseñar los asientos necesarios para operar el negocio a 12 meses.',
    'RES-002',
    'Organigrama funcional + ficha por asiento.',
    'Cada función crítica tiene un asiento, sin duplicidad y con owner claro.',
    'C',
  ],
  [
    '3.1.3',
    'Quién decide qué',
    'Definir derechos de decisión para eliminar escalamiento innecesario.',
    'Registrar entre 15 y 30 decisiones frecuentes y asignar nivel de autoridad.',
    'RES-003',
    'Matriz de decisiones aprobada.',
    'Toda decisión tiene responsable, límite y ruta de escalamiento.',
    'C+E',
  ],
  [
    '3.1.4',
    'Delegar sin tirar tareas por encima del muro',
    'Estandarizar el traspaso de una responsabilidad.',
    'Completar tres fichas reales para tareas del Top 5.',
    'RES-004',
    'Tres fichas de delegación completas.',
    'Cada ficha incluye resultado, estándar, recursos, fecha, KPI y revisión.',
    'C',
  ],
  [
    '3.1.5',
    'Capacidad real del equipo',
    'Medir carga antes de delegar o contratar.',
    'Estimar capacidad por rol y definir tres ajustes priorizados.',
    'RES-005',
    'Mapa de capacidad y tres ajustes.',
    'Horas coherentes, cuello de botella y acción definidos.',
    'C+E',
  ],
  [
    '3.1.6',
    'Checkpoint de delegación',
    'Cerrar la semana con decisiones implementables.',
    'Revisar Top 5, asientos, autoridad, handoffs y capacidad.',
    'RES-001',
    'Checkpoint aprobado u observado.',
    'Entregables clave aprobados y sprint de delegación definido.',
    'C+E',
  ],
  [
    '3.2.1',
    'Controla resultados, no movimientos',
    'Diferenciar actividad de resultado y escoger KPIs útiles.',
    'Definir de uno a tres KPIs por rol o proceso crítico.',
    'RES-006',
    'Set inicial de KPIs.',
    'Cada KPI tiene fórmula, fuente, frecuencia, owner, meta y umbral.',
    'C+E',
  ],
  [
    '3.2.2',
    'Scorecard por rol',
    'Crear una vista semanal simple de accountability.',
    'Construir scorecards para los roles críticos.',
    'RES-007',
    'Scorecards aprobados.',
    'Máximo siete métricas por rol y semáforo configurable.',
    'C',
  ],
  [
    '3.2.3',
    'La reunión que evita 30 mensajes',
    'Diseñar una cadencia de reuniones y una agenda de control.',
    'Configurar la reunión semanal con KPIs, bloqueos, decisiones y acciones.',
    'RES-008',
    'Cadencia + próxima reunión agendada.',
    'Agenda de hasta 60 minutos y acciones con owner y fecha.',
    'C+E',
  ],
  [
    '3.2.4',
    'Qué hacer cuando algo se sale del estándar',
    'Definir gestión de excepciones y escalamiento.',
    'Definir de cinco a diez eventos que requieren escalamiento.',
    'RES-009',
    'Protocolo de excepciones.',
    'Cada evento tiene umbral, canal, responsable, SLA y evidencia.',
    'C+E',
  ],
  [
    '3.2.5',
    'Calidad sin microgestión',
    'Instalar puntos de control y criterios de aceptación.',
    'Crear controles para tres procesos con mayor retrabajo o riesgo.',
    'RES-011',
    'Tres checklists QA.',
    'El control ocurre antes de la entrega y usa criterios objetivos.',
    'C',
  ],
  [
    '3.2.6',
    'Checkpoint de control',
    'Validar que delegación y control conviven.',
    'Revisar scorecards, reuniones, escalamiento y QA.',
    'RES-008',
    'Semana 8 aprobada u observada.',
    'Roles críticos con scorecard y reunión operativa activa.',
    'C+E',
  ],
  [
    '3.3.1',
    'Escalera de autonomía',
    'Asignar niveles de autonomía por responsabilidad.',
    'Asignar nivel actual y objetivo a responsabilidades críticas.',
    'RES-012',
    'Matriz actual a objetivo.',
    'Cada responsabilidad tiene nivel y fecha de revisión.',
    'C+E',
  ],
  [
    '3.3.2',
    'El tablero de decisiones del CEO',
    'Conservar solo las decisiones que realmente deben llegar al founder.',
    'Registrar decisiones de dos semanas y rediseñar el flujo.',
    'RES-013',
    'Decision Log y política v1.',
    'Reduce decisiones operativas y conserva trazabilidad.',
    'C',
  ],
  [
    '3.3.3',
    'Sprint de 30 días para soltar operación',
    'Ejecutar una delegación controlada con revisión progresiva.',
    'Planificar la transferencia de tres a cinco responsabilidades.',
    'RES-014',
    'Sprint 30D activo.',
    'Owner receptor, checkpoints, riesgo y métrica de éxito.',
    'C+E',
  ],
  [
    '3.3.4',
    'Rediseña la agenda del fundador',
    'Mover horas liberadas a estrategia, ventas clave, talento y capital.',
    'Diseñar la semana ideal y compararla con la línea base.',
    'RES-015',
    'Calendario CEO v1.',
    'Bloques estratégicos protegidos y límite de operación.',
    'C',
  ],
  [
    '3.3.5',
    'Control sin volver a meterte en todo',
    'Crear reglas de observación y revisión sin microgestión.',
    'Definir qué revisar, con qué frecuencia y cuándo intervenir.',
    'RES-016',
    'Política de control.',
    'No duplica controles y la intervención ocurre por excepción.',
    'C+E',
  ],
  [
    '3.3.6',
    'Cierre Etapa 3 + CONTROL Score #3',
    'Medir la reducción de dependencia y decidir readiness para escalar.',
    'Repetir mediciones clave y participar en la revisión del gate.',
    'RES-033',
    'CONTROL Score #3 + informe de delegación.',
    'Roles, scorecards, reuniones y sprint activos; founder hours medido.',
    'C+E',
  ],
  [
    '4.1.1',
    '¿De verdad debes escalar ahora?',
    'Evaluar readiness antes de aumentar volumen.',
    'Completar la evaluación de cinco dimensiones.',
    'RES-017',
    'Scale Readiness Score.',
    'No se aprueba escala con margen, capacidad o entrega en rojo sin mitigación.',
    'C',
  ],
  [
    '4.1.2',
    'Encuentra tu cuello de botella de crecimiento',
    'Identificar la restricción dominante usando datos.',
    'Seleccionar la restricción principal y adjuntar evidencia.',
    'RES-018',
    'Restricción prioritaria + hipótesis.',
    'La restricción se justifica con datos, no solo opinión.',
    'C+E',
  ],
  [
    '4.1.3',
    'Economía unitaria del crecimiento',
    'Medir margen, CAC, LTV, caja y capacidad al aumentar volumen.',
    'Simular escenarios de +20%, +50% y +100% de volumen.',
    'RES-019',
    'Escenarios de crecimiento.',
    'Cada escenario incluye ingresos, margen, CAC, capacidad y caja.',
    'C+E',
  ],
  [
    '4.1.4',
    'Escalar para qué',
    'Traducir propósito y ambición en una meta económica y operativa.',
    'Definir el resultado a 12 meses y sus trade-offs.',
    'RES-020',
    'North Star 12M.',
    'Meta cuantificada con dinero, margen, horas, capacidad e impacto.',
    'C',
  ],
  [
    '4.1.5',
    'Plan de capacidad',
    'Determinar recursos necesarios antes de vender más.',
    'Modelar personas, herramientas y proveedores para el objetivo 12M.',
    'RES-021',
    'Plan de capacidad.',
    'Cada recurso tiene fecha, costo y trigger de contratación o compra.',
    'C+E',
  ],
  [
    '4.1.6',
    'Checkpoint de preparación',
    'Decidir Go, Go condicionado o No Go.',
    'Revisar readiness, restricción, economics, objetivo y capacidad.',
    'RES-017',
    'Decisión de escalamiento registrada.',
    'Decisión soportada por datos, condiciones y bloqueos explícitos.',
    'C+E',
  ],
  [
    '4.2.1',
    'ICP rentable, no solo ICP atractivo',
    'Validar el cliente ideal con margen, entrega, recurrencia y resultados.',
    'Puntuar entre tres y cinco segmentos o clientes.',
    'RES-022',
    'ICP prioritario.',
    'Incluye economía y fit operativo.',
    'C',
  ],
  [
    '4.2.2',
    'Arquitectura de oferta y escalera de valor',
    'Alinear oferta de entrada, core y expansión sin dispersión.',
    'Diseñar los tres niveles de la escalera de valor.',
    'RES-023',
    'Escalera de valor.',
    'Cada nivel tiene promesa, precio, costo, margen y criterio de paso.',
    'C+E',
  ],
  [
    '4.2.3',
    'Motor de adquisición',
    'Definir canales, mensajes, CTA, destino y responsable.',
    'Diseñar un motor principal y uno secundario.',
    'RES-024',
    'Mapa de adquisición.',
    'Cada canal tiene objetivo, KPI, cadencia, presupuesto y handoff.',
    'C+E',
  ],
  [
    '4.2.4',
    'Sistema de autoridad',
    'Convertir experiencia y casos en activos de marca.',
    'Definir de tres a cuatro pilares y doce ideas ancla.',
    'RES-025',
    'Authority Content Map.',
    'Cada contenido se vincula a dolor, objeción o evidencia.',
    'C',
  ],
  [
    '4.2.5',
    'Embudo que termina en utilidad',
    'Diseñar el funnel desde atención hasta cliente rentable.',
    'Registrar conversiones actuales y metas por etapa.',
    'RES-026',
    'Modelo de funnel con unit economics.',
    'Calcula lead, reunión, propuesta, cierre, CAC y margen.',
    'C+E',
  ],
  [
    '4.2.6',
    'Backlog de experimentos',
    'Transformar crecimiento en hipótesis medibles.',
    'Priorizar tres experimentos para 30 días.',
    'RES-027',
    'Backlog 30D.',
    'Hipótesis, métrica, duración, presupuesto y criterio de éxito.',
    'C',
  ],
  [
    '4.3.1',
    'Plan de escala 90 días',
    'Convertir prioridades en objetivos, iniciativas, responsables y métricas.',
    'Definir hasta tres objetivos y sus iniciativas.',
    'RES-028',
    'Roadmap 90D.',
    'Owner, KPI, baseline, target, fechas y dependencias.',
    'C+E',
  ],
  [
    '4.3.2',
    'Pronóstico de caja y capacidad',
    'Evitar que el crecimiento rompa caja o entrega.',
    'Proyectar ventas, cobros, costos, contrataciones y capacidad.',
    'RES-029',
    'Forecast 90D.',
    'Incluye escenarios base, conservador y agresivo y caja mínima.',
    'C+E',
  ],
  [
    '4.3.3',
    'Registro de riesgos de escala',
    'Anticipar riesgos y definir respuestas.',
    'Registrar los diez principales riesgos y su mitigación.',
    'RES-030',
    'Matriz de riesgos.',
    'Probabilidad, impacto, owner, trigger y respuesta.',
    'C',
  ],
  [
    '4.3.4',
    'CEO Dashboard final',
    'Consolidar los indicadores que gobiernan el negocio.',
    'Seleccionar entre diez y doce indicadores y sus fuentes.',
    'RES-031',
    'CONTROL Board final.',
    'Cada indicador tiene owner, frecuencia y decisión asociada.',
    'C+E',
  ],
  [
    '4.3.5',
    'Readiness para Partnership',
    'Validar datos y gobierno para una relación base más utilidad incremental.',
    'Verificar reportes, fórmula, periodo base y exclusiones.',
    'RES-032',
    'Informe de readiness.',
    'No se aprueba sin baseline y fuentes verificables.',
    'C+E',
  ],
  [
    '4.3.6',
    'Cierre CONTROL: evidencia, Score final y próximo ciclo',
    'Comparar antes y después y convertir resultados en continuidad.',
    'Repetir CONTROL Score, registrar resultados y aprobar el próximo plan.',
    'RES-033',
    'Score final + Plan post-mentoría + caso interno.',
    'Separa resultado observado de promesa y adjunta evidencia.',
    'C+E',
  ],
] as const;

methodSteps.push(
  ...advancedLessonBlueprints.map((lesson, index) => {
    const phase = Number(lesson[0].split('.')[0]) as MethodStep['phase'];
    const block = Number(lesson[0].split('.')[1]);
    return {
      code: 47 + index,
      phase,
      week: phase === 3 ? block + 6 : block + 9,
      title: lesson[1],
      owner: lesson[7],
    };
  }),
);

export const curriculumResources = [
  ['RES-001', 'Matriz Stop Doing / EDAE', 7, 'Delegación', 'COMPLETE'],
  ['RES-002', 'Organigrama Funcional v2', 7, 'Delegación', 'COMPLETE'],
  ['RES-003', 'Matriz de Autoridad y Decisiones', 7, 'Delegación', 'COMPLETE'],
  ['RES-004', 'Ficha de Delegación CONTROL', 7, 'Delegación', 'COMPLETE'],
  ['RES-005', 'Calculadora de Capacidad Semanal', 7, 'Delegación', 'COMPLETE'],
  ['RES-006', 'Ficha KPI CONTROL', 8, 'Control', 'COMPLETE'],
  ['RES-007', 'Scorecard de Rol', 8, 'Control', 'COMPLETE'],
  ['RES-008', 'Agenda Weekly Control', 8, 'Control', 'COMPLETE'],
  ['RES-009', 'Matriz de Escalamiento', 8, 'Control', 'COMPLETE'],
  ['RES-010', 'Registro de Incidentes', 8, 'Control', 'COMPLETE'],
  ['RES-011', 'Checklist QA / Definition of Done', 8, 'Control', 'COMPLETE'],
  ['RES-012', 'Matriz de Autonomía', 9, 'Delegación', 'COMPLETE'],
  ['RES-013', 'Decision Log', 9, 'Control', 'COMPLETE'],
  ['RES-014', 'Sprint 30D', 9, 'Delegación', 'COMPLETE'],
  ['RES-015', 'Perfect CEO Week', 9, 'Delegación', 'COMPLETE'],
  ['RES-016', 'Política de Control y Revisión', 9, 'Control', 'COMPLETE'],
  ['RES-017', 'Scale Readiness Assessment', 10, 'Crecimiento', 'ADVANCED'],
  [
    'RES-018',
    'Mapa de Restricciones de Crecimiento',
    10,
    'Crecimiento',
    'ADVANCED',
  ],
  ['RES-019', 'Calculadora Economics of Growth', 10, 'Crecimiento', 'ADVANCED'],
  ['RES-020', 'Canvas Objetivo 12M', 10, 'Estrategia', 'ADVANCED'],
  ['RES-021', 'Capacity Growth Plan', 10, 'Crecimiento', 'ADVANCED'],
  ['RES-022', 'ICP Rentable Scorecard', 11, 'Crecimiento', 'ADVANCED'],
  ['RES-023', 'Offer Ladder Canvas', 11, 'Crecimiento', 'ADVANCED'],
  ['RES-024', 'Growth Engine Canvas', 11, 'Crecimiento', 'ADVANCED'],
  ['RES-025', 'Mapa de Autoridad', 11, 'Crecimiento', 'ADVANCED'],
  ['RES-026', 'Funnel Economics Sheet', 11, 'Crecimiento', 'ADVANCED'],
  ['RES-027', 'Growth Experiment Backlog', 11, 'Crecimiento', 'ADVANCED'],
  ['RES-028', 'Roadmap 90D de Escala', 12, 'Crecimiento', 'ADVANCED'],
  ['RES-029', 'Forecast Cash + Capacity', 12, 'Crecimiento', 'ADVANCED'],
  ['RES-030', 'Risk Register CONTROL', 12, 'Crecimiento', 'ADVANCED'],
  ['RES-031', 'CEO Dashboard', 12, 'Control', 'ADVANCED'],
  ['RES-032', 'Partnership Readiness Checklist', 12, 'Partnership', 'ADVANCED'],
  ['RES-033', 'Reporte Antes / Después', 12, 'Partnership', 'ADVANCED'],
  ['RES-034', 'Plantilla de Caso de Éxito interno', 12, 'Ejemplos', 'ADVANCED'],
] as const;

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
      accessLevel: 'LOW',
      entitlements: {
        resourceTier: 'BASIC',
        reviewLimit: 'Sin revisión mensual incluida',
        community: 'GENERAL',
        supportSlaHours: 48,
        privateSupport: false,
        audit: 'NONE',
        post90DayPlan: false,
        maxStageAccess: 1,
      },
    },
    {
      id: 'implementacion-v1',
      name: 'CONTROL 90',
      version: 1,
      stages: [1, 2, 3],
      team: 5,
      sessions: 4,
      advanced: true,
      accessLevel: 'MEDIUM',
      entitlements: {
        resourceTier: 'COMPLETE',
        reviewLimit: '2 revisiones por mes',
        community: 'PRIVADA',
        supportSlaHours: 24,
        privateSupport: true,
        audit: 'LIGHT',
        post90DayPlan: false,
        maxStageAccess: 3,
      },
    },
    {
      id: 'partnership-v1',
      name: 'CONTROL Partner',
      version: 1,
      stages: [1, 2, 3, 4],
      team: 10,
      sessions: 8,
      advanced: true,
      accessLevel: 'HIGH',
      entitlements: {
        resourceTier: 'ADVANCED',
        reviewLimit: 'Revisión prioritaria',
        community: 'PRIVADA',
        supportSlaHours: 8,
        privateSupport: true,
        audit: 'FULL',
        post90DayPlan: true,
        maxStageAccess: 4,
      },
    },
  ];
  const onboardingLessons: Lesson[] = [
    [
      '00.1',
      'Bienvenida a CONTROL',
      'Conoce el propósito del programa y cómo aprovechar el acompañamiento.',
      'Comprender el punto de partida y el compromiso de implementación.',
      'Ver el video completo.',
      'VIDEO',
      'Confirmar visualización y compromiso.',
    ],
    [
      '00.2',
      'Cómo funciona la metodología',
      'Recorre el mapa CONTROL y la lógica de sus etapas.',
      'Entender el camino completo antes de comenzar.',
      'Revisar las etapas del método.',
      'MAPA',
      'Confirmar que revisaste el mapa CONTROL.',
    ],
    [
      '00.3',
      'Cómo usar CONTROL OS',
      'Aprende a navegar, ejecutar y enviar sustentos.',
      'Usar la plataforma sin depender del equipo.',
      'Completar el recorrido guiado.',
      'CHECKLIST',
      'Completar el checklist de navegación.',
    ],
    [
      '00.4',
      'Reglas de trabajo',
      'Alinea expectativas, tiempos y responsabilidades.',
      'Trabajar con una cadencia y reglas explícitas.',
      'Aceptar los compromisos de trabajo.',
      'DOCUMENTO',
      'Confirmar la aceptación de compromisos.',
    ],
    [
      '00.5',
      'Conoce tu punto de partida',
      'Registra la información esencial del negocio.',
      'Construir una línea base útil y verificable.',
      'Completar el formulario del negocio.',
      'FORMULARIO',
      'Enviar la información inicial del negocio.',
    ],
    [
      '00.6',
      'CONTROL Score inicial',
      'Evalúa las cuatro dimensiones del sistema.',
      'Generar el diagnóstico inicial de madurez.',
      'Completar la evaluación CONTROL Score.',
      'DIAGNOSTICO',
      'Generar y enviar el score inicial.',
    ],
    [
      '00.7',
      'Tus primeros 90 días',
      'Convierte el diagnóstico en un objetivo prioritario.',
      'Definir un resultado medible para el ciclo.',
      'Registrar el objetivo principal.',
      'PLANTILLA',
      'Registrar el objetivo de los primeros 90 días.',
    ],
    [
      '00.8',
      'Sesión de Kickoff',
      'Prepara la agenda de inicio y los acuerdos clave.',
      'Salir con responsables y próximos pasos.',
      'Agendar o asistir a la sesión.',
      'SESION',
      'Completar la sesión de kickoff.',
    ],
  ].map(
    (
      [code, title, description, objective, action, resourceType, deliverable],
      index,
    ) => ({
      id: 'lesson-' + String(code).replace('.', '-'),
      code: String(code),
      title: String(title),
      stage: 0,
      week: 0,
      planId: 'all',
      publication: 'PUBLICADO',
      description: String(description),
      objective: String(objective),
      duration: 4 + index,
      videoUrl: '',
      thumbnailUrl: '',
      learnings: [
        String(objective),
        'Identificar la acción concreta de cierre.',
      ],
      action: String(action),
      resourceType: String(resourceType),
      deliverable: String(deliverable),
      due: date(index + 1),
      points: 10,
      requiresReview: index >= 4,
      requiredForUnlock: true,
      owner: index === 5 ? 'A' : index >= 4 ? 'C+E' : 'C',
      minAccess: 'LOW',
    }),
  );
  const methodologyLessons: Lesson[] = [
    [
      1,
      'Rastrea el tiempo del fundador',
      'Mide durante 5 a 7 días dónde se concentra el tiempo del fundador.',
      'Registrar actividades, duración, área y posibilidad de delegación.',
      'FORMULARIO',
      'Rastreador de Tiempo del Fundador',
      'C',
    ],
    [
      1,
      'Construye el mapa de dependencia',
      'Identifica decisiones, interrupciones y trabajo que todavía depende del fundador.',
      'Clasificar actividades por frecuencia, desgaste, riesgo y delegabilidad.',
      'PLANTILLA',
      'Mapa de Dependencia del Fundador',
      'C+E',
    ],
    [
      1,
      'Prepara la foto financiera',
      'Ordena ingresos, costos variables y costos fijos de los últimos meses.',
      'Cargar información financiera de los últimos 3 a 6 meses.',
      'EXCEL',
      'Foto Financiera CONTROL y P&L simplificado',
      'C+E',
    ],
    [
      1,
      'Mide la rentabilidad por servicio',
      'Distingue los servicios que generan margen de los que consumen capacidad.',
      'Registrar venta, costo, utilidad y margen de cada servicio.',
      'CALCULADORA',
      'Matriz de Rentabilidad por Servicio',
      'C+E',
    ],
    [
      1,
      'Mide la rentabilidad por cliente',
      'Calcula la contribución de cada cliente incluyendo horas y herramientas atribuibles.',
      'Completar ingresos y costos directos por cliente.',
      'EXCEL',
      'Matriz Cliente–Rentabilidad',
      'C+E',
    ],
    [
      1,
      'Mapea fugas y operación actual',
      'Convierte los datos en hallazgos y visualiza cómo entra y sale el trabajo.',
      'Documentar fugas y el flujo AS-IS del negocio.',
      'CANVAS',
      'Mapa de Fugas + Mapa Operativo AS-IS',
      'E',
    ],
    [
      2,
      'Define la foto estratégica actual',
      'Aclara qué vende la empresa, a quién y dónde genera dinero.',
      'Responder el diagnóstico de situación actual.',
      'FORMULARIO',
      'Foto Estratégica Actual',
      'C',
    ],
    [
      2,
      'Diseña la visión operativa a 12 meses',
      'Traduce la visión en facturación, margen, horas, equipo y clientes.',
      'Definir cinco metas operativas verificables.',
      'PLANTILLA',
      'Visión Operativa 12M',
      'C',
    ],
    [
      2,
      'Identifica las restricciones',
      'Detecta los límites reales de dinero, equipo, capacidad, procesos y oferta.',
      'Priorizar las restricciones que impiden avanzar.',
      'CANVAS',
      'Mapa de Restricciones',
      'C+E',
    ],
    [
      2,
      'Ordena el portafolio con la Matriz Foco',
      'Clasifica servicios para escalar, mantener, rediseñar o eliminar.',
      'Valorar margen, demanda, complejidad, capacidad y recurrencia.',
      'EXCEL',
      'Matriz Foco CONTROL',
      'C+E',
    ],
    [
      2,
      'Define el cliente y la propuesta prioritaria',
      'Une el ICP operativo con un problema, resultado y mecanismo concretos.',
      'Describir el cliente prioritario y la propuesta de valor.',
      'PLANTILLA',
      'ICP Operativo + Propuesta Prioritaria',
      'C+E',
    ],
    [
      3,
      'Audita la oferta actual',
      'Contrasta precio, alcance, costos, tiempo, margen y capacidad.',
      'Completar la auditoría económica y operativa de la oferta.',
      'CHECKLIST',
      'Auditoría de Oferta',
      'C+E',
    ],
    [
      3,
      'Construye la Oferta Mínima Rentable',
      'Diseña una oferta viable que proteja el margen y la entrega.',
      'Definir problema, resultado, alcance, precio, costo y capacidad.',
      'PLANTILLA',
      'Ficha OMR CONTROL',
      'C+E',
    ],
    [
      3,
      'Prioriza los problemas',
      'Pondera cada hallazgo por impacto, urgencia, esfuerzo y dependencia.',
      'Seleccionar los tres problemas que deben resolverse primero.',
      'MATRIZ',
      'Matriz de Priorización',
      'E',
    ],
    [
      3,
      'Convierte hallazgos en backlog',
      'Transforma prioridades en mejoras accionables y ordenadas.',
      'Asignar prioridad, responsable y resultado esperado.',
      'EXCEL',
      'Backlog de Mejoras',
      'C+E',
    ],
    [
      3,
      'Aprueba el roadmap de 90 días',
      'Organiza acciones para detener pérdidas, construir sistema y optimizar.',
      'Revisar el dossier y aprobar el roadmap de 0–30, 31–60 y 61–90 días.',
      'DOCUMENTO',
      'Dossier CONTROL + Roadmap 90 días',
      'C+E',
    ],
    [
      4,
      'Ordena el trabajo con EDAE',
      'Inventaría las actividades y decide qué eliminar, delegar, automatizar o ejecutar.',
      'Clasificar el trabajo recurrente de la empresa.',
      'EXCEL',
      'Matriz EDAE',
      'C+E',
    ],
    [
      4,
      'Diseña roles y organigrama funcional',
      'Separa personas de funciones y detecta roles contaminados.',
      'Registrar responsabilidades, horas y decisiones de cada rol.',
      'CANVAS',
      'Organigrama CONTROL v1',
      'E',
    ],
    [
      4,
      'Aclara responsabilidades con RACI',
      'Define quién ejecuta, aprueba, consulta y debe ser informado.',
      'Completar la matriz para las actividades críticas.',
      'EXCEL',
      'Matriz RACI',
      'C+E',
    ],
    [
      4,
      'Instala el sistema de trabajo',
      'Normaliza tareas, responsables, prioridad, fecha, evidencia y estado.',
      'Configurar el flujo operativo estándar.',
      'CHECKLIST',
      'Sistema de Trabajo Activo',
      'C+E',
    ],
    [
      4,
      'Define la cadencia de gestión',
      'Crea reuniones diarias, semanales y mensuales con propósito claro.',
      'Agendar la cadencia y documentar sus reglas.',
      'CALENDARIO',
      'Calendario de Gestión',
      'C+E',
    ],
    [
      5,
      'Selecciona los procesos críticos',
      'Prioriza de cinco a siete procesos que sostienen captación, venta y entrega.',
      'Aprobar el inventario inicial de procesos P1.',
      'CHECKLIST',
      'Inventario Priorizado de Procesos',
      'E',
    ],
    [
      5,
      'Diseña el proceso futuro TO-BE',
      'Rediseña cómo debería funcionar cada proceso crítico.',
      'Comparar AS-IS y TO-BE para eliminar fricción.',
      'CANVAS',
      'Mapas de Procesos TO-BE',
      'C+E',
    ],
    [
      5,
      'Construye flujos verificables',
      'Define entrada, actividad, decisión, responsable y salida.',
      'Diagramar el flujo de los procesos P1.',
      'CANVAS',
      'Flujos de Procesos P1',
      'C+E',
    ],
    [
      5,
      'Asigna owners y SLA',
      'Entrega una responsabilidad nominal y un tiempo de respuesta a cada proceso.',
      'Registrar owner y SLA de los procesos críticos.',
      'PLANTILLA',
      'Matriz de Owners y SLA',
      'E',
    ],
    [
      5,
      'Define KPI por proceso',
      'Convierte velocidad, conversión, retrabajo y cumplimiento en señales.',
      'Elegir un KPI útil para cada proceso P1.',
      'FORMULARIO',
      'Matriz de KPI Operativos',
      'C+E',
    ],
    [
      5,
      'Documenta SOP y automatizaciones',
      'Estandariza primero y automatiza después.',
      'Completar SOP v1 y clasificar automatizaciones por complejidad.',
      'SOP',
      'SOP Pack v1 + Backlog de Automatizaciones',
      'C+E',
    ],
    [
      6,
      'Crea el catálogo financiero',
      'Estandariza ingresos, costos variables, costos fijos y extraordinarios.',
      'Validar las categorías financieras de la empresa.',
      'EXCEL',
      'Catálogo Financiero',
      'E',
    ],
    [
      6,
      'Activa el tablero financiero mensual',
      'Controla ventas, cobranzas, gastos, margen, utilidad y caja.',
      'Cargar el primer período completo y revisar rentabilidad.',
      'CALCULADORA',
      'Dashboard Financiero Actualizado',
      'C+E',
    ],
    [
      6,
      'Define presupuesto y umbrales',
      'Establece máximos de gasto y semáforos propios para decidir a tiempo.',
      'Registrar presupuesto, reserva y umbrales por empresa.',
      'FORMULARIO',
      'Presupuesto + Umbrales de Control',
      'C+E',
    ],
    [
      6,
      'Configura el CONTROL Board',
      'Centraliza entre 10 y 12 indicadores financieros, operativos y comerciales.',
      'Seleccionar KPIs, fuente, frecuencia y responsable.',
      'TABLERO',
      'CONTROL Board',
      'A',
    ],
    [
      6,
      'Instala la reunión y bitácora de control',
      'Convierte cada desviación en causa, acción, responsable y fecha.',
      'Ejecutar la primera reunión y registrar una mejora.',
      'PLANTILLA',
      'Reunión de Control + Bitácora de Mejoras',
      'C+E',
    ],
  ].map(
    (
      [week, title, description, action, resourceType, deliverable, owner],
      index,
    ) => {
      const weekNumber = Number(week);
      const phase = weekNumber <= 3 ? 1 : 2;
      const position = index + 1;
      return {
        id: `lesson-${String(phase).padStart(2, '0')}-${weekNumber}-${position}`,
        code: `${String(phase).padStart(2, '0')}.${weekNumber}.${position}`,
        title: String(title),
        stage: phase,
        week: weekNumber,
        planId: 'all',
        publication: 'PUBLICADO',
        description: String(description),
        objective: String(description),
        duration: 8 + (index % 5) * 2,
        videoUrl: '',
        thumbnailUrl: '',
        learnings: [
          String(description),
          'Conectar el entregable con una decisión del negocio.',
        ],
        action: String(action),
        resourceType: String(resourceType),
        deliverable: String(deliverable),
        due: date(10 + index * 2),
        points: 20,
        requiresReview: owner !== 'A',
        requiredForUnlock: true,
        owner: owner as Lesson['owner'],
        minAccess: phase === 1 ? 'LOW' : 'MEDIUM',
      } as Lesson;
    },
  );
  const advancedCurriculum: Lesson[] = advancedLessonBlueprints.map(
    (
      [
        code,
        title,
        objective,
        action,
        resourceId,
        deliverable,
        approvalCriteria,
        owner,
      ],
      index,
    ) => {
      const stage = Number(code.split('.')[0]);
      const block = Number(code.split('.')[1]);
      const weekNumber = stage === 3 ? block + 6 : block + 9;
      return {
        id: 'lesson-' + code.replaceAll('.', '-'),
        code,
        title,
        stage,
        week: weekNumber,
        planId: 'all',
        publication: 'PUBLICADO',
        description: objective,
        objective,
        duration: 8 + (index % 4) * 2,
        videoUrl: '',
        thumbnailUrl: '',
        learnings: [
          objective,
          'Convertir el aprendizaje en evidencia verificable.',
        ],
        action,
        resourceType: 'PLANTILLA',
        deliverable,
        due: date(55 + index * 2),
        points: 25,
        requiresReview: true,
        requiredForUnlock: true,
        owner,
        minAccess: stage === 3 ? 'MEDIUM' : 'HIGH',
        approvalCriteria,
        resourceId,
        resourceVersion: '1.0.0',
      };
    },
  );
  const allLessons = [
    ...onboardingLessons,
    ...methodologyLessons,
    ...advancedCurriculum,
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
                    text: 'Evidencia histórica validada por el equipo.',
                    at: date(-12),
                    status: 'ACCEPTED',
                    feedback: 'Validación registrada por el equipo',
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
          source: 'Línea base registrada',
          at: date(-30),
          status: 'VALIDATED',
        },
        {
          id: 'baseline-hours',
          code: 'hours',
          value: 45 - index * 7,
          period: date(-30),
          source: 'Registro de línea base',
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
          unit: '%',
          due: date(30),
          checkpoints: [
            'Validar la línea base del margen',
            'Aplicar la acción prioritaria de rentabilidad',
            'Validar el resultado final con evidencia',
          ].map((title, checkpointIndex) => ({
            id: 'goal-margin-' + checkpointIndex,
            title,
            completed: false,
          })),
        },
        {
          id: 'goal-hours',
          title: 'Recuperar tiempo del fundador',
          baseline: 45 - index * 7,
          target: 30 - index * 7,
          unit: 'h/sem',
          due: date(60),
          checkpoints: [
            'Registrar la distribución actual del tiempo',
            'Delegar o eliminar una actividad crítica',
            'Validar la nueva carga semanal',
          ].map((title, checkpointIndex) => ({
            id: 'goal-hours-' + checkpointIndex,
            title,
            completed: false,
          })),
        },
      ],
      events: [
        {
          id: 'welcome',
          at: now(),
          actor: 'admin',
          text: 'Espacio de trabajo activado.',
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
          note: 'Movimiento inicial registrado',
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
          owner: 'Consultor asignado',
          due: date(4),
          status: 'ABIERTO',
        },
      ],
      lessonRuns: allLessons.map((lesson, lessonIndex) => {
        const advancedProgress = index === 2 && lessonIndex < 5;
        const secondClientProgress = index === 1 && lessonIndex === 0;
        return {
          lessonId: lesson.id,
          videoCompleted: advancedProgress || secondClientProgress,
          status: advancedProgress
            ? lessonIndex === 0
              ? 'APROBADO'
              : 'EN_PROGRESO'
            : secondClientProgress
              ? 'APROBADO'
              : lessonIndex === 0
                ? 'EN_PROGRESO'
                : 'NO_INICIADO',
          response:
            advancedProgress && lessonIndex === 0
              ? 'Bienvenida completada.'
              : '',
          feedback: '',
          due: lesson.due,
          manuallyUnlocked:
            advancedProgress ||
            lessonIndex === 0 ||
            (index === 1 && lessonIndex === 1),
          requirementSkipped: false,
        } as LessonRun;
      }),
    }),
  );
  return {
    schema: 1,
    orgs,
    plans,
    thresholds: { green: 75, amber: 50 },
    selected: 'norte',
    modules: (
      [
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
        category: Number(week) <= 3 ? 'Diagnóstico' : 'Operaciones',
        version: '1.0.0',
        tier: Number(week) <= 3 ? ('BASIC' as const) : ('COMPLETE' as const),
        tags: ['CONTROL', 'implementación'],
        editable: true,
        editorialStatus: 'LISTO' as const,
      })) as State['modules']
    ).concat(
      curriculumResources.map(([code, title, week, category, tier]) => ({
        id: code.toLowerCase(),
        code,
        title,
        description:
          'Plantilla editable con guía de uso y ejemplo resuelto vinculada a la ruta CONTROL.',
        week,
        planId: 'all',
        files: [],
        createdAt: now(),
        category,
        version: '1.0.0',
        tier,
        tags: [category, 'plantilla', `semana-${week}`],
        relatedLesson: advancedLessonBlueprints.find(
          (lesson) => lesson[4] === code,
        )?.[0],
        editable: true,
        editorialStatus: 'EN_PRODUCCION' as const,
      })) as State['modules'],
    ),
    users: [
      {
        id: 'user-admin',
        name: 'Aldair Crizam',
        username: 'aldaircrizam',
        role: 'ADMIN',
        orgId: '',
        status: 'ACTIVO',
        lastAccess: now(),
      },
      {
        id: 'user-norte',
        name: 'Ana Pérez',
        username: 'cliente.norte',
        role: 'CLIENTE',
        orgId: 'norte',
        status: 'ACTIVO',
        lastAccess: now(),
      },
      {
        id: 'user-orbita',
        name: 'Diego Ruiz',
        username: 'cliente.orbita',
        role: 'CLIENTE',
        orgId: 'orbita',
        status: 'SUSPENDIDO',
        lastAccess: date(-9),
      },
      {
        id: 'user-consultor',
        name: 'Mario Consultor',
        username: 'consultor.control',
        role: 'CONSULTOR',
        orgId: '',
        status: 'ACTIVO',
        lastAccess: date(-1),
      },
    ],
    lessons: allLessons,
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
    return 'Esta profundidad de acompañamiento no está incluida en el plan actual. Tu información y progreso se conservan para una futura ampliación.';
  if (week > 1 && o.weeks[week - 2].gate !== 'APPROVED')
    return 'Falta aprobar el cierre de la semana ' + (week - 1) + '.';
  if (week > 3 && (week - 1) % 3 === 0 && o.current <= week) {
    const previousPhase = Math.ceil(week / 3) - 1;
    const gate = phaseGate(s, o, previousPhase);
    if (!gate.ready)
      return `Falta completar el Gate de Salida de la Fase ${previousPhase}.`;
  }
  return '';
}
export function phaseGate(s: State, o: Org, phase: number) {
  const approved = (week: number) => o.weeks[week - 1]?.gate === 'APPROVED';
  const done = (week: number) =>
    o.tasks.filter((task) => task.week === week && task.status === 'DONE')
      .length;
  const validated = (code: string) =>
    o.kpis.some((kpi) => kpi.code === code && kpi.status === 'VALIDATED');
  const approvedLesson = (code: string) => {
    const lesson = s.lessons.find((item) => item.code === code);
    return Boolean(
      lesson &&
      o.lessonRuns.find((run) => run.lessonId === lesson.id)?.status ===
        'APROBADO',
    );
  };
  const onboarding = lessonMetrics(s, o, 0).validation;
  const requirements =
    phase === 1
      ? [
          {
            label: 'Expediente CONTROL con ≥90% de datos obligatorios',
            ok: onboarding >= 90,
          },
          {
            label: 'Baseline financiero y dependencia del fundador',
            ok:
              o.finances.length > 0 &&
              validated('margin') &&
              validated('hours'),
          },
          {
            label: 'Mapa operativo y CONTROL Score Día 0',
            ok:
              done(1) >= 2 &&
              o.control.reduce((sum, value) => sum + value, 0) > 0,
          },
          {
            label: 'Tres problemas y oferta prioritaria definidos',
            ok: done(2) + done(3) >= 3,
          },
          { label: 'Roadmap de 90 días aprobado', ok: approved(3) },
        ]
      : phase === 2
        ? [
            {
              label: 'Roles críticos y RACI activos',
              ok: done(4) >= 2 && approved(4),
            },
            {
              label: 'Procesos P1 con owner, SOP y KPI',
              ok: done(5) >= 2 && approved(5),
            },
            {
              label: 'Dashboard financiero y margen conocidos',
              ok: done(6) >= 2 && validated('margin'),
            },
            {
              label: 'Nueva medición de horas del fundador',
              ok: o.kpis.filter((kpi) => kpi.code === 'hours').length >= 2,
            },
            {
              label: 'CONTROL Score #2 y bitácora actualizados',
              ok: approved(6),
            },
          ]
        : phase === 3
          ? [
              {
                label:
                  'Responsabilidades críticas con owner y nivel de decisión',
                ok: approvedLesson('3.1.3'),
              },
              {
                label: 'Roles críticos con scorecard activo',
                ok: approvedLesson('3.2.2'),
              },
              {
                label:
                  'Cadencia semanal ejecutada y control de excepciones activo',
                ok: approvedLesson('3.2.6'),
              },
              {
                label:
                  'Sprint 30D con al menos tres responsabilidades en transferencia',
                ok: approvedLesson('3.3.3'),
              },
              {
                label: 'CONTROL Score #3 y nueva medición del fundador',
                ok:
                  approvedLesson('3.3.6') &&
                  o.kpis.filter((kpi) => kpi.code === 'hours').length >= 2,
              },
            ]
          : [
              {
                label:
                  'Decisión de escala documentada y restricciones conocidas',
                ok: approvedLesson('4.1.6'),
              },
              {
                label: 'Economics, caja y capacidad modelados',
                ok: approvedLesson('4.1.3') && approvedLesson('4.3.2'),
              },
              {
                label: 'Motor de adquisición y funnel medible',
                ok: approvedLesson('4.2.3') && approvedLesson('4.2.5'),
              },
              {
                label: 'CEO Dashboard y registro de riesgos activos',
                ok: approvedLesson('4.3.3') && approvedLesson('4.3.4'),
              },
              {
                label: 'Roadmap 90D y continuidad aprobados',
                ok: approvedLesson('4.3.1') && approvedLesson('4.3.6'),
              },
            ];
  const ready = requirements.every((item) => item.ok);
  return {
    requirements,
    ready,
    status: ready ? 'APPROVED' : 'OPEN',
  } as const;
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
export function lessonsFor(s: State, o: Org) {
  const rank = { LOW: 1, MEDIUM: 2, HIGH: 3 } as const;
  const plan = getPlan(s, o);
  return s.lessons
    .filter(
      (lesson) =>
        lesson.publication === 'PUBLICADO' &&
        rank[lesson.minAccess || 'LOW'] <= rank[plan.accessLevel || 'LOW'] &&
        (lesson.planId === 'all' ||
          lesson.planId === o.planId ||
          lesson.planId === 'org:' + o.id),
    )
    .toSorted((a, b) => a.code.localeCompare(b.code));
}
export function lessonMetrics(s: State, o: Org, stage?: number) {
  const lessons = lessonsFor(s, o).filter(
    (lesson) => stage === undefined || lesson.stage === stage,
  );
  const runs = new Map(o.lessonRuns.map((run) => [run.lessonId, run]));
  const total = Math.max(1, lessons.length);
  const learning = Math.round(
    (100 *
      lessons.filter((lesson) => runs.get(lesson.id)?.videoCompleted).length) /
      total,
  );
  const submitted = new Set(['ENVIADO', 'EN_REVISION', 'APROBADO']);
  const execution = Math.round(
    (100 *
      lessons.filter((lesson) =>
        submitted.has(runs.get(lesson.id)?.status || ''),
      ).length) /
      total,
  );
  const validation = Math.round(
    (100 *
      lessons.filter((lesson) => runs.get(lesson.id)?.status === 'APROBADO')
        .length) /
      total,
  );
  return { learning, execution, validation, total };
}
export function lessonAvailable(s: State, o: Org, lessonId: string) {
  const lessons = lessonsFor(s, o);
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index < 0) return false;
  const run = o.lessonRuns.find((item) => item.lessonId === lessonId);
  if (run?.manuallyUnlocked || index === 0) return true;
  const previous = o.lessonRuns.find(
    (item) => item.lessonId === lessons[index - 1].id,
  );
  return Boolean(
    previous?.status === 'APROBADO' || previous?.requirementSkipped,
  );
}
export function goalProgress(g: Goal) {
  return Math.round(
    (100 * g.checkpoints.filter((checkpoint) => checkpoint.completed).length) /
      Math.max(1, g.checkpoints.length),
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
  username?: string;
  name?: string;
  orgId?: string;
  newOrgName?: string;
  newOrgPlanId?: string;
  checkpoint1?: string;
  checkpoint2?: string;
  checkpoint3?: string;
  amount?: number;
  kind?: string;
  category?: string;
  note?: string;
  objective?: string;
  duration?: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  resourceType?: string;
  deliverable?: string;
  points?: number;
  publication?: string;
  requiresReview?: string;
  requiredForUnlock?: string;
  override?: string;
  supportType?: string;
  priority?: string;
  privacy?: string;
  lessonId?: string;
  version?: string;
  tier?: string;
  tags?: string;
  relatedLesson?: string;
  editable?: string;
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
    'updateUser',
    'toggleUser',
    'deleteUser',
    'finance',
    'followUp',
    'completeFollowUp',
    'createLesson',
    'reviewLesson',
    'lessonOverride',
    'extendLesson',
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
  const youtubeVideoId = (value: string) => {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:') return '';
      const host = url.hostname.replace(/^www\./, '');
      const videoId =
        host === 'youtu.be'
          ? url.pathname.slice(1).split('/')[0]
          : host === 'youtube.com' || host === 'm.youtube.com'
            ? url.pathname.startsWith('/embed/') ||
              url.pathname.startsWith('/shorts/')
              ? url.pathname.split('/')[2]
              : url.pathname === '/watch'
                ? url.searchParams.get('v') || ''
                : ''
            : '';
      return /^[A-Za-z0-9_-]{6,20}$/.test(videoId) ? videoId : '';
    } catch {
      return '';
    }
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
  } else if (c.type === 'goalCheckpoint') {
    const g = o.goals.find((g) => g.id === c.targetId);
    const checkpoint = g?.checkpoints.find((item) => item.id === c.code);
    if (!g || !checkpoint || typeof c.checked !== 'boolean')
      throw Error('Objetivo o checkpoint inválido.');
    checkpoint.completed = c.checked;
    event =
      'Checkpoint ' +
      (c.checked ? 'completado: ' : 'reabierto: ') +
      checkpoint.title;
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
      target: c.target!,
      unit: needText(c.unit, 1),
      due: validDate(c.due),
      checkpoints: [c.checkpoint1, c.checkpoint2, c.checkpoint3].map(
        (checkpoint) => ({
          id: id(),
          title: needText(checkpoint, 5),
          completed: false,
        }),
      ),
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
    const supportType = c.supportType as Org['support'][number]['type'];
    const priority = c.priority as Org['support'][number]['priority'];
    const privacy = c.privacy as Org['support'][number]['privacy'];
    if (!['METODOLOGICO', 'TECNICO', 'ACOMPANAMIENTO'].includes(supportType))
      throw Error('Selecciona un tipo de consulta válido.');
    if (!['NORMAL', 'ALTA', 'URGENTE'].includes(priority))
      throw Error('Selecciona una prioridad válida.');
    if (!['PRIVADA', 'COMUNIDAD'].includes(privacy))
      throw Error('Selecciona la privacidad de la consulta.');
    if (privacy === 'COMUNIDAD' && supportType === 'TECNICO')
      throw Error('Las incidencias técnicas deben enviarse de forma privada.');
    const slaHours = getPlan(next, o).entitlements.supportSlaHours;
    const due = new Date(Date.now() + slaHours * 3600000).toISOString();
    o.support.push({
      id: id(),
      text: needText(c.text),
      reply: '',
      type: supportType,
      priority,
      privacy,
      status: 'ABIERTO',
      due,
      lessonId: typeof c.lessonId === 'string' ? c.lessonId : '',
    });
    event = 'Consulta de soporte abierta';
  } else if (c.type === 'reply') {
    const t = o.support.find((t) => t.id === c.targetId);
    if (!t) throw Error('Consulta no encontrada.');
    t.reply = needText(c.text);
    t.status = 'RESPONDIDO';
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
  } else if (c.type === 'watchLesson' || c.type === 'submitLesson') {
    const lesson = next.lessons.find((item) => item.id === c.targetId);
    const run = o.lessonRuns.find((item) => item.lessonId === c.targetId);
    if (!lesson || !run || !lessonAvailable(next, o, lesson.id))
      throw Error('La clase todavía no está disponible.');
    if (c.type === 'watchLesson') {
      if (typeof c.checked !== 'boolean')
        throw Error('Checkpoint de clase no válido.');
      if (!c.checked && !['NO_INICIADO', 'EN_PROGRESO'].includes(run.status))
        throw Error('No puedes desmarcar una clase con actividad entregada.');
      run.videoCompleted = c.checked;
      if (c.checked && run.status === 'NO_INICIADO') run.status = 'EN_PROGRESO';
      if (!c.checked && run.status === 'EN_PROGRESO')
        run.status = 'NO_INICIADO';
      event =
        'Checkpoint actualizado: ' +
        lesson.title +
        (c.checked ? ' · clase vista' : ' · pendiente');
    } else {
      if (!run.videoCompleted)
        throw Error('Marca primero el checkpoint de clase vista.');
      run.response = needText(c.text, 5);
      run.status = lesson.requiresReview ? 'ENVIADO' : 'APROBADO';
      run.feedback = '';
      event = 'Actividad entregada: ' + lesson.title;
    }
  } else if (c.type === 'reviewLesson') {
    const lesson = next.lessons.find((item) => item.id === c.targetId);
    const run = o.lessonRuns.find((item) => item.lessonId === c.targetId);
    if (!lesson || !run || !['ENVIADO', 'EN_REVISION'].includes(run.status))
      throw Error('No hay una actividad pendiente de revisión.');
    run.feedback = needText(c.text);
    run.status = c.checked ? 'APROBADO' : 'OBSERVADO';
    event =
      (c.checked ? 'Clase aprobada: ' : 'Cambios solicitados: ') + lesson.title;
  } else if (c.type === 'createLesson') {
    const stage = Number(c.value);
    const week = Number(c.week);
    const duration = Number(c.duration);
    const points = Number(c.points);
    if (!Number.isInteger(stage) || stage < 0 || stage > 4)
      throw Error('Etapa no válida.');
    if (!Number.isInteger(week) || week < 0 || week > 12)
      throw Error('Semana no válida.');
    if (!Number.isFinite(duration) || duration <= 0 || duration > 600)
      throw Error('Duración no válida.');
    if (!Number.isInteger(points) || points < 0 || points > 1000)
      throw Error('Puntos no válidos.');
    const planId = c.planId || 'all';
    if (
      planId !== 'all' &&
      !next.plans.some((plan) => plan.id === planId) &&
      !next.orgs.some((organization) => planId === 'org:' + organization.id)
    )
      throw Error('Asignación de clase no válida.');
    const videoUrl = needText(c.videoUrl, 8);
    if (!youtubeVideoId(videoUrl))
      throw Error('Usa un enlace HTTPS válido de YouTube.');
    const lesson: Lesson = {
      id: id(),
      code:
        'E' + stage + '-' + String(next.lessons.length + 1).padStart(2, '0'),
      title: needText(c.title),
      stage,
      week,
      planId,
      publication: c.publication === 'BORRADOR' ? 'BORRADOR' : 'PUBLICADO',
      description: needText(c.description, 10),
      objective: needText(c.objective, 5),
      duration,
      videoUrl,
      thumbnailUrl:
        typeof c.thumbnailUrl === 'string' ? c.thumbnailUrl.trim() : '',
      learnings: [needText(c.objective, 5)],
      action: needText(c.action, 5),
      resourceType: needText(c.resourceType, 2),
      deliverable: needText(c.deliverable, 5),
      due: validDate(c.due),
      points,
      requiresReview: c.requiresReview !== 'no',
      requiredForUnlock: c.requiredForUnlock !== 'no',
      owner: 'C+E',
      minAccess:
        planId === 'all' || planId.startsWith('org:')
          ? 'LOW'
          : next.plans.find((plan) => plan.id === planId)?.accessLevel || 'LOW',
    };
    next.lessons.push(lesson);
    next.orgs
      .filter(
        (organization) =>
          planId === 'all' ||
          planId === organization.planId ||
          planId === 'org:' + organization.id,
      )
      .forEach((organization) =>
        organization.lessonRuns.push({
          lessonId: lesson.id,
          videoCompleted: false,
          status: 'NO_INICIADO',
          response: '',
          feedback: '',
          due: lesson.due,
          manuallyUnlocked: planId.startsWith('org:'),
          requirementSkipped: false,
        }),
      );
    event = 'Clase creada: ' + lesson.title;
    internal = true;
  } else if (c.type === 'lessonOverride') {
    const run = o.lessonRuns.find((item) => item.lessonId === c.targetId);
    if (!run) throw Error('Clase no asignada a este cliente.');
    if (c.override === 'unlock') run.manuallyUnlocked = true;
    else if (c.override === 'skip') run.requirementSkipped = true;
    else if (c.override === 'reopen') {
      run.status = 'EN_PROGRESO';
      run.feedback = '';
      run.requirementSkipped = false;
    } else throw Error('Control administrativo no válido.');
    event =
      c.override === 'unlock'
        ? 'Clase desbloqueada manualmente'
        : c.override === 'skip'
          ? 'Requisito de clase omitido'
          : 'Actividad reabierta';
    internal = true;
  } else if (c.type === 'extendLesson') {
    const run = o.lessonRuns.find((item) => item.lessonId === c.targetId);
    if (!run) throw Error('Clase no asignada a este cliente.');
    run.due = validDate(c.due);
    event = 'Fecha límite de clase extendida hasta ' + run.due;
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
      category: needText(c.category || 'General', 2),
      version: needText(c.version || '1.0.0', 1),
      tier: ['BASIC', 'COMPLETE', 'ADVANCED'].includes(c.tier || '')
        ? (c.tier as 'BASIC' | 'COMPLETE' | 'ADVANCED')
        : 'BASIC',
      tags: (c.tags || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 12),
      relatedLesson:
        typeof c.relatedLesson === 'string' ? c.relatedLesson.trim() : '',
      editable: c.editable !== 'no',
      editorialStatus: 'LISTO',
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
    const username = needText(c.username).toLowerCase();
    if (!/^[a-z0-9._-]{3,40}$/.test(username))
      throw Error(
        'El usuario debe tener entre 3 y 40 caracteres: letras, números, punto, guion o guion bajo.',
      );
    if (next.users.some((u) => u.username.toLowerCase() === username))
      throw Error('El nombre de usuario ya está registrado.');
    const role = c.role as State['users'][number]['role'];
    if (!['CLIENTE', 'CONSULTOR', 'OPERADOR', 'ADMIN'].includes(role))
      throw Error('Rol no válido.');
    let organizationId = c.orgId || '';
    const newOrganizationName =
      typeof c.newOrgName === 'string' ? c.newOrgName.trim() : '';
    if (newOrganizationName) {
      if (role !== 'CLIENTE')
        throw Error('La empresa nueva debe asignarse a un cliente o alumno.');
      if (
        next.orgs.some(
          (organization) =>
            organization.name.toLowerCase() ===
            newOrganizationName.toLowerCase(),
        )
      )
        throw Error('Ya existe una empresa con ese nombre.');
      const planId = needText(c.newOrgPlanId);
      if (!next.plans.some((plan) => plan.id === planId))
        throw Error('Selecciona un plan válido para la empresa.');
      organizationId = id();
      next.orgs.push(
        createOrganizationWorkspace(
          organizationId,
          needText(newOrganizationName),
          needText(c.name),
          planId,
          next.lessons,
        ),
      );
    }
    if (
      role === 'CLIENTE' &&
      !next.orgs.some((item) => item.id === organizationId)
    )
      throw Error('Asigna una empresa al cliente.');
    next.users.unshift({
      id: id(),
      name: needText(c.name),
      username,
      role,
      orgId: role === 'CLIENTE' ? organizationId : '',
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
  } else if (c.type === 'updateUser') {
    const user = next.users.find((item) => item.id === c.targetId);
    if (!user) throw Error('Usuario no encontrado.');
    if (user.id === 'user-admin')
      throw Error('El administrador principal se edita desde Supabase Auth.');
    if (user.role !== 'CLIENTE')
      throw Error('Esta acción está reservada para clientes o alumnos.');
    const username = needText(c.username).toLowerCase();
    if (!/^[a-z0-9._-]{3,40}$/.test(username))
      throw Error(
        'El usuario debe tener entre 3 y 40 caracteres: letras, números, punto, guion o guion bajo.',
      );
    if (
      next.users.some(
        (item) =>
          item.id !== user.id && item.username.toLowerCase() === username,
      )
    )
      throw Error('El nombre de usuario ya está registrado.');
    user.name = needText(c.name);
    user.username = username;
    event = 'Cliente actualizado: ' + user.name;
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
