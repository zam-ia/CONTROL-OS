'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  FileText,
  FolderCog,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  Settings,
  Target,
  Upload,
  Users,
  WalletCards,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  objectiveProgress,
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
  | 'work'
  | 'processes'
  | 'reports'
  | 'import'
  | 'settings';
type FormKind = 'income' | 'expense' | 'client' | 'service' | null;

const navigation = [
  { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
  { id: 'finance', label: 'Finanzas', icon: WalletCards },
  { id: 'clients', label: 'Clientes', icon: Users },
  { id: 'services', label: 'Servicios', icon: BriefcaseBusiness },
  { id: 'work', label: 'Objetivos y tareas', icon: Target },
  { id: 'processes', label: 'Procesos y SOP', icon: FolderCog },
  { id: 'reports', label: 'Reportes', icon: FileText },
  { id: 'import', label: 'Importar', icon: Upload },
  { id: 'settings', label: 'Configuración', icon: Settings },
] as const;

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
  tone = 'neutral',
}: {
  label: string;
  value: string;
  detail: string;
  tone?: 'positive' | 'warning' | 'neutral';
}) {
  return (
    <article className={`business-metric metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

export default function BusinessPage() {
  const [state, setState] = useState<BusinessState | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [view, setView] = useState<View>('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [form, setForm] = useState<FormKind>(null);
  const [notice, setNotice] = useState('');
  const [importFile, setImportFile] = useState('');

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const hasSession =
        sessionStorage.getItem('control-os-session') === 'true';
      setAuthorized(hasSession);
      setCollapsed(
        localStorage.getItem('control-business-sidebar-collapsed') === 'true',
      );
      let initial = businessSeed();
      const requestedOrganization =
        new URLSearchParams(window.location.search).get('org') || 'norte';
      const saved = localStorage.getItem(STORAGE);
      if (saved) {
        try {
          const candidate = JSON.parse(saved) as BusinessState;
          if (
            candidate.schema === 2 &&
            candidate.workspace &&
            Array.isArray(candidate.incomes)
          )
            initial = candidate;
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
        initial.workspace.name =
          organizationNames[requestedOrganization] || 'Mi empresa';
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

  if (!sessionReady || !state || !metrics)
    return (
      <output className="business-loading">
        Preparando CONTROL Business OS…
      </output>
    );

  if (!authorized)
    return (
      <main className="business-access">
        <Image
          src="/crisdal-agency.png"
          alt="Crisdal Agency"
          width={116}
          height={116}
          priority
        />
        <p className="business-kicker">CONTROL BUSINESS OS</p>
        <h1>Inicia sesión desde CONTROL OS</h1>
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
            tone="positive"
          />
          <MetricCard
            label="Utilidad operativa"
            value={money(metrics.operatingProfit)}
            detail={`${metrics.operatingMargin}% de margen`}
            tone={metrics.operatingMargin >= 25 ? 'positive' : 'warning'}
          />
          <MetricCard
            label="Gastos"
            value={money(metrics.expenses)}
            detail={`${money(metrics.variableExpenses)} variables`}
          />
          <MetricCard
            label="Caja del período"
            value={money(metrics.cashMovement)}
            detail={`${metrics.activeClients} clientes activos`}
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
                <p className="business-kicker">CONTROL BOARD</p>
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
                <h3>Contribución directa</h3>
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
                    <small>{money(client.contribution)} contribución</small>
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
            tone="positive"
          />
          <MetricCard
            label="Gastos"
            value={money(metrics.expenses)}
            detail={`${state.expenses.filter((item) => item.status === 'POSTED').length} movimientos`}
          />
          <MetricCard
            label="Pendiente de cobro"
            value={money(metrics.revenue - metrics.collected)}
            detail="Seguimiento requerido"
            tone="warning"
          />
          <MetricCard
            label="Margen operativo"
            value={`${metrics.operatingMargin}%`}
            detail={money(metrics.operatingProfit)}
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
                      <td>{shortDate(entry.date)}</td>
                      <td>
                        <strong>{entry.description}</strong>
                        <small>
                          {entry.kind === 'income' ? 'Ingreso' : 'Gasto'}
                        </small>
                      </td>
                      <td>{entry.entity}</td>
                      <td>
                        <Status value={entry.status} />
                      </td>
                      <td
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
            <p className="business-kicker">CLIENTE 360</p>
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
                <th className="numeric">Contribución</th>
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
                    <td>
                      <strong>{row.name}</strong>
                      <small>
                        {client.segment} · {client.owner}
                      </small>
                    </td>
                    <td>
                      <Status value={client.status} />
                    </td>
                    <td className="numeric">{money(row.revenue)}</td>
                    <td className="numeric">{money(row.directCost)}</td>
                    <td className="numeric">{money(row.contribution)}</td>
                    <td
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
          El margen mostrado es contribución directa: ingresos menos
          imputaciones del cliente. Los gastos generales permanecen en el
          P&amp;L.
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
                    <dt>Contribución</dt>
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
  else if (view === 'work')
    content = (
      <div className="business-grid work-grid">
        <section className="business-card business-wide">
          <div className="business-card-head">
            <div>
              <p className="business-kicker">RESULTADOS</p>
              <h3>Objetivos por checkpoints</h3>
            </div>
            <Target />
          </div>
          <div className="objective-grid">
            {state.objectives.map((objective) => {
              const completion = objectiveProgress(objective);
              return (
                <article key={objective.id}>
                  <div className="objective-head">
                    <span>
                      <Status value={objective.status} />
                      <small>Vence {shortDate(objective.dueOn)}</small>
                    </span>
                    <strong>{completion}%</strong>
                  </div>
                  <h4>{objective.title}</h4>
                  <p>Responsable: {objective.owner}</p>
                  <div className="objective-progress">
                    <i style={{ width: `${completion}%` }} />
                  </div>
                  <div className="checkpoint-list">
                    {objective.checkpoints.map((checkpoint) => (
                      <label key={checkpoint.id}>
                        <input
                          type="checkbox"
                          checked={checkpoint.completed}
                          onChange={() =>
                            run({
                              type: 'toggleObjectiveCheckpoint',
                              objectiveId: objective.id,
                              checkpointId: checkpoint.id,
                            })
                          }
                        />
                        <span>
                          <Check />
                          {checkpoint.title}
                        </span>
                      </label>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
          <p className="business-note">
            El avance se calcula solo con checkpoints completados; no existe
            edición manual de porcentajes.
          </p>
        </section>
        <section className="business-card">
          <div className="business-card-head">
            <div>
              <p className="business-kicker">ESTA SEMANA</p>
              <h3>Tareas operativas</h3>
            </div>
            <ClipboardCheck />
          </div>
          <div className="business-task-list">
            {state.tasks.map((task) => (
              <label key={task.id}>
                <input
                  type="checkbox"
                  checked={task.status === 'DONE'}
                  onChange={() => run({ type: 'toggleTask', taskId: task.id })}
                />
                <span>
                  <strong>{task.title}</strong>
                  <small>
                    {task.owner} · {shortDate(task.dueOn)} ·{' '}
                    {task.source.replace('_', ' ')}
                  </small>
                </span>
                <Status value={task.status} />
              </label>
            ))}
          </div>
        </section>
      </div>
    );
  else if (view === 'processes')
    content = (
      <section className="business-card">
        <div className="business-card-head">
          <div>
            <p className="business-kicker">SISTEMA OPERATIVO</p>
            <h3>Procesos, SOP y SLA</h3>
          </div>
          <FolderCog />
        </div>
        <div className="process-grid">
          {state.processes.map((process) => (
            <article key={process.id}>
              <div>
                <Status value={process.status} />
                <span>SOP v{process.sopVersion}</span>
              </div>
              <h4>{process.name}</h4>
              <p>
                <b>Owner</b>
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
                  <b>SLA</b>
                  {process.sla}
                </span>
                <span>
                  <b>KPI</b>
                  {process.kpi}
                </span>
              </footer>
            </article>
          ))}
        </div>
        <p className="business-note">
          Una versión publicada no se sobrescribe. Cada cambio genera una nueva
          versión del SOP y conserva el histórico.
        </p>
      </section>
    );
  else if (view === 'reports')
    content = (
      <div className="report-grid">
        <section className="business-card">
          <FileSpreadsheet />
          <h3>Libro financiero</h3>
          <p>Ingresos, gastos y P&amp;L del workspace actual.</p>
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
          <h3>Respaldo del workspace</h3>
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
          <p>Resumen mensual con KPIs, alertas y acciones prioritarias.</p>
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
              Identidad y organización compartidas con CONTROL OS
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
              <strong>CONTROL OS ↔ Mi Empresa</strong>
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
      <aside className="business-sidebar" id="business-navigation">
        <div className="business-brand">
          <Link href="/" aria-label="Volver a CONTROL OS">
            <Image src="/crisdal-agency.png" alt="" width={76} height={76} />
            <span>
              CONTROL <b>Business OS</b>
            </span>
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
          {navigation.map(({ id, label, icon: Icon }) => (
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
        <Link
          className="back-to-control"
          href={`/?return_from=business&org=${encodeURIComponent(state.workspace.organizationId)}`}
        >
          <ArrowLeft />
          <span>Volver a CONTROL OS</span>
        </Link>
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
              title="Sesión compartida con CONTROL OS"
            >
              AC
            </button>
          </div>
        </header>
        <div className="business-content">
          <div className="business-heading">
            <div>
              <p className="business-kicker">CONTROL BUSINESS OS</p>
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
            <span>CONTROL Business OS</span>
            <span>America/Lima · PEN · {state.workspace.name}</span>
          </footer>
        </div>
      </main>
      <Dialog
        open={form !== null}
        onOpenChange={(open) => {
          if (!open) setForm(null);
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
                  : 'Crear servicio'}
          </DialogTitle>
          <DialogDescription>
            La información quedará vinculada al workspace y a su organización.
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
              } else if (form === 'client')
                ok = run({
                  type: 'addClient',
                  client: {
                    id: makeId('client'),
                    name: value('name'),
                    segment: value('segment') || 'General',
                    status: 'ACTIVE',
                    owner: value('owner') || 'Sin asignar',
                    startedOn: value('date'),
                  },
                });
              else if (form === 'service')
                ok = run({
                  type: 'addService',
                  service: {
                    id: makeId('service'),
                    name: value('name'),
                    category: value('category') || 'General',
                    status: 'ACTIVE',
                    listPrice: amount('amount'),
                    capacityMonth: amount('capacity'),
                  },
                });
              if (ok) setForm(null);
            }}
          >
            {(form === 'income' || form === 'expense') && (
              <label htmlFor="business-date">
                <span>Fecha</span>
                <Input
                  id="business-date"
                  type="date"
                  name="date"
                  defaultValue="2026-09-05"
                  required
                />
              </label>
            )}
            {form === 'income' && (
              <>
                <label htmlFor="business-client">
                  <span>Cliente</span>
                  <select id="business-client" name="clientId" required>
                    {state.clients
                      .filter((item) => item.status === 'ACTIVE')
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                  </select>
                </label>
                <label htmlFor="business-service">
                  <span>Servicio</span>
                  <select id="business-service" name="serviceId" required>
                    {state.services
                      .filter((item) => item.status === 'ACTIVE')
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                  </select>
                </label>
                <label htmlFor="business-description">
                  <span>Concepto</span>
                  <Input
                    id="business-description"
                    name="description"
                    required
                  />
                </label>
                <label htmlFor="business-amount">
                  <span>Monto neto</span>
                  <Input
                    id="business-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    name="amount"
                    required
                  />
                </label>
                <label htmlFor="business-payment-status">
                  <span>Estado de cobro</span>
                  <select id="business-payment-status" name="paymentStatus">
                    <option value="COLLECTED">Cobrado</option>
                    <option value="PENDING">Pendiente</option>
                    <option value="OVERDUE">Vencido</option>
                  </select>
                </label>
              </>
            )}
            {form === 'expense' && (
              <>
                <label htmlFor="business-supplier">
                  <span>Proveedor</span>
                  <Input id="business-supplier" name="supplier" required />
                </label>
                <label htmlFor="business-expense-description">
                  <span>Concepto</span>
                  <Input
                    id="business-expense-description"
                    name="description"
                    required
                  />
                </label>
                <label htmlFor="business-category">
                  <span>Categoría</span>
                  <Input id="business-category" name="category" required />
                </label>
                <label htmlFor="business-expense-type">
                  <span>Tipo</span>
                  <select id="business-expense-type" name="expenseType">
                    <option value="VARIABLE">Variable</option>
                    <option value="FIXED">Fijo</option>
                    <option value="MIXED">Mixto</option>
                  </select>
                </label>
                <label htmlFor="business-expense-amount">
                  <span>Monto total</span>
                  <Input
                    id="business-expense-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    name="amount"
                    required
                  />
                </label>
                <label htmlFor="business-expense-client">
                  <span>Imputar a cliente</span>
                  <select id="business-expense-client" name="clientId">
                    <option value="">Gasto general</option>
                    {state.clients.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label htmlFor="business-expense-service">
                  <span>Imputar a servicio</span>
                  <select id="business-expense-service" name="serviceId">
                    <option value="">Sin servicio</option>
                    {state.services.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label htmlFor="business-paid">
                  <span>Pago</span>
                  <select id="business-paid" name="paid">
                    <option value="true">Pagado</option>
                    <option value="false">Pendiente</option>
                  </select>
                </label>
              </>
            )}
            {form === 'client' && (
              <>
                <label htmlFor="business-client-name">
                  <span>Nombre</span>
                  <Input id="business-client-name" name="name" required />
                </label>
                <label htmlFor="business-client-segment">
                  <span>Segmento</span>
                  <Input id="business-client-segment" name="segment" />
                </label>
                <label htmlFor="business-client-owner">
                  <span>Responsable</span>
                  <Input id="business-client-owner" name="owner" />
                </label>
                <label htmlFor="business-client-date">
                  <span>Fecha de inicio</span>
                  <Input
                    id="business-client-date"
                    type="date"
                    name="date"
                    defaultValue="2026-09-05"
                    required
                  />
                </label>
              </>
            )}
            {form === 'service' && (
              <>
                <label htmlFor="business-service-name">
                  <span>Nombre</span>
                  <Input id="business-service-name" name="name" required />
                </label>
                <label htmlFor="business-service-category">
                  <span>Categoría</span>
                  <Input id="business-service-category" name="category" />
                </label>
                <label htmlFor="business-service-price">
                  <span>Precio de lista</span>
                  <Input
                    id="business-service-price"
                    type="number"
                    min="0"
                    step="0.01"
                    name="amount"
                    required
                  />
                </label>
                <label htmlFor="business-service-capacity">
                  <span>Capacidad mensual</span>
                  <Input
                    id="business-service-capacity"
                    type="number"
                    min="0"
                    step="1"
                    name="capacity"
                    required
                  />
                </label>
              </>
            )}
            <div className="business-dialog-actions">
              <Button
                type="button"
                variant="outline"
                onClick={() => setForm(null)}
              >
                Cancelar
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
