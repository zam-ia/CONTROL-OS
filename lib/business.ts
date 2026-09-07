export type BusinessStatus = 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
export type LedgerStatus = 'POSTED' | 'VOIDED';
export type PaymentStatus = 'PENDING' | 'COLLECTED' | 'OVERDUE';
export type ExpenseType = 'FIXED' | 'VARIABLE' | 'MIXED';

export type BusinessClient = {
  id: string;
  name: string;
  segment: string;
  status: 'PROSPECT' | 'ACTIVE' | 'PAUSED' | 'ENDED';
  owner: string;
  startedOn: string;
};

export type BusinessService = {
  id: string;
  name: string;
  category: string;
  status: 'ACTIVE' | 'PAUSED' | 'RETIRED' | 'TEST';
  listPrice: number;
  capacityMonth: number;
};

export type BusinessIncome = {
  id: string;
  date: string;
  clientId: string;
  serviceId: string;
  description: string;
  netAmount: number;
  paymentStatus: PaymentStatus;
  status: LedgerStatus;
};

export type ExpenseAllocation = {
  clientId?: string;
  serviceId?: string;
  amount: number;
  basis: 'DIRECT' | 'HOURS' | 'UNITS' | 'REVENUE_SHARE' | 'MANUAL';
};

export type BusinessExpense = {
  id: string;
  date: string;
  supplier: string;
  category: string;
  description: string;
  type: ExpenseType;
  grossAmount: number;
  paid: boolean;
  status: LedgerStatus;
  allocations: ExpenseAllocation[];
};

export type BusinessObjective = {
  id: string;
  title: string;
  owner: string;
  dueOn: string;
  status: 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK' | 'ACHIEVED';
  checkpoints: { id: string; title: string; completed: boolean }[];
};

export type BusinessTask = {
  id: string;
  title: string;
  owner: string;
  dueOn: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'BLOCKED' | 'DONE';
  source: 'CONTROL_METHOD' | 'PROCESS' | 'ALERT' | 'MANUAL';
};

export type BusinessProcess = {
  id: string;
  name: string;
  owner: string;
  trigger: string;
  output: string;
  sla: string;
  kpi: string;
  status: 'DRAFT' | 'ACTIVE' | 'REVIEW' | 'ARCHIVED';
  sopVersion: number;
};

export type BusinessState = {
  schema: 2;
  workspace: {
    id: string;
    organizationId: string;
    name: string;
    status: BusinessStatus;
    currency: 'PEN';
    timezone: 'America/Lima';
    plan: string;
    periodStatus: 'OPEN' | 'LOCKED';
  };
  clients: BusinessClient[];
  services: BusinessService[];
  incomes: BusinessIncome[];
  expenses: BusinessExpense[];
  objectives: BusinessObjective[];
  tasks: BusinessTask[];
  processes: BusinessProcess[];
  events: { id: string; at: string; text: string }[];
};

export type BusinessMetrics = {
  revenue: number;
  collected: number;
  expenses: number;
  paidExpenses: number;
  variableExpenses: number;
  fixedExpenses: number;
  mixedExpenses: number;
  operatingProfit: number;
  operatingMargin: number;
  cashMovement: number;
  activeClients: number;
  averageTicket: number;
};

export type ProfitabilityRow = {
  id: string;
  name: string;
  revenue: number;
  directCost: number;
  contribution: number;
  margin: number;
};

export type BusinessAlert = {
  id: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  explanation: string;
  destination: 'dashboard' | 'finance' | 'clients' | 'work';
};

export type BusinessCommand =
  | { type: 'addIncome'; entry: BusinessIncome }
  | { type: 'addExpense'; entry: BusinessExpense }
  | { type: 'addClient'; client: BusinessClient }
  | { type: 'addService'; service: BusinessService }
  | {
      type: 'toggleObjectiveCheckpoint';
      objectiveId: string;
      checkpointId: string;
    }
  | { type: 'toggleTask'; taskId: string }
  | { type: 'lockPeriod' };

const round = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;
const percent = (value: number, total: number) =>
  total > 0 ? round((value / total) * 100) : 0;

export const objectiveProgress = (objective: BusinessObjective) => {
  if (!objective.checkpoints.length) return 0;
  return Math.round(
    (objective.checkpoints.filter((checkpoint) => checkpoint.completed).length /
      objective.checkpoints.length) *
      100,
  );
};

export function validateExpenseAllocations(expense: BusinessExpense) {
  const allocated = round(
    expense.allocations.reduce(
      (total, allocation) => total + allocation.amount,
      0,
    ),
  );
  if (expense.grossAmount <= 0)
    throw Error('El gasto debe ser mayor que cero.');
  if (expense.allocations.some((allocation) => allocation.amount <= 0))
    throw Error('Cada imputación debe ser mayor que cero.');
  if (allocated > round(expense.grossAmount))
    throw Error('Las imputaciones no pueden superar el gasto total.');
  if (
    expense.allocations.some(
      (allocation) => !allocation.clientId && !allocation.serviceId,
    )
  )
    throw Error('Cada imputación debe apuntar a un cliente o servicio.');
  return allocated;
}

export function businessMetrics(state: BusinessState): BusinessMetrics {
  const incomes = state.incomes.filter((entry) => entry.status === 'POSTED');
  const expenses = state.expenses.filter((entry) => entry.status === 'POSTED');
  const revenue = round(
    incomes.reduce((total, entry) => total + entry.netAmount, 0),
  );
  const collected = round(
    incomes
      .filter((entry) => entry.paymentStatus === 'COLLECTED')
      .reduce((total, entry) => total + entry.netAmount, 0),
  );
  const expenseTotal = round(
    expenses.reduce((total, entry) => total + entry.grossAmount, 0),
  );
  const byType = (type: ExpenseType) =>
    round(
      expenses
        .filter((entry) => entry.type === type)
        .reduce((total, entry) => total + entry.grossAmount, 0),
    );
  const paidExpenses = round(
    expenses
      .filter((entry) => entry.paid)
      .reduce((total, entry) => total + entry.grossAmount, 0),
  );
  const operatingProfit = round(revenue - expenseTotal);
  return {
    revenue,
    collected,
    expenses: expenseTotal,
    paidExpenses,
    variableExpenses: byType('VARIABLE'),
    fixedExpenses: byType('FIXED'),
    mixedExpenses: byType('MIXED'),
    operatingProfit,
    operatingMargin: percent(operatingProfit, revenue),
    cashMovement: round(collected - paidExpenses),
    activeClients: state.clients.filter((client) => client.status === 'ACTIVE')
      .length,
    averageTicket: incomes.length ? round(revenue / incomes.length) : 0,
  };
}

export function clientProfitability(state: BusinessState): ProfitabilityRow[] {
  return state.clients
    .map((client) => {
      const revenue = round(
        state.incomes
          .filter(
            (entry) =>
              entry.status === 'POSTED' && entry.clientId === client.id,
          )
          .reduce((total, entry) => total + entry.netAmount, 0),
      );
      const directCost = round(
        state.expenses
          .filter((entry) => entry.status === 'POSTED')
          .flatMap((entry) => entry.allocations)
          .filter((allocation) => allocation.clientId === client.id)
          .reduce((total, allocation) => total + allocation.amount, 0),
      );
      const contribution = round(revenue - directCost);
      return {
        id: client.id,
        name: client.name,
        revenue,
        directCost,
        contribution,
        margin: percent(contribution, revenue),
      };
    })
    .sort((a, b) => b.contribution - a.contribution);
}

export function serviceProfitability(state: BusinessState): ProfitabilityRow[] {
  return state.services
    .map((service) => {
      const revenue = round(
        state.incomes
          .filter(
            (entry) =>
              entry.status === 'POSTED' && entry.serviceId === service.id,
          )
          .reduce((total, entry) => total + entry.netAmount, 0),
      );
      const directCost = round(
        state.expenses
          .filter((entry) => entry.status === 'POSTED')
          .flatMap((entry) => entry.allocations)
          .filter((allocation) => allocation.serviceId === service.id)
          .reduce((total, allocation) => total + allocation.amount, 0),
      );
      const contribution = round(revenue - directCost);
      return {
        id: service.id,
        name: service.name,
        revenue,
        directCost,
        contribution,
        margin: percent(contribution, revenue),
      };
    })
    .sort((a, b) => b.contribution - a.contribution);
}

export function monthlyTrend(state: BusinessState) {
  const months = new Map<
    string,
    { month: string; revenue: number; expenses: number }
  >();
  for (const entry of state.incomes.filter(
    (item) => item.status === 'POSTED',
  )) {
    const key = entry.date.slice(0, 7);
    const current = months.get(key) || { month: key, revenue: 0, expenses: 0 };
    current.revenue = round(current.revenue + entry.netAmount);
    months.set(key, current);
  }
  for (const entry of state.expenses.filter(
    (item) => item.status === 'POSTED',
  )) {
    const key = entry.date.slice(0, 7);
    const current = months.get(key) || { month: key, revenue: 0, expenses: 0 };
    current.expenses = round(current.expenses + entry.grossAmount);
    months.set(key, current);
  }
  return [...months.values()]
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6);
}

export function businessAlerts(state: BusinessState): BusinessAlert[] {
  const metrics = businessMetrics(state);
  const alerts: BusinessAlert[] = [];
  if (metrics.revenue === 0) {
    alerts.push({
      id: 'no-revenue',
      severity: 'INFO',
      title: 'Registra el primer ingreso',
      explanation:
        'El dashboard necesita movimientos publicados para calcular rentabilidad.',
      destination: 'finance',
    });
  } else if (metrics.operatingMargin < 15) {
    alerts.push({
      id: 'critical-margin',
      severity: 'CRITICAL',
      title: 'Margen operativo crítico',
      explanation: `El margen es ${metrics.operatingMargin}%; la regla crítica se activa por debajo de 15%.`,
      destination: 'finance',
    });
  } else if (metrics.operatingMargin < 25) {
    alerts.push({
      id: 'warning-margin',
      severity: 'WARNING',
      title: 'Margen operativo bajo vigilancia',
      explanation: `El margen es ${metrics.operatingMargin}%; revisa costos antes del cierre del período.`,
      destination: 'finance',
    });
  }
  const overdue = state.incomes.filter(
    (entry) => entry.status === 'POSTED' && entry.paymentStatus === 'OVERDUE',
  );
  if (overdue.length)
    alerts.push({
      id: 'overdue-income',
      severity: 'WARNING',
      title: 'Cobranza vencida',
      explanation: `${overdue.length} movimiento${overdue.length === 1 ? '' : 's'} requiere${overdue.length === 1 ? '' : 'n'} seguimiento de cobro.`,
      destination: 'finance',
    });
  const criticalClient = clientProfitability(state).find(
    (client) => client.revenue > 0 && client.margin < 20,
  );
  if (criticalClient)
    alerts.push({
      id: 'client-margin',
      severity: 'CRITICAL',
      title: `Revisar rentabilidad de ${criticalClient.name}`,
      explanation: `Su margen de contribución es ${criticalClient.margin}% según ingresos e imputaciones directas.`,
      destination: 'clients',
    });
  const blocked = state.tasks.filter(
    (task) => task.status === 'BLOCKED',
  ).length;
  if (blocked)
    alerts.push({
      id: 'blocked-tasks',
      severity: 'WARNING',
      title: 'Trabajo bloqueado',
      explanation: `${blocked} tarea${blocked === 1 ? '' : 's'} necesita${blocked === 1 ? '' : 'n'} una decisión o recurso para continuar.`,
      destination: 'work',
    });
  return alerts;
}

export function executeBusiness(
  state: BusinessState,
  command: BusinessCommand,
): BusinessState {
  const next = structuredClone(state);
  if (next.workspace.status !== 'ACTIVE')
    throw Error('El espacio de trabajo no está activo.');
  if (
    next.workspace.periodStatus === 'LOCKED' &&
    ['addIncome', 'addExpense'].includes(command.type)
  )
    throw Error('El período está cerrado y no admite movimientos.');

  if (command.type === 'addIncome') {
    if (command.entry.netAmount <= 0)
      throw Error('El ingreso debe ser mayor que cero.');
    if (!next.clients.some((client) => client.id === command.entry.clientId))
      throw Error('Selecciona un cliente válido.');
    if (
      !next.services.some((service) => service.id === command.entry.serviceId)
    )
      throw Error('Selecciona un servicio válido.');
    next.incomes.unshift(command.entry);
    next.events.unshift({
      id: `event-${command.entry.id}`,
      at: new Date().toISOString(),
      text: 'Ingreso registrado.',
    });
  } else if (command.type === 'addExpense') {
    validateExpenseAllocations(command.entry);
    next.expenses.unshift(command.entry);
    next.events.unshift({
      id: `event-${command.entry.id}`,
      at: new Date().toISOString(),
      text: 'Gasto registrado.',
    });
  } else if (command.type === 'addClient') {
    if (!command.client.name.trim())
      throw Error('Escribe el nombre del cliente.');
    next.clients.unshift(command.client);
    next.events.unshift({
      id: `event-${command.client.id}`,
      at: new Date().toISOString(),
      text: 'Cliente creado.',
    });
  } else if (command.type === 'addService') {
    if (!command.service.name.trim())
      throw Error('Escribe el nombre del servicio.');
    next.services.unshift(command.service);
    next.events.unshift({
      id: `event-${command.service.id}`,
      at: new Date().toISOString(),
      text: 'Servicio creado.',
    });
  } else if (command.type === 'toggleObjectiveCheckpoint') {
    const objective = next.objectives.find(
      (item) => item.id === command.objectiveId,
    );
    const checkpoint = objective?.checkpoints.find(
      (item) => item.id === command.checkpointId,
    );
    if (!objective || !checkpoint) throw Error('Checkpoint no encontrado.');
    checkpoint.completed = !checkpoint.completed;
    objective.status =
      objectiveProgress(objective) === 100 ? 'ACHIEVED' : 'ON_TRACK';
    next.events.unshift({
      id: `event-${Date.now()}`,
      at: new Date().toISOString(),
      text: 'Checkpoint actualizado.',
    });
  } else if (command.type === 'toggleTask') {
    const task = next.tasks.find((item) => item.id === command.taskId);
    if (!task) throw Error('Tarea no encontrada.');
    task.status = task.status === 'DONE' ? 'TODO' : 'DONE';
    next.events.unshift({
      id: `event-${Date.now()}`,
      at: new Date().toISOString(),
      text: 'Estado de tarea actualizado.',
    });
  } else if (command.type === 'lockPeriod') {
    next.workspace.periodStatus = 'LOCKED';
    next.events.unshift({
      id: `event-${Date.now()}`,
      at: new Date().toISOString(),
      text: 'Período cerrado y snapshot solicitado.',
    });
  }
  return next;
}

export function businessSeed(): BusinessState {
  return {
    schema: 2,
    workspace: {
      id: 'business-norte',
      organizationId: 'norte',
      name: 'Estudio Norte',
      status: 'ACTIVE',
      currency: 'PEN',
      timezone: 'America/Lima',
      plan: 'CONTROL 90',
      periodStatus: 'OPEN',
    },
    clients: [
      {
        id: 'client-aurora',
        name: 'Aurora Labs',
        segment: 'Consultoría',
        status: 'ACTIVE',
        owner: 'Andrea P.',
        startedOn: '2026-04-08',
      },
      {
        id: 'client-boreal',
        name: 'Boreal Studio',
        segment: 'Creativo',
        status: 'ACTIVE',
        owner: 'Andrea P.',
        startedOn: '2026-05-15',
      },
      {
        id: 'client-costa',
        name: 'Costa Sur',
        segment: 'Servicios',
        status: 'ACTIVE',
        owner: 'Carlos R.',
        startedOn: '2026-06-03',
      },
      {
        id: 'client-delta',
        name: 'Delta Foods',
        segment: 'Consumo',
        status: 'PAUSED',
        owner: 'Carlos R.',
        startedOn: '2026-03-21',
      },
    ],
    services: [
      {
        id: 'service-control90',
        name: 'Implementación CONTROL 90',
        category: 'Consultoría',
        status: 'ACTIVE',
        listPrice: 7200,
        capacityMonth: 6,
      },
      {
        id: 'service-audit',
        name: 'Auditoría de rentabilidad',
        category: 'Diagnóstico',
        status: 'ACTIVE',
        listPrice: 3600,
        capacityMonth: 8,
      },
      {
        id: 'service-partner',
        name: 'CONTROL Partner',
        category: 'Acompañamiento',
        status: 'ACTIVE',
        listPrice: 5400,
        capacityMonth: 5,
      },
    ],
    incomes: [
      {
        id: 'income-1',
        date: '2026-09-02',
        clientId: 'client-aurora',
        serviceId: 'service-control90',
        description: 'Cuota implementación',
        netAmount: 7200,
        paymentStatus: 'COLLECTED',
        status: 'POSTED',
      },
      {
        id: 'income-2',
        date: '2026-09-03',
        clientId: 'client-boreal',
        serviceId: 'service-audit',
        description: 'Auditoría mensual',
        netAmount: 3600,
        paymentStatus: 'COLLECTED',
        status: 'POSTED',
      },
      {
        id: 'income-3',
        date: '2026-09-04',
        clientId: 'client-costa',
        serviceId: 'service-partner',
        description: 'Acompañamiento mensual',
        netAmount: 5400,
        paymentStatus: 'OVERDUE',
        status: 'POSTED',
      },
      {
        id: 'income-4',
        date: '2026-08-05',
        clientId: 'client-aurora',
        serviceId: 'service-control90',
        description: 'Cuota implementación',
        netAmount: 6800,
        paymentStatus: 'COLLECTED',
        status: 'POSTED',
      },
      {
        id: 'income-5',
        date: '2026-08-09',
        clientId: 'client-boreal',
        serviceId: 'service-audit',
        description: 'Auditoría mensual',
        netAmount: 3400,
        paymentStatus: 'COLLECTED',
        status: 'POSTED',
      },
      {
        id: 'income-6',
        date: '2026-07-07',
        clientId: 'client-delta',
        serviceId: 'service-partner',
        description: 'Acompañamiento',
        netAmount: 5000,
        paymentStatus: 'COLLECTED',
        status: 'POSTED',
      },
    ],
    expenses: [
      {
        id: 'expense-1',
        date: '2026-09-02',
        supplier: 'Equipo consultor',
        category: 'Entrega',
        description: 'Horas de implementación',
        type: 'VARIABLE',
        grossAmount: 4200,
        paid: true,
        status: 'POSTED',
        allocations: [
          {
            clientId: 'client-aurora',
            serviceId: 'service-control90',
            amount: 2800,
            basis: 'HOURS',
          },
          {
            clientId: 'client-boreal',
            serviceId: 'service-audit',
            amount: 1400,
            basis: 'HOURS',
          },
        ],
      },
      {
        id: 'expense-2',
        date: '2026-09-03',
        supplier: 'Software operativo',
        category: 'Tecnología',
        description: 'Herramientas del equipo',
        type: 'FIXED',
        grossAmount: 1600,
        paid: true,
        status: 'POSTED',
        allocations: [],
      },
      {
        id: 'expense-3',
        date: '2026-09-04',
        supplier: 'Especialista externo',
        category: 'Entrega',
        description: 'Soporte del cliente',
        type: 'VARIABLE',
        grossAmount: 2600,
        paid: false,
        status: 'POSTED',
        allocations: [
          {
            clientId: 'client-costa',
            serviceId: 'service-partner',
            amount: 2600,
            basis: 'DIRECT',
          },
        ],
      },
      {
        id: 'expense-4',
        date: '2026-08-06',
        supplier: 'Equipo consultor',
        category: 'Entrega',
        description: 'Horas de implementación',
        type: 'VARIABLE',
        grossAmount: 3800,
        paid: true,
        status: 'POSTED',
        allocations: [
          {
            clientId: 'client-aurora',
            serviceId: 'service-control90',
            amount: 2500,
            basis: 'HOURS',
          },
          {
            clientId: 'client-boreal',
            serviceId: 'service-audit',
            amount: 1300,
            basis: 'HOURS',
          },
        ],
      },
      {
        id: 'expense-5',
        date: '2026-08-02',
        supplier: 'Oficina',
        category: 'Operación',
        description: 'Costos operativos',
        type: 'FIXED',
        grossAmount: 1450,
        paid: true,
        status: 'POSTED',
        allocations: [],
      },
      {
        id: 'expense-6',
        date: '2026-07-08',
        supplier: 'Especialista externo',
        category: 'Entrega',
        description: 'Sesiones especializadas',
        type: 'VARIABLE',
        grossAmount: 3100,
        paid: true,
        status: 'POSTED',
        allocations: [
          {
            clientId: 'client-delta',
            serviceId: 'service-partner',
            amount: 3100,
            basis: 'DIRECT',
          },
        ],
      },
    ],
    objectives: [
      {
        id: 'objective-margin',
        title: 'Proteger un margen operativo mayor a 25%',
        owner: 'Andrea P.',
        dueOn: '2026-09-30',
        status: 'ON_TRACK',
        checkpoints: [
          {
            id: 'margin-1',
            title: 'Clasificar todos los gastos del período',
            completed: true,
          },
          {
            id: 'margin-2',
            title: 'Revisar imputaciones por cliente',
            completed: true,
          },
          {
            id: 'margin-3',
            title: 'Cerrar el período con snapshot',
            completed: false,
          },
        ],
      },
      {
        id: 'objective-founder',
        title: 'Liberar 8 horas semanales del fundador',
        owner: 'Carlos R.',
        dueOn: '2026-10-15',
        status: 'AT_RISK',
        checkpoints: [
          {
            id: 'founder-1',
            title: 'Inventariar trabajo operativo',
            completed: true,
          },
          {
            id: 'founder-2',
            title: 'Delegar seguimiento de clientes',
            completed: false,
          },
          {
            id: 'founder-3',
            title: 'Validar el tiempo esperado durante dos semanas',
            completed: false,
          },
        ],
      },
    ],
    tasks: [
      {
        id: 'task-1',
        title: 'Validar imputaciones de septiembre',
        owner: 'Andrea P.',
        dueOn: '2026-09-08',
        status: 'IN_PROGRESS',
        source: 'CONTROL_METHOD',
      },
      {
        id: 'task-2',
        title: 'Definir responsable de la bienvenida',
        owner: 'Carlos R.',
        dueOn: '2026-09-09',
        status: 'BLOCKED',
        source: 'PROCESS',
      },
      {
        id: 'task-3',
        title: 'Dar seguimiento a cobranza de Costa Sur',
        owner: 'Andrea P.',
        dueOn: '2026-09-07',
        status: 'TODO',
        source: 'ALERT',
      },
      {
        id: 'task-4',
        title: 'Publicar instrucciones de entrega',
        owner: 'Carlos R.',
        dueOn: '2026-09-12',
        status: 'REVIEW',
        source: 'CONTROL_METHOD',
      },
    ],
    processes: [
      {
        id: 'process-onboarding',
        name: 'Onboarding de cliente',
        owner: 'Carlos R.',
        trigger: 'Pago validado',
        output: 'Cliente activado',
        sla: '24 horas',
        kpi: '% dentro del tiempo esperado',
        status: 'ACTIVE',
        sopVersion: 3,
      },
      {
        id: 'process-delivery',
        name: 'Entrega de consultoría',
        owner: 'Andrea P.',
        trigger: 'Semana planificada',
        output: 'Entregable validado',
        sla: '5 días',
        kpi: '% entregas a tiempo',
        status: 'REVIEW',
        sopVersion: 2,
      },
      {
        id: 'process-collection',
        name: 'Seguimiento de cobranza',
        owner: 'Andrea P.',
        trigger: 'Pago pendiente',
        output: 'Pago cobrado o acuerdo',
        sla: '48 horas',
        kpi: 'Días de cobranza',
        status: 'ACTIVE',
        sopVersion: 1,
      },
    ],
    events: [
      {
        id: 'event-seed-1',
        at: '2026-09-05T14:00:00.000Z',
        text: 'Espacio empresarial sincronizado con CONTROL OS.',
      },
    ],
  };
}

const legacyDemoClientIds = new Set([
  'client-aurora',
  'client-boreal',
  'client-costa',
  'client-delta',
]);
const legacyDemoServiceIds = new Set([
  'service-control90',
  'service-audit',
  'service-partner',
]);

export function removeBusinessDemoData(
  state: BusinessState,
  organizationId: string,
  organizationName: string,
  plan = 'CONTROL 90',
): BusinessState {
  const next = structuredClone(state);
  next.workspace = {
    ...next.workspace,
    id: `business-${organizationId}`,
    organizationId,
    name: organizationName,
    plan,
  };
  next.clients = next.clients.filter(
    (client) => !legacyDemoClientIds.has(client.id),
  );
  next.services = next.services.filter(
    (service) => !legacyDemoServiceIds.has(service.id),
  );
  next.incomes = next.incomes.filter(
    (income) =>
      !legacyDemoClientIds.has(income.clientId) &&
      !legacyDemoServiceIds.has(income.serviceId),
  );
  next.expenses = next.expenses
    .filter((expense) => !/^expense-[1-6]$/.test(expense.id))
    .map((expense) => ({
      ...expense,
      allocations: expense.allocations.filter(
        (allocation) =>
          !legacyDemoClientIds.has(allocation.clientId || '') &&
          !legacyDemoServiceIds.has(allocation.serviceId || ''),
      ),
    }));
  next.objectives = next.objectives.filter(
    (objective) =>
      !['objective-margin', 'objective-founder'].includes(objective.id),
  );
  next.tasks = next.tasks.filter((task) => !/^task-[1-4]$/.test(task.id));
  next.processes = next.processes.filter(
    (process) =>
      ![
        'process-onboarding',
        'process-delivery',
        'process-collection',
      ].includes(process.id),
  );
  next.events = next.events.filter((event) => event.id !== 'event-seed-1');
  if (!next.events.length) {
    next.events.push({
      id: `event-workspace-${organizationId}`,
      at: new Date().toISOString(),
      text: 'Espacio empresarial listo para registrar información real.',
    });
  }
  return next;
}
