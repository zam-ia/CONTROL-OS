export const CENTRA_BRAND = {
  name: 'CENTRA',
  tagline: 'Todo tu negocio en un solo lugar',
  promise: 'Integra · Organiza · Crece',
  colors: {
    black: '#0E0E0D',
    bone: '#FAF7F0',
    gold: '#F5B400',
    petrol: '#335D68',
    sand: '#DDD3C4',
    text: '#1A1A1A',
    muted: '#6B7280',
  },
} as const;

export type CentraAudience = 'client' | 'admin';
export type TaskOrigin =
  | 'program'
  | 'company'
  | 'process'
  | 'recurring_checklist'
  | 'intervention';

export const clientNavigation = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'ruta', label: 'Mi Ruta' },
  { id: 'empresa', label: 'Mi Empresa' },
  { id: 'biblioteca', label: 'Biblioteca' },
] as const;

export const adminNavigation = [
  { id: 'portafolio', label: 'Portafolio' },
  { id: 'programa', label: 'Programa' },
  { id: 'rentabilidad', label: 'Rentabilidad de cartera' },
  { id: 'configuracion', label: 'Configuración' },
] as const;

export type CentraPhase = {
  id: number;
  name: string;
  weeks: readonly number[];
  result: string;
};

export const centraPhases: readonly CentraPhase[] = [
  {
    id: 0,
    name: 'Onboarding y configuración',
    weeks: [0],
    result: 'Cuenta, empresa, meta de 90 días y diagnóstico inicial listos',
  },
  {
    id: 1,
    name: 'Radiografía de tu Agencia',
    weeks: [1],
    result: 'Prioridades y fugas visibles',
  },
  {
    id: 2,
    name: 'Rentabilidad Visible',
    weeks: [2],
    result: 'Ganancia real y margen por cliente o servicio',
  },
  {
    id: 3,
    name: 'Equipo y Capacidad Bajo Control',
    weeks: [3, 4],
    result: 'Roles, costos y capacidad claros',
  },
  {
    id: 4,
    name: 'Operación Trazable',
    weeks: [5, 6, 7],
    result: 'Procesos críticos repetibles',
  },
  {
    id: 5,
    name: 'Sistema de Control de Gestión',
    weeks: [8, 9, 10],
    result: 'KPIs, dashboard y rutinas activas',
  },
  {
    id: 6,
    name: 'Agencia Delegable y Escalable',
    weeks: [11, 12, 13],
    result: 'Menor dependencia del dueño y plan de continuidad',
  },
] as const;

export function phaseForWeek(week: number) {
  return (
    centraPhases.find((phase) => phase.weeks.includes(week)) || centraPhases[0]
  );
}

export type TodayTask = {
  id: string;
  title: string;
  due: string;
  status: string;
  priority?: number | string;
  origin?: TaskOrigin;
};

export function nextAction<T extends TodayTask>(tasks: readonly T[]): T | null {
  const priorityRank = (priority: TodayTask['priority']) => {
    if (typeof priority === 'number') return priority;
    if (priority === 'Crítica') return 0;
    if (priority === 'Alta') return 1;
    if (priority === 'Media') return 2;
    return 3;
  };
  return (
    [...tasks]
      .filter((task) => !['DONE', 'COMPLETED', 'CANCELED'].includes(task.status))
      .sort((left, right) => {
        const priority = priorityRank(left.priority) - priorityRank(right.priority);
        return priority || left.due.localeCompare(right.due);
      })[0] || null
  );
}

export function implementationHealth(score: number) {
  if (score >= 80) return 'EN CONTROL';
  if (score >= 60) return 'ATENCIÓN';
  return 'EN RIESGO';
}
