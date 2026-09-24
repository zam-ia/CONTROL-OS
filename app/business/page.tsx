'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  CircleDollarSign,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  FileText,
  FolderCog,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Paperclip,
  Pencil,
  Plus,
  RefreshCw,
  Route,
  Settings,
  Target,
  Upload,
  UserMinus,
  Users,
  WalletCards,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CentraLogo } from '@/components/brand/centra-logo';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  businessAlerts,
  businessMetrics,
  businessSeed,
  clientProfitability,
  executeBusiness,
  monthlyTrend,
  removeBusinessDemoData,
  serviceProfitability,
  type BusinessCommand,
  type BusinessState,
} from '@/lib/business';

const STORAGE = 'control-business-os-production-v1';
type View =
  | 'dashboard'
  | 'finance'
  | 'clients'
  | 'services'
  | 'team'
  | 'work'
  | 'processes'
  | 'reports'
  | 'import'
  | 'settings';
type FormKind =
  | 'income'
  | 'expense'
  | 'client'
  | 'service'
  | 'team'
  | 'teamEnd'
  | 'position'
  | 'task'
  | 'calendar'
  | null;
type ActiveFormKind = Exclude<FormKind, null>;
type FormDrafts = Partial<Record<ActiveFormKind, Record<string, string>>>;
type AgendaView = 'month' | 'week' | 'day';
type SessionUser = {
  globalRole: string;
  organization: { id: string; name: string } | null;
};

const primaryNavigation = [
  { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
  { id: 'finance', label: 'Finanzas', icon: WalletCards },
  { id: 'clients', label: 'Clientes', icon: Users },
  { id: 'services', label: 'Servicios', icon: BriefcaseBusiness },
  { id: 'team', label: 'Equipo', icon: Users },
  { id: 'work', label: 'Agenda y tareas', icon: Target },
] as const;
const advancedNavigation = [
  { id: 'processes', label: 'Procesos e instrucciones', icon: FolderCog },
  { id: 'reports', label: 'Reportes', icon: FileText },
  { id: 'import', label: 'Importar', icon: Upload },
  { id: 'settings', label: 'Configuración', icon: Settings },
] as const;
const navigation = [...primaryNavigation, ...advancedNavigation] as const;

const organizationNames: Record<string, string> = {
  norte: 'Estudio Norte',
  orbita: 'Órbita Legal',
  vertice: 'Vértice Growth',
};

const money = (value: number) =>
  new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    maximumFractionDigits: 0,
  }).format(value);

const shortDate = (value: string) =>
  new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short' }).format(
    new Date(`${value}T12:00:00-05:00`),
  );

const dateKey = (value: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(value);

const todayKey = () => dateKey(new Date());

const addDays = (value: string, amount: number) => {
  const date = new Date(`${value}T12:00:00-05:00`);
  date.setDate(date.getDate() + amount);
  return dateKey(date);
};

const addMonths = (value: string, amount: number) => {
  const date = new Date(`${value}T12:00:00-05:00`);
  date.setMonth(date.getMonth() + amount);
  return dateKey(date);
};

const startOfWeek = (value: string) => {
  const date = new Date(`${value}T12:00:00-05:00`);
  const offset = (date.getDay() + 6) % 7;
  return addDays(value, -offset);
};

const agendaDays = (value: string, mode: AgendaView) => {
  if (mode === 'day') return [value];
  if (mode === 'week') {
    const start = startOfWeek(value);
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  }
  const monthStart = `${value.slice(0, 7)}-01`;
  const gridStart = startOfWeek(monthStart);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
};

const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

function download(filename: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Status({ value }: { value: string }) {
  const label: Record<string, string> = {
    ACTIVE: 'Activo',
    ENDED: 'Cesado',
    PAUSED: 'Pausado',
    REVIEW: 'En revisión',
    DRAFT: 'Borrador',
    ON_TRACK: 'En curso',
    AT_RISK: 'En riesgo',
    OFF_TRACK: 'Fuera de ruta',
    ACHIEVED: 'Logrado',
    TODO: 'Pendiente',
    IN_PROGRESS: 'En curso',
    BLOCKED: 'Bloqueada',
    DONE: 'Completa',
    COLLECTED: 'Cobrado',
    PENDING: 'Pendiente',
    OVERDUE: 'Vencido',
    OPEN: 'Abierto',
    LOCKED: 'Cerrado',
    SCHEDULED: 'Programado',
    CANCELED: 'Cancelado',
  };
  return (
    <span className={`business-status status-${value.toLowerCase()}`}>
      {label[value] || value}
    </span>
  );
}

function MetricCard({
  label,
  value,
  detail,
  explanation,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  detail: string;
  explanation: string;
  tone?: 'positive' | 'warning' | 'neutral';
}) {
  return (
    <article className={`business-metric metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
      <details className="business-calculation-help">
        <summary>
          <CircleHelp /> ¿Cómo se calcula?
        </summary>
        <p>{explanation}</p>
      </details>
    </article>
  );
}

export default function BusinessPage() {
  const [state, setState] = useState<BusinessState | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [form, setForm] = useState<FormKind>(null);
  const [returnForm, setReturnForm] = useState<'income' | 'expense' | null>(
    null,
  );
  const [formDrafts, setFormDrafts] = useState<FormDrafts>({});
  const [notice, setNotice] = useState('');
  const [importFile, setImportFile] = useState('');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingPositionId, setEditingPositionId] = useState<string | null>(
    null,
  );
  const [agendaView, setAgendaView] = useState<AgendaView>('month');
  const [agendaDate, setAgendaDate] = useState(todayKey);
  const [positionFile, setPositionFile] = useState<{
    name: string;
    data: string;
  } | null>(null);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      try {
        sessionStorage.removeItem('control-os-session');
      } catch {}
      window.location.assign('/');
    }
  };

  useEffect(() => {
    const media = window.matchMedia('(max-width: 820px)');
    const update = () => setIsMobileViewport(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(async () => {
      if (!active) return;
      setCollapsed(
        localStorage.getItem('control-business-sidebar-collapsed') === 'true',
      );
      let authenticatedUser: SessionUser | null = null;
      try {
        const response = await fetch('/api/auth/login', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });
        if (response.ok) {
          const payload = (await response.json()) as { user?: SessionUser };
          authenticatedUser = payload.user || null;
        }
      } catch {}
      if (!active) return;
      setAuthorized(Boolean(authenticatedUser));
      setSessionUser(authenticatedUser);
      let initial = businessSeed();
      const searchParams = new URLSearchParams(window.location.search);
      const requestedFromUrl = searchParams.get('org') || 'norte';
      const requestedView = searchParams.get('view');
      if (
        requestedView &&
        navigation.some((item) => item.id === requestedView)
      ) {
        setView(requestedView as View);
      }
      const clientOrganization = authenticatedUser?.organization;
      const knownClientOrganization = clientOrganization
        ? Object.entries(organizationNames).find(
            ([, name]) =>
              name.toLowerCase() === clientOrganization.name.toLowerCase(),
          )?.[0]
        : null;
      const requestedOrganization =
        authenticatedUser?.globalRole === 'CLIENT'
          ? knownClientOrganization || clientOrganization?.id || 'norte'
          : requestedFromUrl;
      const requestedOrganizationName =
        authenticatedUser?.globalRole === 'CLIENT'
          ? clientOrganization?.name || 'Mi empresa'
          : organizationNames[requestedOrganization] || 'Mi empresa';
      const saved = localStorage.getItem(STORAGE);
      if (saved) {
        try {
          const candidate = JSON.parse(saved) as BusinessState;
          if (
            candidate.schema === 2 &&
            candidate.workspace &&
            Array.isArray(candidate.incomes)
          )
            initial = {
              ...candidate,
              team: Array.isArray(candidate.team)
                ? candidate.team
                : initial.team,
              teamCosts: Array.isArray(candidate.teamCosts)
                ? candidate.teamCosts
                : initial.teamCosts,
              positions: Array.isArray(candidate.positions)
                ? candidate.positions
                : initial.positions,
              checklists: Array.isArray(candidate.checklists)
                ? candidate.checklists
                : initial.checklists,
              calendar: Array.isArray(candidate.calendar)
                ? candidate.calendar
                : initial.calendar,
            };
        } catch {
          setNotice(
            'No se pudo recuperar el estado anterior; se abrió un espacio limpio.',
          );
        }
      }
      if (initial.workspace.organizationId !== requestedOrganization) {
        initial = businessSeed();
        initial.workspace.organizationId = requestedOrganization;
        initial.workspace.id = `business-${requestedOrganization}`;
        initial.workspace.name = requestedOrganizationName;
      }
      if (requestedOrganization !== 'norte') {
        initial = removeBusinessDemoData(
          initial,
          requestedOrganization,
          requestedOrganizationName,
        );
      }
      if (authenticatedUser?.organization?.id) {
        try {
          const remoteResponse = await fetch('/api/business/state', {
            credentials: 'include',
            cache: 'no-store',
          });
          if (remoteResponse.ok) {
            const remotePayload = (await remoteResponse.json()) as {
              state?: BusinessState | null;
            };
            const remote = remotePayload.state;
            if (
              remote?.schema === 2 &&
              remote.workspace?.organizationId ===
                authenticatedUser.organization.id
            ) {
              initial = {
                ...remote,
                teamCosts: Array.isArray(remote.teamCosts)
                  ? remote.teamCosts
                  : initial.teamCosts,
              };
              localStorage.setItem(STORAGE, JSON.stringify(initial));
            }
          }
        } catch {
          setNotice(
            'Se abrió la copia guardada en este dispositivo; se reintentará sincronizar al guardar.',
          );
        }
      }
      setState(initial);
      setSessionReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const metrics = useMemo(
    () => (state ? businessMetrics(state) : null),
    [state],
  );
  const clients = useMemo(
    () => (state ? clientProfitability(state) : []),
    [state],
  );
  const services = useMemo(
    () => (state ? serviceProfitability(state) : []),
    [state],
  );
  const alerts = useMemo(() => (state ? businessAlerts(state) : []), [state]);
  const trend = useMemo(() => (state ? monthlyTrend(state) : []), [state]);

  const persist = (next: BusinessState) => {
    setState(next);
    try {
      localStorage.setItem(STORAGE, JSON.stringify(next));
    } catch {
      setNotice('El navegador no permitió guardar este cambio.');
    }
    if (sessionUser?.organization?.id) {
      void fetch('/api/business/state', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: next }),
      })
        .then(async (response) => {
          if (response.ok) return;
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(payload?.error || 'No se pudo sincronizar Supabase.');
        })
        .catch((error: unknown) =>
          setNotice(
            error instanceof Error
              ? `${error.message} El cambio sigue guardado en este dispositivo.`
              : 'No se pudo sincronizar Supabase; el cambio sigue guardado en este dispositivo.',
          ),
        );
    }
  };

  const run = (command: BusinessCommand) => {
    if (!state) return false;
    try {
      persist(executeBusiness(state, command));
      setNotice('Cambio guardado en Mi Empresa.');
      return true;
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar el cambio.',
      );
      return false;
    }
  };

  const go = (destination: View) => {
    setView(destination);
    setMobileOpen(false);
  };

  const closeForm = () => {
    if (form || returnForm) {
      setFormDrafts((current) => {
        const next = { ...current };
        if (form) delete next[form];
        if (returnForm) delete next[returnForm];
        return next;
      });
    }
    setReturnForm(null);
    setForm(null);
    setEditingTeamId(null);
    setEditingPositionId(null);
    setPositionFile(null);
  };

  const cancelCurrentForm = () => {
    if (returnForm && (form === 'client' || form === 'service')) {
      setForm(returnForm);
      setReturnForm(null);
      return;
    }
    closeForm();
  };

  const openRelatedForm = (
    target: 'client' | 'service',
    source: 'income' | 'expense',
    sourceForm: HTMLFormElement | null,
  ) => {
    if (sourceForm) {
      const draft = Object.fromEntries(
        [...new FormData(sourceForm).entries()].filter(
          (entry): entry is [string, string] => typeof entry[1] === 'string',
        ),
      );
      setFormDrafts((current) => ({ ...current, [source]: draft }));
    }
    setReturnForm(source);
    setForm(target);
  };

  const openTeamForm = (teamMemberId?: string) => {
    setEditingTeamId(teamMemberId || null);
    setForm('team');
  };

  const openTeamEndForm = (teamMemberId: string) => {
    setEditingTeamId(teamMemberId);
    setForm('teamEnd');
  };

  const openPositionForm = (positionId?: string) => {
    const position = state?.positions.find((item) => item.id === positionId);
    setEditingPositionId(positionId || null);
    setPositionFile(
      position?.profileFileData && position.profileFileName
        ? { name: position.profileFileName, data: position.profileFileData }
        : null,
    );
    setForm('position');
  };

  const readPositionFile = (file?: File) => {
    if (!file) return;
    if (file.size > 1_500_000) {
      setNotice('El archivo debe pesar menos de 1.5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string')
        setPositionFile({ name: file.name, data: reader.result });
      else setNotice('No se pudo leer el archivo del puesto.');
    };
    reader.onerror = () => setNotice('No se pudo leer el archivo del puesto.');
    reader.readAsDataURL(file);
  };

  if (!sessionReady || !state || !metrics)
    return <output className="business-loading">Preparando CENTRA…</output>;

  if (!authorized)
    return (
      <main className="business-access">
        <CentraLogo inverted priority />
        <p className="business-kicker">CENTRA · MI EMPRESA</p>
        <h1>Inicia sesión desde CENTRA</h1>
        <p>
          Mi Empresa comparte la misma sesión y organización. No necesitas una
          segunda cuenta.
        </p>
        <Link className="business-access-link" href="/">
          Ir al inicio de sesión <ArrowRight />
        </Link>
      </main>
    );

  const maxTrend = Math.max(
    1,
    ...trend.flatMap((item) => [item.revenue, item.expenses]),
  );
  const activeTitle =
    navigation.find((item) => item.id === view)?.label || 'Inicio';
  const nextAction = alerts[0];
  const currentDraft = form ? formDrafts[form] || {} : {};
  const draftValue = (key: string, fallback = '') =>
    currentDraft[key] ?? fallback;
  const editingMember = state.team.find((item) => item.id === editingTeamId);
  const editingPosition = state.positions.find(
    (item) => item.id === editingPositionId,
  );
  const visibleAgendaDays = agendaDays(agendaDate, agendaView);
  const agendaTitle = new Intl.DateTimeFormat('es-PE', {
    month: 'long',
    year: 'numeric',
    ...(agendaView === 'day' ? { day: 'numeric' } : {}),
  }).format(new Date(`${agendaDate}T12:00:00-05:00`));
  const positionPerformance = state.positions.map((position) => {
    const tasks = state.tasks.filter((task) => task.positionId === position.id);
    const completed = tasks.filter((task) => task.status === 'DONE').length;
    const activeMembers = state.team.filter(
      (member) =>
        member.positionId === position.id && member.status === 'ACTIVE',
    );
    return {
      position,
      tasks: tasks.length,
      completed,
      completion: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
      activeMembers,
    };
  });

  let content: React.ReactNode;
  if (view === 'dashboard')
    content = (
      <>
        <section className="business-hero">
          <div>
            <p className="business-kicker">PULSO DEL NEGOCIO</p>
            <h2>Decide con números claros.</h2>
            <p>
              Ingresos, costos y ejecución reunidos para revisar lo importante
              en menos de diez segundos.
            </p>
          </div>
          {nextAction && (
            <button
              className={`business-next severity-${nextAction.severity.toLowerCase()}`}
              onClick={() => go(nextAction.destination)}
            >
              <span>Revisar ahora</span>
              <strong>{nextAction.title}</strong>
              <ChevronRight />
            </button>
          )}
        </section>
        <section
          className="business-metrics"
          aria-label="Indicadores ejecutivos"
        >
          <MetricCard
            label="Facturación"
            value={money(metrics.revenue)}
            detail={`${money(metrics.collected)} cobrado`}
            explanation="Suma todos los ingresos registrados durante el período."
            tone="positive"
          />
          <MetricCard
            label="Utilidad operativa"
            value={money(metrics.operatingProfit)}
            detail={`${metrics.operatingMargin}% de margen`}
            explanation="Resta los gastos a los ingresos. El margen muestra qué porcentaje de los ingresos queda después de esos gastos."
            tone={metrics.operatingMargin >= 25 ? 'positive' : 'warning'}
          />
          <MetricCard
            label="Gastos"
            value={money(metrics.expenses)}
            detail={`${money(metrics.variableExpenses)} variables`}
            explanation="Suma todos los gastos registrados durante el período."
          />
          <MetricCard
            label="Caja del período"
            value={money(metrics.cashMovement)}
            detail={`${metrics.activeClients} clientes activos`}
            explanation="Resta las salidas de dinero a los cobros recibidos durante el período."
            tone={metrics.cashMovement >= 0 ? 'positive' : 'warning'}
          />
        </section>
        <div className="business-grid business-dashboard-grid">
          <section className="business-card business-wide">
            <div className="business-card-head">
              <div>
                <p className="business-kicker">TENDENCIA</p>
                <h3>Ingresos y gastos</h3>
              </div>
              <Status value={state.workspace.periodStatus} />
            </div>
            <figure
              className="business-chart"
              aria-label="Comparación mensual de ingresos y gastos"
            >
              {trend.map((item) => (
                <div className="business-chart-group" key={item.month}>
                  <div className="business-bars">
                    <span
                      className="bar-revenue"
                      style={{
                        height: `${Math.max(8, (item.revenue / maxTrend) * 100)}%`,
                      }}
                      title={`Ingresos ${money(item.revenue)}`}
                    />
                    <span
                      className="bar-expense"
                      style={{
                        height: `${Math.max(8, (item.expenses / maxTrend) * 100)}%`,
                      }}
                      title={`Gastos ${money(item.expenses)}`}
                    />
                  </div>
                  <small>{item.month.slice(5)}</small>
                </div>
              ))}
            </figure>
            <div className="chart-legend">
              <span>
                <i className="legend-revenue" /> Ingresos
              </span>
              <span>
                <i className="legend-expense" /> Gastos
              </span>
            </div>
          </section>
          <section className="business-card">
            <div className="business-card-head">
              <div>
                <p className="business-kicker">ALERTAS</p>
                <h3>Alertas explicables</h3>
              </div>
              <AlertTriangle />
            </div>
            <div className="business-alerts">
              {alerts.length ? (
                alerts.map((alert) => (
                  <button
                    key={alert.id}
                    onClick={() => go(alert.destination)}
                    className={`business-alert severity-${alert.severity.toLowerCase()}`}
                  >
                    <span>
                      {alert.severity === 'CRITICAL'
                        ? 'Crítica'
                        : alert.severity === 'WARNING'
                          ? 'Atención'
                          : 'Información'}
                    </span>
                    <strong>{alert.title}</strong>
                    <small>{alert.explanation}</small>
                  </button>
                ))
              ) : (
                <p className="business-empty">
                  <CheckCircle2 /> No hay alertas activas.
                </p>
              )}
            </div>
          </section>
          <section className="business-card">
            <div className="business-card-head">
              <div>
                <p className="business-kicker">CLIENTES</p>
                <h3>Lo que deja cada cliente</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => go('clients')}>
                Ver todos
              </Button>
            </div>
            <div className="profit-list">
              {clients.slice(0, 4).map((client) => (
                <div key={client.id}>
                  <span>
                    <strong>{client.name}</strong>
                    <small>{money(client.contribution)} para la empresa</small>
                  </span>
                  <b className={client.margin < 20 ? 'negative' : ''}>
                    {client.margin}%
                  </b>
                </div>
              ))}
            </div>
          </section>
          <section className="business-card">
            <div className="business-card-head">
              <div>
                <p className="business-kicker">ESTRUCTURA DE COSTOS</p>
                <h3>Composición del gasto</h3>
              </div>
              <CircleDollarSign />
            </div>
            <div className="expense-stack" aria-label="Composición del gasto">
              {[
                ['Variable', metrics.variableExpenses, 'variable'],
                ['Fijo', metrics.fixedExpenses, 'fixed'],
                ['Mixto', metrics.mixedExpenses, 'mixed'],
              ].map(([label, amount, className]) => {
                const numericAmount = Number(amount);
                return (
                  <div key={String(label)}>
                    <span>
                      <b>{label}</b>
                      <small>{money(numericAmount)}</small>
                    </span>
                    <i>
                      <em
                        className={`expense-${className}`}
                        style={{
                          width: `${Math.max(2, (numericAmount / Math.max(1, metrics.expenses)) * 100)}%`,
                        }}
                      />
                    </i>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </>
    );
  else if (view === 'finance')
    content = (
      <>
        <section className="business-metrics compact-metrics">
          <MetricCard
            label="Ingresos"
            value={money(metrics.revenue)}
            detail={`${state.incomes.filter((item) => item.status === 'POSTED').length} movimientos`}
            explanation="Suma los movimientos de ingreso confirmados en este período."
            tone="positive"
          />
          <MetricCard
            label="Gastos"
            value={money(metrics.expenses)}
            detail={`${state.expenses.filter((item) => item.status === 'POSTED').length} movimientos`}
            explanation="Suma los movimientos de gasto confirmados en este período."
          />
          <MetricCard
            label="Pendiente de cobro"
            value={money(metrics.revenue - metrics.collected)}
            detail="Seguimiento requerido"
            explanation="Resta lo ya cobrado del total facturado durante el período."
            tone="warning"
          />
          <MetricCard
            label="Margen operativo"
            value={`${metrics.operatingMargin}%`}
            detail={money(metrics.operatingProfit)}
            explanation="Divide la utilidad operativa entre los ingresos y multiplica el resultado por 100."
            tone={metrics.operatingMargin >= 25 ? 'positive' : 'warning'}
          />
        </section>
        <section className="business-card">
          <div className="business-card-head">
            <div>
              <p className="business-kicker">LIBRO OPERATIVO</p>
              <h3>Movimientos financieros</h3>
            </div>
            <div className="business-actions">
              <Button
                variant="outline"
                onClick={() => setForm('expense')}
                disabled={state.workspace.periodStatus === 'LOCKED'}
              >
                <Plus /> Gasto
              </Button>
              <Button
                onClick={() => setForm('income')}
                disabled={state.workspace.periodStatus === 'LOCKED'}
              >
                <Plus /> Ingreso
              </Button>
            </div>
          </div>
          <div className="business-table-wrap">
            <table className="business-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Concepto</th>
                  <th>Cliente / proveedor</th>
                  <th>Estado</th>
                  <th className="numeric">Monto</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ...state.incomes.map((entry) => ({
                    id: entry.id,
                    date: entry.date,
                    description: entry.description,
                    entity:
                      state.clients.find((item) => item.id === entry.clientId)
                        ?.name || 'Cliente',
                    status: entry.paymentStatus,
                    amount: entry.netAmount,
                    kind: 'income',
                  })),
                  ...state.expenses.map((entry) => ({
                    id: entry.id,
                    date: entry.date,
                    description: entry.description,
                    entity: entry.supplier,
                    status: entry.paid ? 'COLLECTED' : 'PENDING',
                    amount: -entry.grossAmount,
                    kind: 'expense',
                  })),
                ]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((entry) => (
                    <tr key={entry.id}>
                      <td data-label="Fecha">{shortDate(entry.date)}</td>
                      <td data-label="Concepto">
                        <strong>{entry.description}</strong>
                        <small>
                          {entry.kind === 'income' ? 'Ingreso' : 'Gasto'}
                        </small>
                      </td>
                      <td data-label="Cliente / proveedor">{entry.entity}</td>
                      <td data-label="Estado">
                        <Status value={entry.status} />
                      </td>
                      <td
                        data-label="Monto"
                        className={`numeric ${entry.amount < 0 ? 'negative' : 'positive'}`}
                      >
                        {money(entry.amount)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="business-period">
            <span>
              <LockKeyhole />
              <b>
                Período{' '}
                {state.workspace.periodStatus === 'OPEN'
                  ? 'abierto'
                  : 'cerrado'}
              </b>
              <small>
                El cierre bloquea movimientos y prepara un snapshot inmutable.
              </small>
            </span>
            <Button
              variant="outline"
              disabled={state.workspace.periodStatus === 'LOCKED'}
              onClick={() => run({ type: 'lockPeriod' })}
            >
              Cerrar período
            </Button>
          </div>
        </section>
      </>
    );
  else if (view === 'clients')
    content = (
      <section className="business-card">
        <div className="business-card-head">
          <div>
            <p className="business-kicker">SEGUIMIENTO DE CLIENTES</p>
            <h3>Rentabilidad por cliente</h3>
          </div>
          <Button onClick={() => setForm('client')}>
            <Plus /> Nuevo cliente
          </Button>
        </div>
        <div className="business-table-wrap">
          <table className="business-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Estado</th>
                <th className="numeric">Ingresos</th>
                <th className="numeric">Costo directo</th>
                <th className="numeric">Lo que deja</th>
                <th className="numeric">Margen</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((row) => {
                const client = state.clients.find(
                  (item) => item.id === row.id,
                )!;
                return (
                  <tr key={row.id}>
                    <td data-label="Cliente">
                      <strong>{row.name}</strong>
                      <small>
                        {client.segment} · {client.owner}
                      </small>
                    </td>
                    <td data-label="Estado">
                      <Status value={client.status} />
                    </td>
                    <td data-label="Ingresos" className="numeric">
                      {money(row.revenue)}
                    </td>
                    <td data-label="Costo directo" className="numeric">
                      {money(row.directCost)}
                    </td>
                    <td data-label="Lo que deja" className="numeric">
                      {money(row.contribution)}
                    </td>
                    <td
                      data-label="Margen"
                      className={`numeric ${row.margin < 20 ? 'negative' : 'positive'}`}
                    >
                      {row.margin}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="business-note">
          “Lo que deja” son los ingresos del cliente menos sus costos directos.
          Los gastos generales aparecen en el resumen de ingresos y gastos.
        </p>
      </section>
    );
  else if (view === 'services')
    content = (
      <section className="business-card">
        <div className="business-card-head">
          <div>
            <p className="business-kicker">PORTAFOLIO</p>
            <h3>Rentabilidad por servicio</h3>
          </div>
          <Button onClick={() => setForm('service')}>
            <Plus /> Nuevo servicio
          </Button>
        </div>
        <div className="service-cards">
          {services.map((row) => {
            const service = state.services.find((item) => item.id === row.id)!;
            return (
              <article key={row.id}>
                <div>
                  <span className="service-icon">
                    <BriefcaseBusiness />
                  </span>
                  <Status value={service.status} />
                </div>
                <h4>{row.name}</h4>
                <p>
                  {service.category} · capacidad {service.capacityMonth}/mes
                </p>
                <dl>
                  <div>
                    <dt>Ingresos</dt>
                    <dd>{money(row.revenue)}</dd>
                  </div>
                  <div>
                    <dt>Lo que deja</dt>
                    <dd>{money(row.contribution)}</dd>
                  </div>
                  <div>
                    <dt>Margen</dt>
                    <dd className={row.margin < 20 ? 'negative' : 'positive'}>
                      {row.margin}%
                    </dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      </section>
    );
  else if (view === 'team')
    content = (
      <div className="business-grid work-grid">
        <section className="business-card business-wide">
          <div className="business-card-head">
            <div>
              <p className="business-kicker">EQUIPO Y CAPACIDAD</p>
              <h3>Personas, costos e historial laboral</h3>
            </div>
            <Button onClick={() => openTeamForm()}>
              <Plus /> Añadir persona
            </Button>
          </div>
          <p className="business-note business-note-top">
            Edita los datos cuando cambien. Si alguien deja la empresa, registra
            su cese: sus gastos, tareas y resultados anteriores no se borran.
          </p>
          <div className="business-table-wrap">
            <table className="business-table">
              <thead>
                <tr>
                  <th>Persona</th>
                  <th>Puesto</th>
                  <th>Modalidad</th>
                  <th>Supervisor</th>
                  <th className="numeric">Costo mensual</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {state.team.map((member) => {
                  const position = state.positions.find(
                    (item) => item.id === member.positionId,
                  );
                  const costs = state.teamCosts.filter(
                    (item) => item.teamMemberId === member.id,
                  );
                  return (
                  <tr key={member.id} className={member.status === 'ENDED' ? 'is-ended' : ''}>
                    <td data-label="Persona">
                      <strong>{member.name}</strong>
                      <small>{member.email}</small>
                      <small>
                        Desde {member.startedOn ? shortDate(member.startedOn) : 'sin fecha'}
                        {member.endedOn ? ` · hasta ${shortDate(member.endedOn)}` : ''}
                      </small>
                    </td>
                    <td data-label="Puesto">{position?.name || 'Sin puesto'}</td>
                    <td data-label="Modalidad">{member.modality}</td>
                    <td data-label="Supervisor">{member.supervisor}</td>
                    <td data-label="Costo mensual" className="numeric">
                      {money(member.monthlyCost)}
                      {costs.length > 1 && (
                        <small>{costs.length} periodos guardados</small>
                      )}
                    </td>
                    <td data-label="Estado">
                      <Status value={member.status} />
                      {member.terminationReason && (
                        <small>{member.terminationReason}</small>
                      )}
                    </td>
                    <td data-label="Acciones">
                      <div className="business-row-actions">
                        <button type="button" onClick={() => openTeamForm(member.id)}>
                          <Pencil /> Editar
                        </button>
                        {member.status !== 'ENDED' && (
                          <button
                            type="button"
                            className="danger"
                            onClick={() => openTeamEndForm(member.id)}
                          >
                            <UserMinus /> Registrar cese
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
        <section className="business-card business-wide">
          <div className="business-card-head">
            <div>
              <p className="business-kicker">PUESTOS</p>
              <h3>Perfiles conectados con el equipo</h3>
            </div>
            <Button variant="outline" onClick={() => openPositionForm()}>
              <Plus /> Crear puesto
            </Button>
          </div>
          <div className="service-cards">
            {state.positions.map((position) => (
              <article key={position.id}>
                <div>
                  <span className="service-icon">
                    <Users />
                  </span>
                  <Status value={position.status || 'ACTIVE'} />
                </div>
                <h4>{position.name}</h4>
                <p>
                  {position.area} · Backup: {position.backup}
                </p>
                <strong>{position.purpose}</strong>
                <ul>
                  {position.functions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="business-position-meta">
                  {position.kpis.length} KPI{position.kpis.length === 1 ? '' : 's'}
                  {position.profileFileName ? ` · ${position.profileFileName}` : ''}
                </p>
                <button
                  type="button"
                  className="business-inline-create"
                  onClick={() => openPositionForm(position.id)}
                >
                  <Pencil /> Editar perfil
                </button>
              </article>
            ))}
          </div>
        </section>
        <section className="business-card business-wide">
          <div className="business-card-head">
            <div>
              <p className="business-kicker">CHECKLISTS RECURRENTES</p>
              <h3>Funciones críticas de esta semana</h3>
            </div>
            <ClipboardCheck />
          </div>
          <div className="business-task-list">
            {state.checklists.map((checklist) => (
              <label key={checklist.id}>
                <input
                  type="checkbox"
                  checked={checklist.completed}
                  onChange={() =>
                    run({ type: 'toggleChecklist', checklistId: checklist.id })
                  }
                />
                <span>
                  <strong>{checklist.task}</strong>
                  <small>
                    {checklist.owner} · {checklist.frequency} · vence{' '}
                    {shortDate(checklist.dueOn)}
                    {checklist.evidenceRequired ? ' · requiere evidencia' : ''}
                  </small>
                </span>
                <Status value={checklist.completed ? 'DONE' : 'TODO'} />
              </label>
            ))}
          </div>
        </section>
        <section className="business-card">
          <div className="business-card-head">
            <div>
              <p className="business-kicker">AGENDA</p>
              <h3>Próximos eventos</h3>
            </div>
            <BarChart3 />
          </div>
          <div className="business-task-list">
            {state.calendar.map((event) => (
              <div className="business-agenda-row" key={event.id}>
                <span>
                  <strong>{event.title}</strong>
                  <small>
                    {new Intl.DateTimeFormat('es-PE', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(event.startsAt))}{' '}
                    · {event.owner}
                  </small>
                </span>
                <Status value={event.type} />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  else if (view === 'work')
    content = (
      <div className="business-grid work-grid business-agenda-page">
        <section className="business-card business-wide">
          <div className="business-card-head business-agenda-head">
            <div>
              <p className="business-kicker">AGENDA DE TU EMPRESA</p>
              <h3>Planifica visitas, operaciones, grabaciones y pendientes</h3>
              <p>
                Estas actividades pertenecen a tu negocio, no al programa de CENTRA.
              </p>
            </div>
            <div className="business-actions">
              <Button variant="outline" onClick={() => setForm('calendar')}>
                <CalendarDays /> Nuevo evento
              </Button>
              <Button onClick={() => setForm('task')}>
                <Plus /> Nueva tarea
              </Button>
            </div>
          </div>
          <div className="business-calendar-toolbar">
            <div className="business-calendar-navigation">
              <button
                type="button"
                aria-label="Periodo anterior"
                onClick={() =>
                  setAgendaDate((current) =>
                    agendaView === 'month'
                      ? addMonths(current, -1)
                      : addDays(current, agendaView === 'week' ? -7 : -1),
                  )
                }
              >
                <ChevronLeft />
              </button>
              <button type="button" onClick={() => setAgendaDate(todayKey())}>
                Hoy
              </button>
              <button
                type="button"
                aria-label="Periodo siguiente"
                onClick={() =>
                  setAgendaDate((current) =>
                    agendaView === 'month'
                      ? addMonths(current, 1)
                      : addDays(current, agendaView === 'week' ? 7 : 1),
                  )
                }
              >
                <ChevronRight />
              </button>
              <strong>{agendaTitle}</strong>
            </div>
            <div className="business-segmented" aria-label="Vista de agenda">
              {(['month', 'week', 'day'] as const).map((mode) => (
                <button
                  type="button"
                  key={mode}
                  className={agendaView === mode ? 'active' : ''}
                  onClick={() => setAgendaView(mode)}
                >
                  {mode === 'month' ? 'Mes' : mode === 'week' ? 'Semana' : 'Día'}
                </button>
              ))}
            </div>
          </div>
          {agendaView !== 'day' && (
            <div className="business-calendar-weekdays" aria-hidden="true">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
          )}
          <div className={`business-calendar-grid is-${agendaView}`}>
            {visibleAgendaDays.map((day) => {
              const dayTasks = state.tasks.filter((task) => task.dueOn === day);
              const dayEvents = state.calendar.filter(
                (event) => dateKey(new Date(event.startsAt)) === day,
              );
              const outsideMonth = day.slice(0, 7) !== agendaDate.slice(0, 7);
              return (
                <article
                  key={day}
                  className={`${day === todayKey() ? 'is-today' : ''} ${
                    outsideMonth && agendaView === 'month' ? 'is-outside' : ''
                  }`}
                >
                  <header>
                    <strong>{new Date(`${day}T12:00:00-05:00`).getDate()}</strong>
                    {agendaView !== 'month' && <span>{shortDate(day)}</span>}
                  </header>
                  <div className="business-calendar-items">
                    {dayEvents.map((event) => (
                      <div className="calendar-item event" key={event.id}>
                        <span>{new Date(event.startsAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
                        <strong>{event.title}</strong>
                        <small>{event.owner}</small>
                      </div>
                    ))}
                    {dayTasks.map((task) => (
                      <button
                        type="button"
                        className={`calendar-item task ${task.status === 'DONE' ? 'done' : ''}`}
                        key={task.id}
                        onClick={() => run({ type: 'toggleTask', taskId: task.id })}
                      >
                        <span>{task.priority === 'URGENT' ? 'Urgente' : 'Tarea'}</span>
                        <strong>{task.title}</strong>
                        <small>{task.owner}</small>
                      </button>
                    ))}
                    {!dayTasks.length && !dayEvents.length && agendaView === 'day' && (
                      <p className="business-empty-day">No hay actividades para este día.</p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
        <section className="business-card business-wide">
          <div className="business-card-head">
            <div>
              <p className="business-kicker">TAREAS DE LA EMPRESA</p>
              <h3>Responsables, puestos y alertas</h3>
            </div>
            <ClipboardCheck />
          </div>
          <div className="business-task-list">
            {state.tasks.map((task) => {
              const position = state.positions.find((item) => item.id === task.positionId);
              return (
                <label key={task.id}>
                  <input
                    type="checkbox"
                    checked={task.status === 'DONE'}
                    onChange={() => run({ type: 'toggleTask', taskId: task.id })}
                  />
                  <span>
                    <strong>{task.title}</strong>
                    <small>
                      {task.owner} · {position?.name || 'Sin puesto'} · {shortDate(task.dueOn)}
                      {task.alertMinutes ? ` · alerta ${task.alertMinutes} min antes` : ''}
                    </small>
                  </span>
                  <Status value={task.status} />
                </label>
              );
            })}
          </div>
        </section>
      </div>
    );
  else if (view === 'processes')
    content = (
      <div className="business-grid work-grid">
      <section className="business-card business-wide">
        <div className="business-card-head">
          <div>
            <p className="business-kicker">PERFILES DE PUESTO</p>
            <h3>Qué debe lograr y medir cada puesto</h3>
          </div>
          <Button onClick={() => openPositionForm()}>
            <Plus /> Crear perfil
          </Button>
        </div>
        <p className="business-note business-note-top">
          Crea el perfil aquí o adjunta el documento que ya usa tu empresa. El
          puesto queda disponible para asignar personas, tareas y KPIs.
        </p>
        <div className="business-position-grid">
          {state.positions.map((position) => {
            const assigned = state.team.filter(
              (member) => member.positionId === position.id && member.status === 'ACTIVE',
            );
            return (
              <article key={position.id}>
                <header>
                  <div>
                    <span>{position.area || 'Sin área'}</span>
                    <h4>{position.name}</h4>
                  </div>
                  <Status value={position.status || 'ACTIVE'} />
                </header>
                <p>{position.purpose}</p>
                <dl>
                  <div><dt>Personas asignadas</dt><dd>{assigned.map((member) => member.name).join(', ') || 'Sin asignar'}</dd></div>
                  <div><dt>Funciones</dt><dd>{position.functions.length}</dd></div>
                  <div><dt>KPIs</dt><dd>{position.kpis.join(', ') || 'Sin definir'}</dd></div>
                </dl>
                {position.profileFileName && (
                  <a href={position.profileFileData} download={position.profileFileName}>
                    <Paperclip /> {position.profileFileName}
                  </a>
                )}
                <Button variant="outline" onClick={() => openPositionForm(position.id)}>
                  <Pencil /> Editar perfil
                </Button>
              </article>
            );
          })}
        </div>
      </section>
      <section className="business-card business-wide">
        <div className="business-card-head">
          <div>
            <p className="business-kicker">SISTEMA OPERATIVO</p>
            <h3>Procesos e instrucciones</h3>
          </div>
          <FolderCog />
        </div>
        <div className="process-grid">
          {state.processes.map((process) => (
            <article key={process.id}>
              <div>
                <Status value={process.status} />
                <span>Instrucciones v{process.sopVersion}</span>
              </div>
              <h4>{process.name}</h4>
              <p>
                <b>Responsable</b>
                {process.owner}
              </p>
              <p>
                <b>Disparador</b>
                {process.trigger}
              </p>
              <p>
                <b>Salida</b>
                {process.output}
              </p>
              <footer>
                <span>
                  <b>Tiempo esperado</b>
                  {process.sla}
                </span>
                <span>
                  <b>Número importante</b>
                  {process.kpi}
                </span>
              </footer>
            </article>
          ))}
        </div>
        <p className="business-note">
          Una versión publicada no se sobrescribe. Cada cambio genera una nueva
          versión de las instrucciones y conserva el histórico.
        </p>
      </section>
      </div>
    );
  else if (view === 'reports')
    content = (
      <div className="report-grid">
        <section className="business-card business-wide business-kpi-report">
          <div className="business-card-head">
            <div>
              <p className="business-kicker">KPIS POR PUESTO</p>
              <h3>Resultados vinculados con tareas reales</h3>
            </div>
            <BarChart3 />
          </div>
          <div className="business-table-wrap">
            <table className="business-table">
              <thead>
                <tr>
                  <th>Puesto</th>
                  <th>Persona actual</th>
                  <th>KPIs definidos</th>
                  <th>Tareas asignadas</th>
                  <th>Completadas</th>
                  <th>Avance</th>
                </tr>
              </thead>
              <tbody>
                {positionPerformance.map((row) => (
                  <tr key={row.position.id}>
                    <td data-label="Puesto"><strong>{row.position.name}</strong><small>{row.position.area}</small></td>
                    <td data-label="Persona actual">{row.activeMembers.map((member) => member.name).join(', ') || 'Sin asignar'}</td>
                    <td data-label="KPIs definidos">{row.position.kpis.join(', ') || 'Sin definir'}</td>
                    <td data-label="Tareas asignadas">{row.tasks}</td>
                    <td data-label="Completadas">{row.completed}</td>
                    <td data-label="Avance"><strong>{row.completion}%</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="business-note">
            El avance se calcula con tareas enlazadas al puesto. Los KPIs escritos
            en el perfil indican qué resultados debe revisar la empresa.
          </p>
        </section>
        <section className="business-card">
          <FileSpreadsheet />
          <h3>Libro financiero</h3>
          <p>Resumen de ingresos y gastos del espacio actual.</p>
          <Button
            variant="outline"
            onClick={() =>
              download(
                'control-business-finanzas.csv',
                [
                  'tipo,fecha,concepto,monto',
                  ...state.incomes.map(
                    (entry) =>
                      `ingreso,${entry.date},${JSON.stringify(entry.description)},${entry.netAmount}`,
                  ),
                  ...state.expenses.map(
                    (entry) =>
                      `gasto,${entry.date},${JSON.stringify(entry.description)},${entry.grossAmount}`,
                  ),
                ].join('\n'),
                'text/csv',
              )
            }
          >
            <Download /> Descargar CSV
          </Button>
        </section>
        <section className="business-card">
          <FileText />
          <h3>Respaldo del espacio</h3>
          <p>Datos estructurados para continuidad y migración.</p>
          <Button
            variant="outline"
            onClick={() =>
              download(
                'control-business-workspace.json',
                JSON.stringify(state, null, 2),
                'application/json',
              )
            }
          >
            <Download /> Descargar JSON
          </Button>
        </section>
        <section className="business-card">
          <BarChart3 />
          <h3>Reporte ejecutivo</h3>
          <p>Resumen mensual con números importantes, alertas y prioridades.</p>
          <Button variant="outline" onClick={() => window.print()}>
            <Download /> Preparar PDF
          </Button>
        </section>
      </div>
    );
  else if (view === 'import')
    content = (
      <section className="business-card import-card">
        <div className="business-card-head">
          <div>
            <p className="business-kicker">MIGRACIÓN INICIAL</p>
            <h3>Importar histórico desde Excel</h3>
          </div>
          <Upload />
        </div>
        <ol className="import-steps">
          <li className="active">
            <b>1</b>
            <span>Archivo</span>
          </li>
          <li>
            <b>2</b>
            <span>Mapeo</span>
          </li>
          <li>
            <b>3</b>
            <span>Vista previa</span>
          </li>
          <li>
            <b>4</b>
            <span>Confirmación</span>
          </li>
        </ol>
        <label className="import-drop">
          <FileSpreadsheet />
          <strong>{importFile || 'Selecciona un archivo XLSX o CSV'}</strong>
          <span>
            El sistema validará encabezados, duplicados y taxonomías antes de
            importar.
          </span>
          <input
            type="file"
            accept=".xlsx,.csv"
            onChange={(event) =>
              setImportFile(event.target.files?.[0]?.name || '')
            }
          />
        </label>
        {importFile && (
          <div className="import-ready">
            <CheckCircle2 />
            <span>
              <strong>Archivo listo para mapear</strong>
              <small>
                {importFile} · todavía no se ha escrito ningún dato.
              </small>
            </span>
            <Button
              onClick={() =>
                setNotice(
                  'El mapeo se habilitará cuando el backend de importación esté conectado.',
                )
              }
            >
              Continuar
            </Button>
          </div>
        )}
        <p className="business-note">
          La importación productiva se ejecutará como job idempotente y generará
          un reporte de filas válidas, advertencias, rechazadas y duplicadas.
        </p>
      </section>
    );
  else
    content = (
      <div className="business-grid settings-grid">
        <section className="business-card">
          <p className="business-kicker">WORKSPACE</p>
          <h3>{state.workspace.name}</h3>
          <dl className="settings-list">
            <div>
              <dt>Estado</dt>
              <dd>
                <Status value={state.workspace.status} />
              </dd>
            </div>
            <div>
              <dt>Plan</dt>
              <dd>{state.workspace.plan}</dd>
            </div>
            <div>
              <dt>Moneda</dt>
              <dd>{state.workspace.currency}</dd>
            </div>
            <div>
              <dt>Zona horaria</dt>
              <dd>{state.workspace.timezone}</dd>
            </div>
          </dl>
        </section>
        <section className="business-card">
          <p className="business-kicker">SEGURIDAD</p>
          <h3>Aislamiento y acceso</h3>
          <ul className="security-list">
            <li>
              <CheckCircle2 />
              Identidad y organización compartidas con CENTRA
            </li>
            <li>
              <CheckCircle2 />
              Modelo preparado para RLS por organization_id
            </li>
            <li>
              <CheckCircle2 />
              Archivos privados mediante URLs firmadas
            </li>
            <li>
              <LockKeyhole />
              2FA y auditoría sensible se activan en la integración de servidor
            </li>
          </ul>
        </section>
        <section className="business-card business-wide">
          <p className="business-kicker">INTEGRACIÓN</p>
          <h3>Estado de plataforma</h3>
          <div className="integration-row">
            <span className="integration-icon">
              <RefreshCw />
            </span>
            <span>
              <strong>CENTRA ↔ Mi Empresa</strong>
              <small>
                Misma sesión, organization_id estable y retorno a la ruta de
                implementación.
              </small>
            </span>
            <Status value="ACTIVE" />
          </div>
          <p className="business-note">
            El frontend ya está desplegable en Vercel. Los workers persistentes,
            colas, imports y reportes asíncronos pertenecen al backend de
            containers definido en la arquitectura.
          </p>
        </section>
      </div>
    );

  return (
    <div
      className={`business-shell${collapsed ? ' is-collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}
    >
      <aside
        className="business-sidebar"
        id="business-navigation"
        aria-label="Navegación de Mi Empresa"
        aria-hidden={isMobileViewport && !mobileOpen ? true : undefined}
        inert={isMobileViewport && !mobileOpen ? true : undefined}
      >
        <div className="business-brand">
          <Link href="/" aria-label="Volver a CENTRA">
            <CentraLogo compact={collapsed} inverted />
          </Link>
          <button
            type="button"
            onClick={() => {
              const next = !collapsed;
              setCollapsed(next);
              localStorage.setItem(
                'control-business-sidebar-collapsed',
                String(next),
              );
            }}
            aria-label={
              collapsed ? 'Desplegar barra lateral' : 'Contraer barra lateral'
            }
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </button>
          <button
            className="business-mobile-close"
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar navegación"
          >
            <X />
          </button>
        </div>
        <div className="business-workspace">
          <small>ORGANIZACIÓN</small>
          <strong>{state.workspace.name}</strong>
          <span>
            {state.workspace.plan} · {state.workspace.currency}
          </span>
        </div>
        <p className="business-nav-label">GESTIONAR</p>
        <nav>
          {primaryNavigation.map(({ id, label, icon: Icon }) => (
            <button
              type="button"
              key={id}
              className={view === id ? 'active' : ''}
              aria-current={view === id ? 'page' : undefined}
              title={collapsed ? label : undefined}
              onClick={() => go(id)}
            >
              <Icon />
              <span>{label}</span>
              {id === 'finance' &&
                alerts.some((item) => item.destination === 'finance') && <i />}
            </button>
          ))}
        </nav>
        <details
          className="business-more-navigation"
          open={advancedNavigation.some((item) => item.id === view)}
        >
          <summary>
            <ChevronRight />
            <span>Más opciones</span>
          </summary>
          <nav aria-label="Más opciones de Mi Empresa">
            {advancedNavigation.map(({ id, label, icon: Icon }) => (
              <button
                type="button"
                key={id}
                className={view === id ? 'active' : ''}
                aria-current={view === id ? 'page' : undefined}
                title={collapsed ? label : undefined}
                onClick={() => go(id)}
              >
                <Icon />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </details>
        <Link
          className="back-to-control"
          href={`/?return_from=business&org=${encodeURIComponent(state.workspace.organizationId)}`}
        >
          <ArrowLeft />
          <span>Volver a CENTRA</span>
        </Link>
        <button
          className="business-logout"
          type="button"
          title="Cerrar sesión"
          onClick={() => void logout()}
        >
          <LogOut />
          <span>Cerrar sesión</span>
        </button>
        <div className="business-sidebar-foot">
          <Building2 />
          <span>
            <b>Mi Empresa</b>
            <small>Datos para decidir. Sistema para ejecutar.</small>
          </span>
        </div>
      </aside>
      <button
        className="business-backdrop"
        type="button"
        aria-label="Cerrar navegación"
        aria-hidden={!mobileOpen}
        tabIndex={mobileOpen ? 0 : -1}
        onClick={() => setMobileOpen(false)}
      />
      <main className="business-main">
        <header className="business-header">
          <div>
            <button
              className="business-menu"
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-controls="business-navigation"
              aria-expanded={mobileOpen}
              aria-label="Abrir navegación"
            >
              <Menu />
            </button>
            <span>
              Mi Empresa <ChevronRight /> <b>{activeTitle}</b>
            </span>
          </div>
          <div>
            <span className="sync-state">
              <i /> Sincronizado
            </span>
            <button
              className="business-avatar"
              title="Sesión compartida con CENTRA"
            >
              AC
            </button>
          </div>
        </header>
        <div className="business-content">
          <div className="business-heading">
            <div>
              <p className="business-kicker">CENTRA · MI EMPRESA</p>
              <h1>{activeTitle}</h1>
              <p>{state.workspace.name} · información operativa y financiera</p>
            </div>
            {view !== 'dashboard' && (
              <Button variant="outline" onClick={() => go('dashboard')}>
                <LayoutDashboard /> Ver resumen
              </Button>
            )}
          </div>
          {content}
          <footer className="business-footer">
            <span>CENTRA · Todo tu negocio en un solo lugar</span>
            <span>America/Lima · PEN · {state.workspace.name}</span>
          </footer>
        </div>
      </main>
      <nav
        className="business-bottom-nav"
        aria-label="Navegación móvil de CENTRA"
      >
        <Link href="/?page=inicio">
          <LayoutDashboard />
          <span>Inicio</span>
        </Link>
        <Link href="/?page=ruta">
          <Route />
          <span>Ruta</span>
        </Link>
        <button
          type="button"
          className={view === 'dashboard' ? 'active' : ''}
          aria-current={view === 'dashboard' ? 'page' : undefined}
          onClick={() => go('dashboard')}
        >
          <BriefcaseBusiness />
          <span>Empresa</span>
        </button>
        <button
          type="button"
          aria-expanded={mobileOpen}
          aria-controls="business-navigation"
          onClick={() => setMobileOpen(true)}
        >
          <Menu />
          <span>Más</span>
        </button>
      </nav>
      <Dialog
        open={form !== null}
        onOpenChange={(open) => {
          if (!open) closeForm();
        }}
      >
        <DialogContent className="control-dialog business-dialog">
          <DialogTitle>
            {form === 'income'
              ? 'Registrar ingreso'
              : form === 'expense'
                ? 'Registrar gasto'
                : form === 'client'
                  ? 'Crear cliente'
                  : form === 'service'
                    ? 'Crear servicio'
                    : form === 'team'
                      ? editingMember
                        ? 'Editar colaborador'
                        : 'Añadir colaborador'
                      : form === 'teamEnd'
                        ? 'Registrar cese'
                        : form === 'position'
                          ? editingPosition
                            ? 'Editar perfil de puesto'
                            : 'Crear perfil de puesto'
                          : form === 'task'
                            ? 'Nueva tarea de la empresa'
                            : 'Nuevo evento de agenda'}
          </DialogTitle>
          <DialogDescription>
            {form === 'income'
              ? 'Anota una venta o un pago que recibió tu negocio.'
              : form === 'expense'
                ? 'Anota una compra, pago o salida de dinero de tu negocio.'
                : form === 'client'
                  ? 'Guarda los datos básicos para reconocer y atender a este cliente.'
                  : form === 'service'
                    ? 'Guarda lo que vendes, cuánto cobras y cuántos clientes puedes atender.'
                    : form === 'team'
                      ? 'Actualiza sus datos y costo sin perder los periodos anteriores.'
                      : form === 'teamEnd'
                        ? 'El cese cierra su periodo laboral, pero conserva todos sus gastos, tareas y resultados.'
                        : form === 'position'
                          ? 'Define responsabilidades y KPIs para enlazar personas y tareas.'
                          : form === 'task'
                            ? 'Asigna una tarea a una persona o puesto y configura su alerta.'
                            : 'Agenda una actividad propia de la empresa.'}
          </DialogDescription>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const value = (key: string) => {
                const raw = data.get(key);
                return typeof raw === 'string' ? raw.trim() : '';
              };
              const amount = (key: string) => Number(value(key));
              let ok = false;
              let createdRelatedId = '';
              if (form === 'income')
                ok = run({
                  type: 'addIncome',
                  entry: {
                    id: makeId('income'),
                    date: value('date'),
                    clientId: value('clientId'),
                    serviceId: value('serviceId'),
                    description: value('description'),
                    netAmount: amount('amount'),
                    paymentStatus: value('paymentStatus') as
                      | 'PENDING'
                      | 'COLLECTED'
                      | 'OVERDUE',
                    status: 'POSTED',
                  },
                });
              else if (form === 'expense') {
                const clientId = value('clientId');
                const serviceId = value('serviceId');
                const grossAmount = amount('amount');
                ok = run({
                  type: 'addExpense',
                  entry: {
                    id: makeId('expense'),
                    date: value('date'),
                    supplier: value('supplier'),
                    category: value('category'),
                    description: value('description'),
                    type: value('expenseType') as
                      | 'FIXED'
                      | 'VARIABLE'
                      | 'MIXED',
                    grossAmount,
                    paid: value('paid') === 'true',
                    status: 'POSTED',
                    allocations:
                      clientId || serviceId
                        ? [
                            {
                              clientId: clientId || undefined,
                              serviceId: serviceId || undefined,
                              amount: grossAmount,
                              basis: 'DIRECT',
                            },
                          ]
                        : [],
                  },
                });
              } else if (form === 'client') {
                createdRelatedId = makeId('client');
                ok = run({
                  type: 'addClient',
                  client: {
                    id: createdRelatedId,
                    name: value('name'),
                    segment: value('segment') || 'General',
                    status: 'ACTIVE',
                    owner: value('owner') || 'Sin asignar',
                    startedOn: value('date'),
                  },
                });
              } else if (form === 'service') {
                createdRelatedId = makeId('service');
                ok = run({
                  type: 'addService',
                  service: {
                    id: createdRelatedId,
                    name: value('name'),
                    category: value('category') || 'General',
                    status: 'ACTIVE',
                    listPrice: amount('amount'),
                    capacityMonth: amount('capacity'),
                  },
                });
              } else if (form === 'team') {
                const memberId = editingMember?.id || makeId('team');
                ok = run({
                  type: 'saveTeamMember',
                  effectiveOn: value('effectiveOn') || todayKey(),
                  member: {
                    id: memberId,
                    name: value('name'),
                    email: value('email'),
                    status: editingMember?.status || 'ACTIVE',
                    monthlyCost: amount('monthlyCost'),
                    modality: value('modality') as
                      | 'PAYROLL'
                      | 'CONTRACTOR'
                      | 'FREELANCE',
                    supervisor: value('supervisor') || 'Sin supervisor',
                    positionId: value('positionId') || undefined,
                    startedOn:
                      value('startedOn') || editingMember?.startedOn || todayKey(),
                    endedOn: editingMember?.endedOn,
                    terminationReason: editingMember?.terminationReason,
                  },
                });
              } else if (form === 'teamEnd' && editingMember) {
                ok = run({
                  type: 'endTeamMember',
                  teamMemberId: editingMember.id,
                  endedOn: value('endedOn'),
                  reason: value('reason'),
                });
              } else if (form === 'position') {
                ok = run({
                  type: 'savePosition',
                  position: {
                    id: editingPosition?.id || makeId('position'),
                    name: value('name'),
                    area: value('area') || 'General',
                    purpose: value('purpose'),
                    functions: value('functions')
                      .split('\n')
                      .map((item) => item.trim())
                      .filter(Boolean),
                    kpis: value('kpis')
                      .split('\n')
                      .map((item) => item.trim())
                      .filter(Boolean),
                    backup: value('backup') || 'Sin reemplazo',
                    status: editingPosition?.status || 'ACTIVE',
                    profileFileName:
                      positionFile?.name || editingPosition?.profileFileName,
                    profileFileData:
                      positionFile?.data || editingPosition?.profileFileData,
                    updatedAt: new Date().toISOString(),
                  },
                });
              } else if (form === 'task') {
                const assigneeMemberId = value('assigneeMemberId');
                const positionId = value('positionId');
                const member = state.team.find(
                  (item) => item.id === assigneeMemberId,
                );
                const position = state.positions.find(
                  (item) => item.id === positionId,
                );
                const date = value('date');
                const time = value('time') || '09:00';
                ok = run({
                  type: 'addTask',
                  task: {
                    id: makeId('task'),
                    title: value('title'),
                    description: value('description'),
                    owner: member?.name || position?.name || 'Sin asignar',
                    dueOn: date,
                    startsAt: `${date}T${time}:00-05:00`,
                    dueAt: `${date}T${time}:00-05:00`,
                    alertMinutes: amount('alertMinutes'),
                    assigneeMemberId: assigneeMemberId || undefined,
                    positionId: positionId || member?.positionId || undefined,
                    clientId: value('clientId') || undefined,
                    category: value('category') as
                      | 'VISIT'
                      | 'OPERATIONS'
                      | 'RECORDING'
                      | 'SALES'
                      | 'ADMIN'
                      | 'OTHER',
                    priority: value('priority') as
                      | 'LOW'
                      | 'NORMAL'
                      | 'HIGH'
                      | 'URGENT',
                    status: 'TODO',
                    source: 'COMPANY',
                  },
                });
              } else if (form === 'calendar') {
                const assigneeMemberId = value('assigneeMemberId');
                const positionId = value('positionId');
                const member = state.team.find(
                  (item) => item.id === assigneeMemberId,
                );
                const position = state.positions.find(
                  (item) => item.id === positionId,
                );
                const date = value('date');
                const startTime = value('startTime') || '09:00';
                const endTime = value('endTime');
                ok = run({
                  type: 'addCalendarEvent',
                  event: {
                    id: makeId('calendar'),
                    title: value('title'),
                    description: value('description'),
                    startsAt: `${date}T${startTime}:00-05:00`,
                    endsAt: endTime
                      ? `${date}T${endTime}:00-05:00`
                      : undefined,
                    type: value('eventType') as
                      | 'MEETING'
                      | 'COLLECTION'
                      | 'DEADLINE'
                      | 'VISIT'
                      | 'OPERATION'
                      | 'RECORDING'
                      | 'OTHER',
                    owner: member?.name || position?.name || 'Sin asignar',
                    location: value('location'),
                    alertMinutes: amount('alertMinutes'),
                    assigneeMemberId: assigneeMemberId || undefined,
                    positionId: positionId || member?.positionId || undefined,
                    clientId: value('clientId') || undefined,
                    status: 'SCHEDULED',
                  },
                });
              }
              if (!ok) return;
              if (
                createdRelatedId &&
                returnForm &&
                (form === 'client' || form === 'service')
              ) {
                const relationKey =
                  form === 'client' ? 'clientId' : 'serviceId';
                setFormDrafts((current) => ({
                  ...current,
                  [returnForm]: {
                    ...current[returnForm],
                    [relationKey]: createdRelatedId,
                  },
                }));
                setForm(returnForm);
                setReturnForm(null);
                return;
              }
              setFormDrafts((current) => {
                const next = { ...current };
                if (form) delete next[form];
                return next;
              });
              closeForm();
            }}
          >
            {(form === 'income' || form === 'expense') && (
              <label htmlFor="business-date">
                <span>{form === 'income' ? '¿Cuándo recibiste este ingreso?' : '¿Cuándo hiciste este gasto?'}</span>
                <Input
                  id="business-date"
                  type="date"
                  name="date"
                  defaultValue={draftValue('date', '2026-09-05')}
                  required
                />
                <small className="business-field-help">
                  Usa la fecha que aparece en el pago, comprobante o movimiento bancario.
                </small>
              </label>
            )}
            {form === 'income' && (
              <>
                <div className="business-field">
                  <label htmlFor="business-client">
                    <span>¿Qué cliente te pagó?</span>
                    <select
                      id="business-client"
                      name="clientId"
                      defaultValue={draftValue('clientId')}
                      required
                    >
                      <option value="" disabled>
                        Elige un cliente
                      </option>
                      {state.clients
                        .filter((item) => item.status === 'ACTIVE')
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <small className="business-field-help">
                    Selecciona la persona o empresa que compró.
                  </small>
                  <button
                    className="business-inline-create"
                    type="button"
                    onClick={(event) =>
                      openRelatedForm('client', 'income', event.currentTarget.form)
                    }
                  >
                    <Plus /> No aparece: añadir cliente
                  </button>
                </div>
                <div className="business-field">
                  <label htmlFor="business-service">
                    <span>¿Qué le vendiste?</span>
                    <select
                      id="business-service"
                      name="serviceId"
                      defaultValue={draftValue('serviceId')}
                      required
                    >
                      <option value="" disabled>
                        Elige un servicio o producto
                      </option>
                      {state.services
                        .filter((item) => item.status === 'ACTIVE')
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <small className="business-field-help">
                    Elige el servicio o producto por el que recibiste el dinero.
                  </small>
                  <button
                    className="business-inline-create"
                    type="button"
                    onClick={(event) =>
                      openRelatedForm('service', 'income', event.currentTarget.form)
                    }
                  >
                    <Plus /> No aparece: añadir servicio
                  </button>
                </div>
                <label htmlFor="business-description">
                  <span>¿Por qué recibiste este dinero?</span>
                  <Input
                    id="business-description"
                    name="description"
                    defaultValue={draftValue('description')}
                    placeholder="Ej. Pago mensual de asesoría"
                    required
                  />
                  <small className="business-field-help">
                    Escribe una frase corta que luego puedas reconocer.
                  </small>
                </label>
                <label htmlFor="business-amount">
                  <span>¿Cuánto ganó tu negocio antes de impuestos?</span>
                  <Input
                    id="business-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    name="amount"
                    defaultValue={draftValue('amount')}
                    placeholder="0.00"
                    required
                  />
                  <small className="business-field-help">
                    Escribe el valor de la venta sin IGV u otros impuestos.
                  </small>
                </label>
                <label htmlFor="business-payment-status">
                  <span>¿Ya recibiste el pago?</span>
                  <select
                    id="business-payment-status"
                    name="paymentStatus"
                    defaultValue={draftValue('paymentStatus', 'COLLECTED')}
                  >
                    <option value="COLLECTED">Sí, ya cobré</option>
                    <option value="PENDING">Todavía no me pagan</option>
                    <option value="OVERDUE">El pago ya está atrasado</option>
                  </select>
                  <small className="business-field-help">
                    Esto te ayuda a separar lo vendido de lo realmente cobrado.
                  </small>
                </label>
              </>
            )}
            {form === 'expense' && (
              <>
                <label htmlFor="business-supplier">
                  <span>¿A quién le pagaste?</span>
                  <Input
                    id="business-supplier"
                    name="supplier"
                    defaultValue={draftValue('supplier')}
                    placeholder="Ej. Google, contador o proveedor local"
                    required
                  />
                  <small className="business-field-help">
                    Escribe el nombre de la empresa o persona que recibió el pago.
                  </small>
                </label>
                <label htmlFor="business-expense-description">
                  <span>¿En qué gastaste?</span>
                  <Input
                    id="business-expense-description"
                    name="description"
                    defaultValue={draftValue('description')}
                    placeholder="Ej. Publicidad de septiembre"
                    required
                  />
                  <small className="business-field-help">
                    Describe brevemente qué compraste o pagaste.
                  </small>
                </label>
                <label htmlFor="business-category">
                  <span>¿Qué clase de gasto fue?</span>
                  <Input
                    id="business-category"
                    name="category"
                    defaultValue={draftValue('category')}
                    placeholder="Ej. Publicidad, software, oficina o personal"
                    required
                  />
                  <small className="business-field-help">
                    Agrupar gastos parecidos te permite ver en qué se va el dinero.
                  </small>
                </label>
                <label htmlFor="business-expense-type">
                  <span>¿Este gasto se repite?</span>
                  <select
                    id="business-expense-type"
                    name="expenseType"
                    defaultValue={draftValue('expenseType', 'VARIABLE')}
                  >
                    <option value="VARIABLE">Cambia según el uso o las ventas</option>
                    <option value="FIXED">Se repite por un monto parecido</option>
                    <option value="MIXED">Tiene una parte fija y otra variable</option>
                  </select>
                  <small className="business-field-help">
                    Ejemplo: alquiler es fijo; comisiones por venta son variables.
                  </small>
                </label>
                <label htmlFor="business-expense-amount">
                  <span>¿Cuánto pagaste en total?</span>
                  <Input
                    id="business-expense-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    name="amount"
                    defaultValue={draftValue('amount')}
                    placeholder="0.00"
                    required
                  />
                  <small className="business-field-help">
                    Usa el total que salió o saldrá de tu negocio.
                  </small>
                </label>
                <div className="business-field">
                  <label htmlFor="business-expense-client">
                    <span>¿Este gasto fue para atender a un cliente?</span>
                    <select
                      id="business-expense-client"
                      name="clientId"
                      defaultValue={draftValue('clientId')}
                    >
                      <option value="">No, fue para todo el negocio</option>
                      {state.clients.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <small className="business-field-help">
                    Elige un cliente solo si el gasto se hizo específicamente por él.
                  </small>
                  <button
                    className="business-inline-create"
                    type="button"
                    onClick={(event) =>
                      openRelatedForm('client', 'expense', event.currentTarget.form)
                    }
                  >
                    <Plus /> No aparece: añadir cliente
                  </button>
                </div>
                <div className="business-field">
                  <label htmlFor="business-expense-service">
                    <span>¿Este gasto pertenece a un servicio?</span>
                    <select
                      id="business-expense-service"
                      name="serviceId"
                      defaultValue={draftValue('serviceId')}
                    >
                      <option value="">No, es un gasto general</option>
                      {state.services.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <small className="business-field-help">
                    Esto ayuda a saber cuánto cuesta entregar cada servicio.
                  </small>
                  <button
                    className="business-inline-create"
                    type="button"
                    onClick={(event) =>
                      openRelatedForm('service', 'expense', event.currentTarget.form)
                    }
                  >
                    <Plus /> No aparece: añadir servicio
                  </button>
                </div>
                <label htmlFor="business-paid">
                  <span>¿Ya salió el dinero?</span>
                  <select
                    id="business-paid"
                    name="paid"
                    defaultValue={draftValue('paid', 'true')}
                  >
                    <option value="true">Sí, ya pagué</option>
                    <option value="false">Todavía está pendiente</option>
                  </select>
                  <small className="business-field-help">
                    Marca pendiente si sabes del gasto pero aún no lo pagaste.
                  </small>
                </label>
              </>
            )}
            {form === 'client' && (
              <>
                <label htmlFor="business-client-name">
                  <span>¿Cómo se llama tu cliente?</span>
                  <Input
                    id="business-client-name"
                    name="name"
                    placeholder="Persona o empresa"
                    required
                  />
                  <small className="business-field-help">
                    Usa el nombre con el que lo reconoces en tu negocio.
                  </small>
                </label>
                <label htmlFor="business-client-segment">
                  <span>¿Qué tipo de cliente es? (opcional)</span>
                  <Input
                    id="business-client-segment"
                    name="segment"
                    placeholder="Ej. Empresa, emprendedor o cliente frecuente"
                  />
                  <small className="business-field-help">
                    Sirve para juntar clientes parecidos. Si no estás seguro, déjalo vacío.
                  </small>
                </label>
                <label htmlFor="business-client-owner">
                  <span>¿Quién atiende a este cliente? (opcional)</span>
                  <Input
                    id="business-client-owner"
                    name="owner"
                    placeholder="Nombre de la persona de tu equipo"
                  />
                  <small className="business-field-help">
                    Es la persona que hará seguimiento y responderá al cliente.
                  </small>
                </label>
                <label htmlFor="business-client-date">
                  <span>¿Desde cuándo trabajas con este cliente?</span>
                  <Input
                    id="business-client-date"
                    type="date"
                    name="date"
                    defaultValue="2026-09-05"
                    required
                  />
                  <small className="business-field-help">
                    Si es nuevo, usa la fecha de hoy o la fecha del primer acuerdo.
                  </small>
                </label>
              </>
            )}
            {form === 'service' && (
              <>
                <label htmlFor="business-service-name">
                  <span>¿Cómo se llama lo que vendes?</span>
                  <Input
                    id="business-service-name"
                    name="name"
                    placeholder="Ej. Asesoría mensual o diseño de página web"
                    required
                  />
                  <small className="business-field-help">
                    Puede ser un servicio, producto o paquete.
                  </small>
                </label>
                <label htmlFor="business-service-category">
                  <span>¿Qué tipo de servicio o producto es? (opcional)</span>
                  <Input
                    id="business-service-category"
                    name="category"
                    placeholder="Ej. Consultoría, diseño, formación o producto"
                  />
                  <small className="business-field-help">
                    Sirve para agrupar lo que vendes. Puedes dejarlo vacío.
                  </small>
                </label>
                <label htmlFor="business-service-price">
                  <span>¿Cuánto cobras normalmente?</span>
                  <Input
                    id="business-service-price"
                    type="number"
                    min="0"
                    step="0.01"
                    name="amount"
                    placeholder="0.00"
                    required
                  />
                  <small className="business-field-help">
                    Coloca tu precio habitual antes de descuentos.
                  </small>
                </label>
                <label htmlFor="business-service-capacity">
                  <span>¿Cuántos puedes vender o atender al mes?</span>
                  <Input
                    id="business-service-capacity"
                    type="number"
                    min="0"
                    step="1"
                    name="capacity"
                    placeholder="Ej. 8"
                    required
                  />
                  <small className="business-field-help">
                    Piensa en un mes normal y escribe una cantidad realista.
                  </small>
                </label>
              </>
            )}
            {form === 'team' && (
              <>
                <label htmlFor="business-team-name">
                  <span>Nombre completo</span>
                  <Input id="business-team-name" name="name" defaultValue={editingMember?.name} required />
                </label>
                <label htmlFor="business-team-email">
                  <span>Correo de trabajo (opcional)</span>
                  <Input id="business-team-email" type="email" name="email" defaultValue={editingMember?.email} />
                </label>
                <label htmlFor="business-team-position">
                  <span>¿Qué puesto ocupa?</span>
                  <select id="business-team-position" name="positionId" defaultValue={editingMember?.positionId || ''}>
                    <option value="">Sin puesto asignado</option>
                    {state.positions.filter((item) => item.status !== 'ARCHIVED').map((position) => (
                      <option value={position.id} key={position.id}>{position.name}</option>
                    ))}
                  </select>
                  <small className="business-field-help">El puesto conecta sus tareas y KPIs con los reportes.</small>
                </label>
                <label htmlFor="business-team-modality">
                  <span>¿Cómo trabaja con la empresa?</span>
                  <select id="business-team-modality" name="modality" defaultValue={editingMember?.modality || 'PAYROLL'}>
                    <option value="PAYROLL">En planilla</option>
                    <option value="CONTRACTOR">Contrato de servicios</option>
                    <option value="FREELANCE">Trabajo independiente</option>
                  </select>
                </label>
                <label htmlFor="business-team-supervisor">
                  <span>¿Quién supervisa su trabajo?</span>
                  <Input id="business-team-supervisor" name="supervisor" defaultValue={editingMember?.supervisor} placeholder="Ej. Dirección o Andrea Pérez" />
                </label>
                <label htmlFor="business-team-cost">
                  <span>¿Cuánto le cuesta al negocio por mes?</span>
                  <Input id="business-team-cost" type="number" min="0" step="0.01" name="monthlyCost" defaultValue={editingMember?.monthlyCost} required />
                  <small className="business-field-help">Si cambia, se abrirá un nuevo periodo y el costo anterior quedará guardado.</small>
                </label>
                <label htmlFor="business-team-effective">
                  <span>¿Desde cuándo aplica este costo?</span>
                  <Input id="business-team-effective" type="date" name="effectiveOn" defaultValue={todayKey()} required />
                </label>
                <label htmlFor="business-team-started">
                  <span>¿Cuándo empezó a trabajar?</span>
                  <Input id="business-team-started" type="date" name="startedOn" defaultValue={editingMember?.startedOn || todayKey()} required />
                </label>
              </>
            )}
            {form === 'teamEnd' && editingMember && (
              <>
                <div className="business-dialog-warning">
                  <UserMinus />
                  <span><strong>{editingMember.name}</strong><small>El registro no se elimina y seguirá apareciendo en históricos y reportes.</small></span>
                </div>
                <label htmlFor="business-team-ended">
                  <span>Último día de trabajo</span>
                  <Input id="business-team-ended" type="date" name="endedOn" defaultValue={todayKey()} required />
                </label>
                <label htmlFor="business-team-reason">
                  <span>Motivo del cese</span>
                  <textarea id="business-team-reason" name="reason" rows={3} placeholder="Ej. Renuncia voluntaria o término de contrato" required />
                </label>
              </>
            )}
            {form === 'position' && (
              <>
                <label htmlFor="business-position-name">
                  <span>Nombre del puesto</span>
                  <Input id="business-position-name" name="name" defaultValue={editingPosition?.name} placeholder="Ej. Responsable de Operaciones" required />
                </label>
                <label htmlFor="business-position-area">
                  <span>Área</span>
                  <Input id="business-position-area" name="area" defaultValue={editingPosition?.area} placeholder="Ej. Operaciones, Ventas o Administración" />
                </label>
                <label htmlFor="business-position-purpose">
                  <span>¿Qué resultado debe lograr este puesto?</span>
                  <textarea id="business-position-purpose" name="purpose" rows={3} defaultValue={editingPosition?.purpose} placeholder="Describe el resultado principal, no solo actividades." required />
                </label>
                <label htmlFor="business-position-functions">
                  <span>Funciones principales</span>
                  <textarea id="business-position-functions" name="functions" rows={4} defaultValue={editingPosition?.functions.join('\n')} placeholder={'Una función por línea\nEj. Revisar entregas\nResolver bloqueos'} />
                </label>
                <label htmlFor="business-position-kpis">
                  <span>KPIs del puesto</span>
                  <textarea id="business-position-kpis" name="kpis" rows={4} defaultValue={editingPosition?.kpis.join('\n')} placeholder={'Un indicador por línea\nEj. Entregas a tiempo\nRetrabajos'} />
                  <small className="business-field-help">Estos indicadores aparecerán en Reportes junto con las tareas vinculadas.</small>
                </label>
                <label htmlFor="business-position-backup">
                  <span>¿Quién cubre este puesto si falta?</span>
                  <Input id="business-position-backup" name="backup" defaultValue={editingPosition?.backup} placeholder="Ej. Dirección" />
                </label>
                <label htmlFor="business-position-file" className="business-file-field">
                  <span>Adjuntar perfil existente (opcional)</span>
                  <input id="business-position-file" type="file" accept=".pdf,.doc,.docx,.txt" onChange={(event) => readPositionFile(event.target.files?.[0])} />
                  <small>{positionFile?.name || editingPosition?.profileFileName || 'PDF, Word o texto; máximo 1.5 MB.'}</small>
                </label>
              </>
            )}
            {form === 'task' && (
              <>
                <label htmlFor="business-task-title"><span>¿Qué se debe hacer?</span><Input id="business-task-title" name="title" placeholder="Ej. Visitar al cliente o grabar contenido" required /></label>
                <label htmlFor="business-task-description"><span>Indicaciones (opcional)</span><textarea id="business-task-description" name="description" rows={3} placeholder="Agrega dirección, resultado esperado o información útil." /></label>
                <div className="business-form-columns">
                  <label htmlFor="business-task-date"><span>Fecha</span><Input id="business-task-date" type="date" name="date" defaultValue={agendaDate} required /></label>
                  <label htmlFor="business-task-time"><span>Hora</span><Input id="business-task-time" type="time" name="time" defaultValue="09:00" required /></label>
                </div>
                <label htmlFor="business-task-category"><span>Tipo de tarea</span><select id="business-task-category" name="category" defaultValue="OPERATIONS"><option value="VISIT">Visita de cliente</option><option value="OPERATIONS">Operación</option><option value="RECORDING">Grabación</option><option value="SALES">Venta o seguimiento</option><option value="ADMIN">Administración</option><option value="OTHER">Otra</option></select></label>
                <label htmlFor="business-task-member"><span>Asignar a una persona (opcional)</span><select id="business-task-member" name="assigneeMemberId" defaultValue=""><option value="">Sin persona específica</option>{state.team.filter((member) => member.status === 'ACTIVE').map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
                <label htmlFor="business-task-position"><span>Asignar a un puesto (opcional)</span><select id="business-task-position" name="positionId" defaultValue=""><option value="">Sin puesto específico</option>{state.positions.filter((position) => position.status !== 'ARCHIVED').map((position) => <option key={position.id} value={position.id}>{position.name}</option>)}</select></label>
                <label htmlFor="business-task-client"><span>Cliente relacionado (opcional)</span><select id="business-task-client" name="clientId" defaultValue=""><option value="">No corresponde a un cliente</option>{state.clients.filter((client) => client.status === 'ACTIVE').map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
                <div className="business-form-columns">
                  <label htmlFor="business-task-priority"><span>Prioridad</span><select id="business-task-priority" name="priority" defaultValue="NORMAL"><option value="LOW">Baja</option><option value="NORMAL">Normal</option><option value="HIGH">Alta</option><option value="URGENT">Urgente</option></select></label>
                  <label htmlFor="business-task-alert"><span>Alerta</span><select id="business-task-alert" name="alertMinutes" defaultValue="30"><option value="0">Sin alerta</option><option value="10">10 minutos antes</option><option value="30">30 minutos antes</option><option value="60">1 hora antes</option><option value="1440">1 día antes</option></select></label>
                </div>
              </>
            )}
            {form === 'calendar' && (
              <>
                <label htmlFor="business-event-title"><span>Nombre del evento</span><Input id="business-event-title" name="title" placeholder="Ej. Visita a cliente o reunión de operaciones" required /></label>
                <label htmlFor="business-event-description"><span>Detalles (opcional)</span><textarea id="business-event-description" name="description" rows={3} placeholder="Objetivo, materiales o acuerdos por revisar." /></label>
                <label htmlFor="business-event-date"><span>Fecha</span><Input id="business-event-date" type="date" name="date" defaultValue={agendaDate} required /></label>
                <div className="business-form-columns">
                  <label htmlFor="business-event-start"><span>Empieza</span><Input id="business-event-start" type="time" name="startTime" defaultValue="09:00" required /></label>
                  <label htmlFor="business-event-end"><span>Termina (opcional)</span><Input id="business-event-end" type="time" name="endTime" /></label>
                </div>
                <label htmlFor="business-event-type"><span>Tipo de actividad</span><select id="business-event-type" name="eventType" defaultValue="MEETING"><option value="MEETING">Reunión</option><option value="VISIT">Visita de cliente</option><option value="OPERATION">Operación</option><option value="RECORDING">Grabación</option><option value="COLLECTION">Cobranza</option><option value="DEADLINE">Fecha límite</option><option value="OTHER">Otra</option></select></label>
                <label htmlFor="business-event-location"><span>Lugar o enlace (opcional)</span><Input id="business-event-location" name="location" placeholder="Dirección, sala o enlace de videollamada" /></label>
                <label htmlFor="business-event-member"><span>Responsable (opcional)</span><select id="business-event-member" name="assigneeMemberId" defaultValue=""><option value="">Sin persona específica</option>{state.team.filter((member) => member.status === 'ACTIVE').map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
                <label htmlFor="business-event-position"><span>Puesto responsable (opcional)</span><select id="business-event-position" name="positionId" defaultValue=""><option value="">Sin puesto específico</option>{state.positions.filter((position) => position.status !== 'ARCHIVED').map((position) => <option key={position.id} value={position.id}>{position.name}</option>)}</select></label>
                <label htmlFor="business-event-client"><span>Cliente relacionado (opcional)</span><select id="business-event-client" name="clientId" defaultValue=""><option value="">No corresponde a un cliente</option>{state.clients.filter((client) => client.status === 'ACTIVE').map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
                <label htmlFor="business-event-alert"><span>Recordatorio</span><select id="business-event-alert" name="alertMinutes" defaultValue="30"><option value="0">Sin recordatorio</option><option value="10">10 minutos antes</option><option value="30">30 minutos antes</option><option value="60">1 hora antes</option><option value="1440">1 día antes</option></select></label>
              </>
            )}
            <div className="business-dialog-actions">
              <Button
                type="button"
                variant="outline"
                onClick={cancelCurrentForm}
              >
                {returnForm && (form === 'client' || form === 'service')
                  ? 'Volver'
                  : 'Cancelar'}
              </Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {notice && (
        <output className="business-toast">
          <CheckCircle2 />
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice('')}
            aria-label="Cerrar aviso"
          >
            <X />
          </button>
        </output>
      )}
    </div>
  );
}
