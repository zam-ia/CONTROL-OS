'use client';
import { flushSync } from 'react-dom';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  CheckSquare,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Download,
  Flag,
  LayoutDashboard,
  LockKeyhole,
  MessageSquare,
  Plus,
  Route,
  Search,
  Settings,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  available,
  definitions,
  dimensions,
  execute,
  execution,
  getOrg,
  getPlan,
  goalProgress,
  health,
  programProgress,
  progress,
  requirements,
  seed,
  stages,
  statusLabels,
  weeks,
  type Command,
  type Mode,
  type Org,
  type State,
  type Task,
} from '@/lib/control';
type Field = {
  key: string;
  label: string;
  type?: string;
  value?: string | number;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
};
type FormSpec = {
  title: string;
  description: string;
  command: Command;
  fields: Field[];
  button?: string;
};
const STORAGE = 'control-os-demo-v1';
function download(filename: string, text: string, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const navClient = [
  { id: 'inicio', label: 'Inicio', icon: LayoutDashboard },
  { id: 'ruta', label: 'Mi Ruta', icon: Route },
  { id: 'tareas', label: 'Tareas', icon: CheckSquare },
  { id: 'objetivos', label: 'Objetivos', icon: Target },
  { id: 'indicadores', label: 'Indicadores', icon: BarChart3 },
  { id: 'logros', label: 'Logros', icon: Flag },
  { id: 'biblioteca', label: 'Biblioteca', icon: BookOpen },
  { id: 'sesiones', label: 'Sesiones', icon: CalendarDays },
  { id: 'soporte', label: 'Soporte', icon: MessageSquare },
];
const navAdmin = [
  { id: 'portafolio', label: 'Portafolio', icon: LayoutDashboard },
  { id: 'cliente', label: 'Cliente 360', icon: Users },
  { id: 'revisiones', label: 'Revisiones', icon: ClipboardCheck },
  { id: 'intervenciones', label: 'Intervenciones', icon: Flag },
  { id: 'planes', label: 'Planes y accesos', icon: ShieldCheck },
  { id: 'configuracion', label: 'Configuración', icon: Settings },
];
const today = () => new Date().toISOString().slice(0, 10);
const displayDate = (date: string) =>
  new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    timeZone: 'America/Lima',
  }).format(new Date(date.includes('T') ? date : date + 'T17:00:00Z'));
function Pick({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => {
        if (v) onChange(String(v));
      }}
    >
      <SelectTrigger aria-label={label}>
        <span>{options.find((o) => o.value === value)?.label || label}</span>
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
function Badge({ value, color }: { value: string; color?: string }) {
  const colors: Record<string, string> = {
    TODO: 'gray',
    IN_PROGRESS: 'blue',
    BLOCKED: 'red',
    REVIEW: 'amber',
    CHANGES: 'red',
    OPEN: 'amber',
    REPORTED: 'blue',
  };
  return (
    <span className={'pill ' + (color ?? colors[value] ?? '')}>
      {statusLabels[value] || value}
    </span>
  );
}
function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="empty">
      <CheckSquare size={26} />
      <p>{children}</p>
    </div>
  );
}
function Section({
  title,
  action,
  children,
  className = '',
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={'card ' + className}>
      <div className="section-top">
        <h3>{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}
function Meter({
  label,
  value,
  right,
}: {
  label: string;
  value: number;
  right?: string;
}) {
  return (
    <div className="meter">
      <div>
        <span>{label}</span>
        <strong>{right || value + '%'}</strong>
      </div>
      <Progress aria-label={label} value={value} />
    </div>
  );
}
function FormDialog({
  form,
  onClose,
  onSave,
}: {
  form: FormSpec | null;
  onClose: () => void;
  onSave: (c: Command) => boolean;
}) {
  const [error, setError] = useState('');
  return (
    <Dialog
      open={!!form}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="control-dialog">
        <DialogTitle>{form?.title}</DialogTitle>
        <DialogDescription>{form?.description}</DialogDescription>
        {form && (
          <form
            key={form.title + JSON.stringify(form.command)}
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              const c: Command = { ...form.command };
              form.fields.forEach((f) => {
                const raw = data.get(f.key);
                (c as Record<string, unknown>)[f.key] =
                  f.type === 'number'
                    ? Number(raw)
                    : typeof raw === 'string'
                      ? raw
                      : '';
              });
              if (onSave(c)) onClose();
              else
                setError(
                  'Verifica los datos. El detalle del error aparece en el aviso inferior.',
                );
            }}
          >
            {form.fields.map((f) => (
              <label className="field" key={f.key}>
                <span>{f.label}</span>
                {f.type === 'textarea' ? (
                  <Textarea
                    name={f.key}
                    defaultValue={f.value}
                    required
                    maxLength={10000}
                  />
                ) : f.options ? (
                  <select name={f.key} defaultValue={f.value} required>
                    {f.options.map((o) => (
                      <option value={o.value} key={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    name={f.key}
                    type={f.type || 'text'}
                    defaultValue={f.value}
                    min={f.min}
                    max={f.max}
                    step={f.type === 'number' ? 'any' : undefined}
                    required
                    maxLength={500}
                  />
                )}
              </label>
            ))}
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <div className="form-footer">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">{form.button || 'Guardar'}</Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
export default function Home() {
  const [state, setState] = useState<State | null>(null);
  const [mode, setMode] = useState<Mode>('client');
  const [page, setPage] = useState('inicio');
  const [week, setWeek] = useState(1);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState<FormSpec | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [storageError, setStorageError] = useState('');
  const [resource, setResource] = useState<number | null>(null);
  const stateRef = useRef<State | null>(null);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      let s = seed();
      try {
        const saved = localStorage.getItem(STORAGE);
        if (saved) {
          const candidate = JSON.parse(saved);
          if (
            candidate.schema !== 1 ||
            !Array.isArray(candidate.orgs) ||
            candidate.orgs.length !== 3 ||
            !Array.isArray(candidate.plans)
          )
            throw Error('invalid');
          candidate.orgs.forEach((o: Org) => {
            if (o.weeks.length !== 12 || !o.tasks || !o.kpis || !o.events)
              throw Error('invalid');
          });
          s = candidate;
          getOrg(s, s.selected);
        }
      } catch {
        setStorageError(
          'No se pudo recuperar la demo anterior; se cargó una sesión nueva. Puedes exportarla antes de salir.',
        );
      }
      stateRef.current = s;
      setState(s);
      setWeek(getOrg(s, s.selected).current);
    });
    return () => {
      active = false;
    };
  }, []);
  const persist = (s: State) => {
    stateRef.current = s;
    setState(s);
    try {
      localStorage.setItem(STORAGE, JSON.stringify(s));
    } catch {
      setStorageError(
        'Los cambios están en memoria, pero el navegador no permitió guardarlos. Exporta la demo para conservarlos.',
      );
    }
  };
  const act = (c: Command) => {
    try {
      const current = stateRef.current;
      if (!current) throw Error('Espera a que cargue la demo.');
      const next = execute(current, current.selected, mode, c);
      persist(next);
      setNotice(getOrg(next, next.selected).events[0].text);
      return true;
    } catch (e) {
      setNotice(
        e instanceof Error ? e.message : 'No pudimos guardar el cambio.',
      );
      return false;
    }
  };
  const navigate = (p: string) => {
    setPage(p);
    setQuery('');
    setFilter('all');
    setTaskId(null);
  };
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context) return;
    const controller = new AbortController();
    try {
      Promise.resolve(
        context.registerTool(
          {
            name: 'control_os_open_week',
            title: 'Abrir semana CONTROL OS',
            description:
              'Abre una semana de la demo; no envía evidencia ni cambia progreso.',
            inputSchema: {
              type: 'object',
              properties: {
                week: { type: 'integer', minimum: 1, maximum: 12 },
              },
              required: ['week'],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false },
            execute: (input: unknown) => {
              const w = (input as { week?: number })?.week;
              if (!Number.isInteger(w) || !w || w < 1 || w > 12)
                throw Error('Semana inválida');
              const s = stateRef.current;
              if (!s) throw Error('Demo no cargada');
              const message = available(s, getOrg(s, s.selected), w);
              if (message) throw Error(message);
              flushSync(() => {
                setMode('client');
                setWeek(w);
                setPage('semana');
              });
              return { week: w, status: 'opened', progressChanged: false };
            },
          },
          { signal: controller.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => controller.abort();
  }, []);
  if (!state)
    return (
      <output className="loading">Preparando tu espacio de CONTROL OS…</output>
    );
  const org = getOrg(state, state.selected);
  const plan = getPlan(state, org);
  const h = health(state, org);
  const currentRun = org.weeks[org.current - 1];
  const selectedTask = org.tasks.find((t) => t.id === taskId);
  const nav = mode === 'client' ? navClient : navAdmin;
  const switchOrg = (v: string) => {
    persist({ ...state, selected: v });
    setWeek(getOrg(state, v).current);
    setTaskId(null);
    setForm(null);
    setQuery('');
    setFilter('all');
  };
  const openWeek = (w: number) => {
    setWeek(w);
    navigate('semana');
  };
  const kpiForm = (w = org.current) =>
    setForm({
      title: 'Registrar indicador',
      description:
        'Dato reportado por el cliente. No modifica automáticamente CONTROL Score.',
      command: { type: 'kpi', week: w },
      fields: [
        {
          key: 'code',
          label: 'Indicador',
          value: 'margin',
          options: definitions.map((d) => ({
            value: d.code,
            label: d.name + ' (' + d.unit + ')',
          })),
        },
        { key: 'value', label: 'Valor', type: 'number' },
        {
          key: 'period',
          label: 'Período de medición',
          type: 'date',
          value: today(),
        },
        {
          key: 'source',
          label: 'Fuente del dato',
          value: 'Registro manual de demostración',
        },
      ],
    });
  const intervene = (o = org) => {
    if (o.id !== org.id) switchOrg(o.id);
    setForm({
      title: 'Crear intervención',
      description:
        'Acción interna con responsable, plazo y resultado. No envía mensajes externos.',
      command: { type: 'intervene' },
      fields: [
        {
          key: 'text',
          label: 'Causa / señal de riesgo',
          type: 'textarea',
          value:
            health(state, o).reasons.join(' · ') || 'Seguimiento preventivo',
        },
        {
          key: 'action',
          label: 'Acción concreta',
          type: 'textarea',
          value:
            'Revisar el bloqueo con el cliente y acordar el próximo entregable.',
        },
        { key: 'owner', label: 'Responsable', value: 'Consultor demo' },
        { key: 'due', label: 'Fecha límite', type: 'date', value: today() },
        {
          key: 'severity',
          label: 'Severidad',
          value: 'Preventiva',
          options: ['Preventiva', 'Importante', 'Crítica'].map((x) => ({
            value: x,
            label: x,
          })),
        },
      ],
    });
  };
  const tasksFor = (w?: number) =>
    org.tasks.filter((t) => (w ? t.week === w : t.week <= org.current));
  const taskList = (tasks: Task[]) =>
    tasks.length ? (
      tasks.map((t) => (
        <div className="task-row" key={t.id}>
          <span className={'task-check ' + (t.status === 'DONE' ? 'done' : '')}>
            {t.status === 'DONE' ? (
              <Check size={16} />
            ) : t.status === 'BLOCKED' ? (
              <Flag size={14} />
            ) : (
              t.week
            )}
          </span>
          <div className="task-title">
            <button className="text-button" onClick={() => setTaskId(t.id)}>
              {t.title}
            </button>
            <small>
              Semana {t.week} · {org.person} · Vence {displayDate(t.due)}
              {t.blocker ? ' · ' + t.blocker : ''}
            </small>
          </div>
          <Badge value={t.status} />
          <Button
            variant="ghost"
            size="icon"
            aria-label={'Abrir ' + t.title}
            onClick={() => setTaskId(t.id)}
          >
            <ChevronRight />
          </Button>
        </div>
      ))
    ) : (
      <Empty>No hay tareas en esta vista.</Empty>
    );
  const scoreCard = (
    <Section title="CONTROL Score" action={<BarChart3 size={18} />}>
      <div className="score-heading">
        <div className="big-number">
          {org.control.reduce((a, b) => a + b, 0)}
          <span>/100</span>
        </div>
        <Badge
          value={
            (org.control.reduce((a, b) => a + b, 0) -
              org.baseline.reduce((a, b) => a + b, 0) >=
            0
              ? '+'
              : '') +
            (org.control.reduce((a, b) => a + b, 0) -
              org.baseline.reduce((a, b) => a + b, 0)) +
            ' vs. baseline'
          }
        />
      </div>
      <p className="muted text-small">
        Madurez del negocio · evaluación ilustrativa v1
      </p>
      {dimensions.map((d, i) => (
        <Meter
          key={d}
          label={d}
          value={org.control[i] * 4}
          right={org.control[i] + '/25'}
        />
      ))}
      <small className="muted">
        Rúbrica de 20 criterios pendiente de aprobación.
      </small>
    </Section>
  );
  const goals = (
    <div className="cards-grid">
      {org.goals.map((g) => (
        <Section key={g.id} title={g.title} action={<Target size={19} />}>
          <Badge
            value={
              goalProgress(g) === 100 ? 'Meta alcanzada' : 'Avance reportado'
            }
            color={goalProgress(g) === 100 ? '' : 'blue'}
          />
          <div className="goal-numbers">
            <strong>
              {g.current} <small>{g.unit}</small>
            </strong>
            <ArrowRight size={18} />
            <span>
              {g.target} {g.unit}
              <small>Meta · {displayDate(g.due)}</small>
            </span>
          </div>
          <Meter
            label={'Desde baseline ' + g.baseline + ' ' + g.unit}
            value={goalProgress(g)}
          />
          <Button
            variant="outline"
            onClick={() =>
              setForm({
                title: 'Actualizar objetivo',
                description:
                  g.title + ' · avance manual; no actualiza el KPI de origen.',
                command: { type: 'goal', targetId: g.id },
                fields: [
                  {
                    key: 'value',
                    label: 'Valor actual (' + g.unit + ')',
                    type: 'number',
                    value: g.current,
                  },
                ],
              })
            }
          >
            Actualizar avance
          </Button>
        </Section>
      ))}
    </div>
  );
  const timeline = (internal = false) => (
    <div className="timeline">
      {org.events
        .filter((e) => internal || !e.internal)
        .slice(0, 15)
        .map((e) => (
          <div key={e.id}>
            <span className="timeline-dot" />
            <p>
              {e.text}
              <small>
                {displayDate(e.at)} ·{' '}
                {e.actor === 'admin' ? 'Consultor demo' : 'Cliente demo'}
                {e.internal ? ' · Interno' : ''}
              </small>
            </p>
          </div>
        ))}
    </div>
  );
  const session = (
    <Section title={org.session.title} action={<CalendarDays size={20} />}>
      <div className="session-date">
        <div className="date-tile">{displayDate(org.session.date)}</div>
        <div>
          <strong>
            {new Date(org.session.date).toLocaleTimeString('es-PE', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'America/Lima',
            })}
          </strong>
          <small>America/Lima · sesión de demostración</small>
        </div>
      </div>
      <p className="muted">{org.session.agenda}</p>
      <div className="inline-actions">
        <Button
          variant="outline"
          onClick={() =>
            act({ type: 'attendance', checked: !org.session.attended })
          }
        >
          {org.session.attended
            ? 'Retirar asistencia'
            : 'Registrar asistencia demo'}
        </Button>
        <Button
          variant="ghost"
          onClick={() =>
            setForm({
              title: 'Convertir acuerdo en tarea',
              description:
                'Se creará una tarea con evidencia requerida en la semana actual.',
              command: { type: 'agreement', week: org.current },
              fields: [
                {
                  key: 'text',
                  label: 'Acuerdo / resultado esperado',
                  type: 'textarea',
                },
                {
                  key: 'due',
                  label: 'Fecha de vencimiento',
                  type: 'date',
                  value: today(),
                },
              ],
            })
          }
        >
          + Acuerdo
        </Button>
      </div>
      <p className="caption">
        Sin enlace de reunión: no se ha configurado proveedor.
      </p>
    </Section>
  );
  const gatePanel = (w: number) => {
    const r = org.weeks[w - 1];
    return (
      <Section
        title={'Cierre de semana ' + w}
        action={<Badge value={r.gate} />}
      >
        <p className="muted">{weeks[w - 1].gate}</p>
        <div className="requirements">
          {requirements(org, w).map((r) => (
            <div key={r.label}>
              {r.ok ? (
                <Check size={17} className="green" />
              ) : (
                <Clock3 size={17} />
              )}
              <span>{r.label}</span>
            </div>
          ))}
        </div>
        {r.feedback && <p className="feedback">{r.feedback}</p>}
        {mode === 'client' ? (
          <Button
            className="full"
            disabled={
              !!available(state, org, w) ||
              !requirements(org, w).every((r) => r.ok) ||
              ['APPROVED', 'REVIEW'].includes(r.gate)
            }
            onClick={() => act({ type: 'submitGate', week: w })}
          >
            {r.gate === 'APPROVED'
              ? 'Cierre aprobado'
              : r.gate === 'REVIEW'
                ? 'En revisión por consultor'
                : 'Enviar cierre a revisión'}
            <ArrowRight />
          </Button>
        ) : r.gate === 'REVIEW' ? (
          <div className="inline-actions">
            <Button
              onClick={() =>
                setForm({
                  title: 'Aprobar cierre',
                  description:
                    'Primero valida cada evidencia de la semana. La aprobación desbloquea la siguiente.',
                  command: { type: 'approveGate', week: w },
                  fields: [
                    {
                      key: 'text',
                      label: 'Conclusión de la revisión',
                      type: 'textarea',
                    },
                  ],
                })
              }
            >
              Aprobar
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setForm({
                  title: 'Solicitar ajustes',
                  description:
                    'Se conserva la evidencia original y el cliente recibe esta observación en la demo.',
                  command: { type: 'changesGate', week: w },
                  fields: [
                    {
                      key: 'text',
                      label: 'Qué debe corregir el cliente',
                      type: 'textarea',
                    },
                  ],
                })
              }
            >
              Pedir cambios
            </Button>
          </div>
        ) : (
          <small className="muted">
            El cliente debe enviar el cierre para solicitar revisión.
          </small>
        )}
        <p className="caption">
          Gate híbrido de demostración: validación de mínimos + revisión humana.
          No evalúa automáticamente la calidad de los datos.
        </p>
      </Section>
    );
  };
  const allTitles: Record<string, string> = {
    inicio: 'Menos ruido. Más control.',
    ruta: 'Tu ruta de implementación',
    tareas: 'De la intención a la evidencia',
    objetivos: 'Resultados que importan',
    indicadores: 'Los números, con contexto',
    logros: 'Avances con evidencia',
    biblioteca: 'Herramientas para ejecutar',
    sesiones: 'Acompañamiento con propósito',
    soporte: 'Desbloquea tu siguiente paso',
    portafolio: 'Cada cliente, en perspectiva.',
    cliente: org.name + ' · Cliente 360',
    revisiones: 'El avance merece validación',
    intervenciones: 'Actúa antes del estancamiento',
    planes: 'Acceso claro. Alcance definido.',
    configuracion: 'Reglas de la demostración',
    notificaciones: 'Actividad y notificaciones',
    semana: weeks[week - 1].title,
  };
  let body: ReactNode;
  if (page === 'inicio')
    body = (
      <>
        <div className="dashboard-grid">
          <section className="card route-hero">
            <div className="section-top">
              <span className="eyebrow">TU RUTA DE IMPLEMENTACIÓN</span>
              <Badge
                value={currentRun.gate === 'REVIEW' ? 'REVIEW' : 'IN_PROGRESS'}
              />
            </div>
            <h2>{stages[Math.ceil(org.current / 3) - 1]}</h2>
            <p>
              Semana {org.current} · {weeks[org.current - 1].title}
            </p>
            <div className="route-steps">
              {stages.map((_, i) => (
                <div
                  key={i}
                  className={
                    Math.ceil(org.current / 3) >= i + 1 ? 'reached' : ''
                  }
                >
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  <i />
                </div>
              ))}
            </div>
            <Meter
              label="Semanas aprobadas del plan"
              value={programProgress(state, org)}
            />
            <Button onClick={() => openWeek(org.current)}>
              Continuar mi semana <ArrowRight />
            </Button>
          </section>
          {scoreCard}
          <Section
            title="Tus acciones prioritarias"
            action={
              <Button variant="ghost" onClick={() => navigate('tareas')}>
                Ver todas <ArrowRight />
              </Button>
            }
          >
            {taskList(
              tasksFor()
                .filter((t) => t.status !== 'DONE')
                .sort((a, b) => a.due.localeCompare(b.due))
                .slice(0, 3),
            )}
          </Section>
          {session}
          <Section title="Tu objetivo de enfoque" action={<Target size={19} />}>
            <h2>{org.goals[0].title}</h2>
            <p className="muted">
              De {org.goals[0].baseline}
              {org.goals[0].unit} a {org.goals[0].target}
              {org.goals[0].unit}
            </p>
            <Meter
              label="Avance del resultado"
              value={goalProgress(org.goals[0])}
            />
            <Button variant="outline" onClick={() => navigate('objetivos')}>
              Ver objetivos
            </Button>
          </Section>
          <Section title="Siguiente punto de control">
            <div className="callout">
              <Clock3 size={20} />
              <div>
                <strong>
                  {currentRun.kpi
                    ? 'Tu KPI ya está reportado'
                    : 'Falta tu check-in de esta semana'}
                </strong>
                <p>
                  {currentRun.kpi
                    ? 'Revisa tus evidencias y envía el cierre.'
                    : 'Registrar un dato confiable es el primer paso para decidir mejor.'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() =>
                currentRun.kpi ? openWeek(org.current) : kpiForm()
              }
            >
              {currentRun.kpi ? 'Revisar cierre' : 'Registrar indicador'}{' '}
              <ArrowRight />
            </Button>
          </Section>
        </div>
        <Section title="Actividad reciente" className="spaced">
          {timeline()}
        </Section>
      </>
    );
  else if (page === 'ruta')
    body = (
      <div className="route-gallery">
        {stages.map((s, i) => (
          <Section
            key={s}
            title={s}
            action={<span className="stage-number">0{i + 1}</span>}
          >
            <p className="muted">
              Semanas {i * 3 + 1}–{i * 3 + 3}
            </p>
            {weeks.slice(i * 3, i * 3 + 3).map((w, j) => {
              const n = i * 3 + j + 1;
              const reason = available(state, org, n);
              const r = org.weeks[n - 1];
              return (
                <div className="week-row" key={n}>
                  <div className="section-top">
                    <span className="week-number">
                      SEMANA {String(n).padStart(2, '0')}
                    </span>
                    {reason ? (
                      <Badge value="Bloqueada" color="gray" />
                    ) : (
                      <Badge
                        value={r.gate === 'OPEN' ? 'IN_PROGRESS' : r.gate}
                      />
                    )}
                  </div>
                  <h3>{w.title}</h3>
                  <p className="muted">{reason || w.objective}</p>
                  <Button variant="outline" onClick={() => openWeek(n)}>
                    {reason ? <LockKeyhole /> : <ArrowRight />}
                    {reason ? 'Ver requisitos' : 'Abrir semana'}
                  </Button>
                </div>
              );
            })}
          </Section>
        ))}
      </div>
    );
  else if (page === 'semana') {
    const reason = available(state, org, week);
    const r = org.weeks[week - 1];
    body = (
      <>
        <Button variant="ghost" onClick={() => navigate('ruta')}>
          ← Volver a mi ruta
        </Button>
        {reason ? (
          <Section
            title="Esta semana todavía no está disponible"
            className="spaced"
          >
            <div className="callout">
              <LockKeyhole />
              <p>{reason}</p>
            </div>
            <p className="muted">
              Plan actual: {plan.name} v{plan.version}. Los requisitos se
              mantienen visibles para que sepas cómo avanzar.
            </p>
          </Section>
        ) : (
          <div className="dashboard-grid spaced">
            <div>
              <Section title={'Semana ' + week + ' · Objetivo'}>
                <p>{weeks[week - 1].objective}</p>
                <Meter
                  label="Requisitos ejecutados (no equivale a aprobación)"
                  value={progress(org, week)}
                />
                <div className="lesson">
                  <BookOpen size={24} />
                  <h3>Guía de trabajo</h3>
                  <p>
                    Esta semana produce una evidencia que se pueda revisar.
                    Reúne la información, explica su fuente y vincula cada
                    entregable a una decisión del negocio.
                  </p>
                  <p className="muted">
                    Contenido editorial de demostración. Los videos y materiales
                    originales del programa están pendientes de carga.
                  </p>
                  <label className="check-label">
                    <Checkbox
                      checked={r.content}
                      disabled={['APPROVED', 'REVIEW'].includes(r.gate)}
                      onCheckedChange={(checked) =>
                        act({
                          type: 'weekFlag',
                          week,
                          field: 'content',
                          checked: !!checked,
                        })
                      }
                    />{' '}
                    He revisado el contenido mínimo
                  </label>
                </div>
              </Section>
              <Section title="Microacciones" className="spaced">
                {taskList(tasksFor(week))}
              </Section>
              <Section title="Notas personales" className="spaced">
                {org.notes.map((n, i) => (
                  <p className="feedback" key={i}>
                    {n.text}
                    <small>
                      {n.shared
                        ? 'Compartida con consultor (simulación)'
                        : 'Solo yo (simulación)'}
                    </small>
                  </p>
                ))}
                <div className="inline-actions">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setForm({
                        title: 'Nota personal',
                        description:
                          'Visibilidad simulada en este navegador. No escribas información confidencial.',
                        command: { type: 'note', shared: false },
                        fields: [
                          {
                            key: 'text',
                            label: 'Tu descubrimiento',
                            type: 'textarea',
                          },
                        ],
                      })
                    }
                  >
                    Solo yo
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setForm({
                        title: 'Nota compartida',
                        description:
                          'Visible en Cliente 360 dentro de esta demo.',
                        command: { type: 'note', shared: true },
                        fields: [
                          {
                            key: 'text',
                            label: 'Nota para el consultor',
                            type: 'textarea',
                          },
                        ],
                      })
                    }
                  >
                    Compartir con consultor
                  </Button>
                </div>
              </Section>
            </div>
            <div>
              {gatePanel(week)}
              <Section title="Checklist y check-in" className="spaced">
                <label className="check-label">
                  <Checkbox
                    checked={r.checklist}
                    disabled={['APPROVED', 'REVIEW'].includes(r.gate)}
                    onCheckedChange={(checked) =>
                      act({
                        type: 'weekFlag',
                        week,
                        field: 'checklist',
                        checked: !!checked,
                      })
                    }
                  />{' '}
                  Confirmo que revisé la fuente y coherencia de mis entregables.
                </label>
                <Button
                  variant="outline"
                  disabled={r.gate === 'APPROVED'}
                  onClick={() => kpiForm(week)}
                >
                  Registrar KPI
                </Button>
              </Section>
            </div>
          </div>
        )}
      </>
    );
  } else if (page === 'tareas')
    body = (
      <Section title="Tablero de ejecución">
        <div className="filters">
          <Input
            aria-label="Buscar tareas"
            placeholder="Buscar una acción…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Pick
            label="Estado"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'Todos los estados' },
              ...['TODO', 'IN_PROGRESS', 'BLOCKED', 'REVIEW', 'DONE'].map(
                (value) => ({ value, label: statusLabels[value] }),
              ),
            ]}
          />
        </div>
        {taskList(
          tasksFor().filter(
            (t) =>
              t.title.toLowerCase().includes(query.toLowerCase()) &&
              (filter === 'all' || t.status === filter),
          ),
        )}
      </Section>
    );
  else if (page === 'objetivos')
    body = (
      <>
        <div className="toolbar">
          <span className="muted">
            Horizonte mensual y 90 días · avances manuales
          </span>
          <Button
            onClick={() =>
              setForm({
                title: 'Crear objetivo',
                description:
                  'Define un resultado medible. Los indicadores se reportan por separado.',
                command: { type: 'createGoal' },
                fields: [
                  { key: 'title', label: 'Resultado esperado' },
                  {
                    key: 'baseline',
                    label: 'Línea base',
                    type: 'number',
                    value: 0,
                  },
                  { key: 'target', label: 'Meta', type: 'number', value: 100 },
                  { key: 'unit', label: 'Unidad', value: '%' },
                  {
                    key: 'due',
                    label: 'Fecha objetivo',
                    type: 'date',
                    value: today(),
                  },
                ],
              })
            }
          >
            <Plus /> Nuevo objetivo
          </Button>
        </div>
        {goals}
      </>
    );
  else if (page === 'indicadores')
    body = (
      <>
        <div className="toolbar">
          <p className="muted">
            Datos ficticios · moneda PEN · fuente y validación explícitas
          </p>
          <Button onClick={() => kpiForm()}>
            <Plus /> Registrar indicador
          </Button>
        </div>
        <div className="dashboard-grid">
          {scoreCard}
          <Section title="Execution Score">
            <div className="big-number">
              {execution(org)}
              <span>/100</span>
            </div>
            <p className="muted">
              Cumplimiento de la ruta, no madurez de negocio.
            </p>
            <ul className="formula">
              <li>
                Tareas a tiempo <b>35%</b>
              </li>
              <li>
                Check-ins reportados <b>20%</b>
              </li>
              <li>
                Cierres aprobados <b>20%</b>
              </li>
              <li>
                Asistencia <b>15%</b>
              </li>
              <li>
                Actividad significativa <b>10%</b>
              </li>
            </ul>
            <small className="muted">
              Cálculo ilustrativo acumulado hasta la semana actual. La versión
              productiva requerirá ventanas semanales y SLA aprobados.
            </small>
          </Section>
        </div>
        <Section title="Histórico de indicadores" className="spaced">
          <Table>
            <TableHeader>
              <TableRow>
                {['Indicador', 'Período', 'Valor', 'Fuente', 'Calidad'].map(
                  (t) => (
                    <TableHead key={t}>{t}</TableHead>
                  ),
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...org.kpis].reverse().map((k) => (
                <TableRow key={k.id}>
                  <TableCell>
                    {definitions.find((d) => d.code === k.code)?.name}
                  </TableCell>
                  <TableCell>{k.period}</TableCell>
                  <TableCell>
                    {k.value} {definitions.find((d) => d.code === k.code)?.unit}
                  </TableCell>
                  <TableCell>{k.source}</TableCell>
                  <TableCell>
                    <Badge value={k.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>
      </>
    );
  else if (page === 'logros')
    body = (
      <>
        <p className="muted">
          Un logro aparece únicamente cuando un cierre fue aprobado por el
          consultor en la demostración.
        </p>
        <div className="cards-grid">
          {org.weeks
            .filter((w) => w.gate === 'APPROVED')
            .map((w) => (
              <Section
                key={w.number}
                title={
                  w.number === 1
                    ? 'Línea base activada'
                    : 'Semana ' + w.number + ' validada'
                }
                action={<ShieldCheck className="green" />}
              >
                <p>{weeks[w.number - 1].title}</p>
                <p className="muted">
                  {w.feedback || 'Validación de demostración precargada.'}
                </p>
                <Button variant="outline" onClick={() => openWeek(w.number)}>
                  Ver evidencia
                </Button>
              </Section>
            ))}
        </div>
        {!org.weeks.some((w) => w.gate === 'APPROVED') && (
          <Section title="Tu primer hito está en camino">
            <Empty>
              Completa las acciones de la semana 1 y solicita la aprobación de
              tu línea base.
            </Empty>
            <Button onClick={() => openWeek(1)}>
              Continuar semana 1 <ArrowRight />
            </Button>
          </Section>
        )}
      </>
    );
  else if (page === 'biblioteca')
    body = (
      <>
        <p className="muted">
          Plantillas editoriales de ejemplo · v1.0 · no son los archivos
          originales del programa.
        </p>
        <div className="cards-grid">
          {[
            'Rastreador de tiempo real',
            'P&L simplificado',
            'SOP de una página',
            'Acuerdo de delegación',
            'Roadmap 90 días',
          ].map((title, i) => (
            <Section title={title} key={title} action={<BookOpen size={20} />}>
              <Badge
                value={i < 2 ? 'Biblioteca básica' : 'Biblioteca avanzada'}
                color="gray"
              />
              <p className="resource-description">
                {
                  [
                    'Registra actividad, duración y posibilidad de delegación.',
                    'Ordena ingresos, costos y utilidad operativa.',
                    'Establece propósito, owner, pasos y criterio de salida.',
                    'Define la responsabilidad y sus límites de decisión.',
                    'Alinea resultados, responsables y revisiones.',
                  ][i]
                }
              </p>
              <Button
                variant="outline"
                disabled={i >= 2 && !plan.advanced}
                onClick={() => setResource(i)}
              >
                {i >= 2 && !plan.advanced ? (
                  <>
                    <LockKeyhole /> Fuera de tu plan
                  </>
                ) : (
                  <>
                    Abrir plantilla <ArrowUpRight />
                  </>
                )}
              </Button>
            </Section>
          ))}
        </div>
      </>
    );
  else if (page === 'sesiones')
    body = (
      <div className="dashboard-grid">
        {session}
        <Section title="Acuerdos que se ejecutan">
          <p className="muted">
            Registra un acuerdo en la sesión y conviértelo en una acción con
            responsable y evidencia.
          </p>
          <p>
            La agenda es ilustrativa. Calendario, email y reuniones externas no
            están conectados.
          </p>
          <Badge value="Sin integraciones externas" color="gray" />
        </Section>
      </div>
    );
  else if (page === 'soporte')
    body = (
      <>
        <div className="toolbar">
          <p className="muted">
            Consultas locales. No se envían mensajes al equipo real.
          </p>
          <Button
            onClick={() =>
              setForm({
                title: 'Abrir consulta',
                description:
                  'Tu consulta aparecerá en Cliente 360 para simular la respuesta del equipo.',
                command: { type: 'support' },
                fields: [
                  {
                    key: 'text',
                    label: '¿Qué te está bloqueando?',
                    type: 'textarea',
                  },
                ],
              })
            }
          >
            <Plus /> Nueva consulta
          </Button>
        </div>
        {org.support.length ? (
          org.support.map((t) => (
            <Section
              title="Consulta de acompañamiento"
              key={t.id}
              className="spaced"
            >
              <p>{t.text}</p>
              {t.reply ? (
                <p className="feedback">{t.reply}</p>
              ) : (
                <Badge value="Esperando al equipo" color="amber" />
              )}
            </Section>
          ))
        ) : (
          <Section title="Un canal para destrabar">
            <Empty>
              Aún no hay consultas. Crea una si necesitas ayuda con tu siguiente
              paso.
            </Empty>
          </Section>
        )}
      </>
    );
  else if (page === 'portafolio') {
    const clients = state.orgs.filter(
      (o) =>
        o.name.toLowerCase().includes(query.toLowerCase()) &&
        (filter === 'all' || health(state, o).label === filter),
    );
    body = (
      <>
        <div className="stats-grid">
          <Section title="Clientes demo">
            <div className="big-number">{state.orgs.length}</div>
            <small className="muted">1 empresa por plan</small>
          </Section>
          <Section title="Requieren atención">
            <div className="big-number">
              {
                state.orgs.filter((o) => health(state, o).label !== 'Estable')
                  .length
              }
            </div>
            <small className="muted">Según reglas provisionales</small>
          </Section>
          <Section title="Cierres por revisar">
            <div className="big-number">
              {
                state.orgs
                  .flatMap((o) => o.weeks)
                  .filter((w) => w.gate === 'REVIEW').length
              }
            </div>
            <small className="muted">Pendientes del consultor</small>
          </Section>
          <Section title="Tareas vencidas">
            <div className="big-number">
              {state.orgs.reduce((sum, o) => sum + health(state, o).overdue, 0)}
            </div>
            <small className="muted">Hasta semana actual</small>
          </Section>
        </div>
        <Section title="Portafolio de clientes" className="spaced">
          <div className="filters">
            <div className="search-field">
              <Search size={17} />
              <Input
                aria-label="Buscar clientes"
                placeholder="Buscar empresa…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Pick
              label="Filtrar salud"
              value={filter}
              onChange={setFilter}
              options={['all', 'En riesgo', 'Atención', 'Estable'].map((x) => ({
                value: x,
                label: x === 'all' ? 'Toda la cartera' : x,
              }))}
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  'Empresa / plan',
                  'Ruta',
                  'Salud',
                  'Última actividad',
                  'Acción',
                ].map((t) => (
                  <TableHead key={t}>{t}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((o) => {
                const risk = health(state, o);
                return (
                  <TableRow key={o.id}>
                    <TableCell>
                      <strong>{o.name}</strong>
                      <small>{getPlan(state, o).name}</small>
                    </TableCell>
                    <TableCell>
                      Semana {o.current}
                      <Meter
                        label="Progreso"
                        value={programProgress(state, o)}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge
                        value={risk.label + ' · ' + risk.score}
                        color={risk.color}
                      />
                    </TableCell>
                    <TableCell>
                      {risk.days === 0 ? 'Hoy' : risk.days + ' días atrás'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        onClick={() => {
                          switchOrg(o.id);
                          navigate('cliente');
                        }}
                      >
                        Cliente 360 <ArrowRight />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {!clients.length && <Empty>No hay clientes para este filtro.</Empty>}
        </Section>
        <Section title="Señales para intervenir" className="spaced">
          {state.orgs
            .filter((o) => health(state, o).reasons.length)
            .map((o) => (
              <div className="task-row" key={o.id}>
                <Flag size={19} />
                <div className="task-title">
                  <strong>{o.name}</strong>
                  <small>{health(state, o).reasons.join(' · ')}</small>
                </div>
                <Button variant="outline" onClick={() => intervene(o)}>
                  Intervenir
                </Button>
              </div>
            ))}
        </Section>
      </>
    );
  } else if (page === 'cliente')
    body = (
      <>
        <div className="toolbar">
          <div>
            <Badge value={plan.name} color="gray" />{' '}
            <Badge value={h.label + ' · ' + h.score} color={h.color} />
          </div>
          <Button onClick={() => intervene()}>Crear intervención</Button>
        </div>
        <div className="dashboard-grid">
          {scoreCard}
          <Section title="Contexto y riesgo">
            <p>
              {org.person} · Semana {org.current} · Cohorte demo
            </p>
            {h.reasons.map((r) => (
              <p className="risk-line" key={r}>
                <Flag size={15} /> {r}
              </p>
            ))}
            <p className="caption">
              Health: ejecución 25%, actividad 15%, vencidas 15%, KPI 15%,
              asistencia 10%, bloqueos 10%, evaluación manual neutral 5/10.
              Aproximación demo.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                navigate('revisiones');
              }}
            >
              Revisar evidencias
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                setForm({
                  title: 'Actualizar CONTROL Score',
                  description:
                    'Captura resumida por dimensión. La rúbrica de 20 criterios queda pendiente; justificación obligatoria.',
                  command: { type: 'score' },
                  fields: dimensions
                    .map(
                      (d, i): Field => ({
                        key: 'dimension' + i,
                        label: d + ' /25',
                        type: 'number',
                        min: 0,
                        max: 25,
                        value: org.control[i],
                      }),
                    )
                    .concat([
                      {
                        key: 'text',
                        label: 'Justificación y evidencia de la evaluación',
                        type: 'textarea',
                        value: '',
                      } as Field,
                    ]),
                })
              }
            >
              Reevaluar score
            </Button>
          </Section>
        </div>
        <Section title="KPIs reportados" className="spaced">
          {org.kpis.map((k) => (
            <div className="task-row" key={k.id}>
              <div className="task-title">
                <strong>
                  {definitions.find((d) => d.code === k.code)?.name}: {k.value}
                </strong>
                <small>
                  {k.period} · {k.source}
                </small>
              </div>
              <Badge value={k.status} />
              {k.status === 'REPORTED' && (
                <Button
                  variant="outline"
                  onClick={() => act({ type: 'validateKpi', targetId: k.id })}
                >
                  Validar dato
                </Button>
              )}
            </div>
          ))}
        </Section>
        <Section title="Notas compartidas" className="spaced">
          {org.notes
            .filter((n) => n.shared)
            .map((n, i) => (
              <p key={i}>{n.text}</p>
            ))}
          {!org.notes.some((n) => n.shared) && (
            <p className="muted">
              No hay notas compartidas. Las notas «solo yo» no se muestran en
              esta vista; esto no es una barrera de seguridad.
            </p>
          )}
        </Section>
        <Section title="Consultas de soporte" className="spaced">
          {org.support.length ? (
            org.support.map((t) => (
              <div className="task-row" key={t.id}>
                <div className="task-title">
                  <p>{t.text}</p>
                  {t.reply && <p className="feedback">{t.reply}</p>}
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    setForm({
                      title: 'Responder consulta',
                      description:
                        'Respuesta local para el portal cliente de demostración.',
                      command: { type: 'reply', targetId: t.id },
                      fields: [
                        {
                          key: 'text',
                          label: 'Respuesta',
                          type: 'textarea',
                          value: t.reply,
                        },
                      ],
                    })
                  }
                >
                  Responder
                </Button>
              </div>
            ))
          ) : (
            <p className="muted">Sin consultas abiertas.</p>
          )}
        </Section>
        <Section title="Timeline de la empresa" className="spaced">
          {timeline(true)}
        </Section>
      </>
    );
  else if (page === 'revisiones')
    body = (
      <>
        <div className="dashboard-grid">
          <div>
            <Section title="Evidencias por validar">
              {taskList(tasksFor().filter((t) => t.status === 'REVIEW'))}
            </Section>
            <Section title="Tareas validadas" className="spaced">
              {taskList(
                tasksFor(org.current).filter((t) => t.status === 'DONE'),
              )}
            </Section>
          </div>
          <div>
            {org.weeks.filter((w) => w.gate === 'REVIEW').length
              ? org.weeks
                  .filter((w) => w.gate === 'REVIEW')
                  .map((w) => (
                    <div key={w.number} className="bottom-gap">
                      {gatePanel(w.number)}
                    </div>
                  ))
              : gatePanel(org.current)}
          </div>
        </div>
      </>
    );
  else if (page === 'intervenciones')
    body = (
      <>
        <div className="toolbar">
          <span className="muted">
            Causa → acción → responsable → resultado
          </span>
          <Button onClick={() => intervene()}>
            <Plus /> Crear intervención
          </Button>
        </div>
        {org.interventions.length ? (
          org.interventions.map((i) => (
            <Section
              key={i.id}
              title={i.reason}
              className="spaced"
              action={<Badge value={i.status} />}
            >
              <p>{i.action}</p>
              <p className="muted">
                {i.owner} · {i.severity} · Plazo {displayDate(i.due)}
              </p>
              {i.status === 'OPEN' ? (
                <Button
                  variant="outline"
                  onClick={() =>
                    setForm({
                      title: 'Resolver intervención',
                      description:
                        'Deja constancia del resultado, no solo del contacto.',
                      command: { type: 'resolve', targetId: i.id },
                      fields: [
                        {
                          key: 'text',
                          label: 'Resultado y aprendizaje',
                          type: 'textarea',
                        },
                      ],
                    })
                  }
                >
                  Registrar resultado
                </Button>
              ) : (
                <p className="feedback">{i.outcome}</p>
              )}
            </Section>
          ))
        ) : (
          <Section title="Sin intervenciones registradas">
            <Empty>
              Las señales del portafolio te ayudan a decidir cuándo intervenir.
            </Empty>
          </Section>
        )}
      </>
    );
  else if (page === 'planes')
    body = (
      <>
        <div className="demo-notice">
          Matriz propuesta. Los límites se muestran como referencia; esta demo
          no gestiona contratos, cobros ni elegibilidad real para Partnership.
        </div>
        <div className="cards-grid">
          {state.plans.map((p) => (
            <Section
              key={p.id}
              title={p.name}
              action={<Badge value={'v' + p.version} color="gray" />}
            >
              <ul className="plan-list">
                {stages.map((s, i) => (
                  <li key={s}>
                    {p.stages.includes(i + 1) ? (
                      <Check className="green" size={16} />
                    ) : (
                      <LockKeyhole size={15} />
                    )}
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
              <p className="muted">
                Equipo: {p.team} · Sesiones de referencia: {p.sessions}
                <br />
                Biblioteca {p.advanced ? 'completa' : 'básica'}
              </p>
              {p.name === 'CONTROL Implementación' && (
                <Button
                  variant="outline"
                  onClick={() =>
                    act({
                      type: 'planVersion',
                      planId: p.id,
                      checked: !p.stages.includes(4),
                    })
                  }
                >
                  Crear v. con etapa 4{' '}
                  {p.stages.includes(4) ? 'excluida' : 'incluida'}
                </Button>
              )}
              <p className="caption">
                Crear versión no migra clientes ni altera su acceso anterior.
              </p>
            </Section>
          ))}
        </div>
      </>
    );
  else if (page === 'configuracion')
    body = (
      <div className="dashboard-grid">
        <Section title="Umbrales de Client Health">
          <p className="muted">
            Configuración provisional aplicada al portafolio demo.
          </p>
          <p>
            Verde: {state.thresholds.green}–100
            <br />
            Amarillo: {state.thresholds.amber}–{state.thresholds.green - 1}
            <br />
            Rojo: 0–{state.thresholds.amber - 1}
          </p>
          <Button
            variant="outline"
            onClick={() =>
              setForm({
                title: 'Ajustar umbrales de salud',
                description:
                  'Modifica la clasificación, no las señales originales.',
                command: { type: 'thresholds' },
                fields: [
                  {
                    key: 'green',
                    label: 'Verde desde',
                    type: 'number',
                    min: 1,
                    max: 100,
                    value: state.thresholds.green,
                  },
                  {
                    key: 'amber',
                    label: 'Amarillo desde',
                    type: 'number',
                    min: 0,
                    max: 99,
                    value: state.thresholds.amber,
                  },
                ],
              })
            }
          >
            Editar umbrales
          </Button>
        </Section>
        <Section title="Datos de esta demostración">
          <p className="muted">
            Los cambios se guardan solo en este navegador. No existe backend,
            autenticación, aislamiento seguro de empresas ni envío de email.
          </p>
          <Button
            variant="outline"
            onClick={() =>
              download(
                'control-os-demo.json',
                JSON.stringify(state, null, 2),
                'application/json',
              )
            }
          >
            <Download /> Exportar datos demo
          </Button>
          <p className="caption">
            El archivo incluye las tres empresas ficticias y las notas locales.
            No cargues datos reales.
          </p>
        </Section>
        <Section title="Pendiente para producción" className="wide">
          <p>
            Autenticación e invitaciones, 2FA, RBAC servidor, base de datos
            multi-tenant, archivos privados, auditoría inmutable, backups,
            rúbrica de score aprobada, CMS versionado, integraciones y pruebas
            de seguridad/UAT.
          </p>
          <p className="muted">
            Arquitectura recomendada por el PDF: Laravel + PostgreSQL +
            React/TypeScript. Esta interfaz React es un prototipo funcional para
            validar los flujos, no sustituye esa implementación.
          </p>
        </Section>
      </div>
    );
  else
    body = (
      <Section title="Actividad local" action={<Bell size={19} />}>
        <p className="muted">
          Timeline de esta demostración; no son notificaciones enviadas por
          email.
        </p>
        {timeline(mode === 'admin')}
      </Section>
    );
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-symbol">C</span>CONTROL <b>OS</b>
        </div>
        <div className="workspace">
          <small>EMPRESA DE DEMOSTRACIÓN</small>
          <Pick
            label="Empresa de demostración"
            value={state.selected}
            options={state.orgs.map((o) => ({ value: o.id, label: o.name }))}
            onChange={switchOrg}
          />
          <small>
            {plan.name.replace('CONTROL ', '')} · v{plan.version}
          </small>
        </div>
        <small className="eyebrow">
          {mode === 'client' ? 'TU ESPACIO DE CONTROL' : 'COMMAND CENTER'}
        </small>
        <nav
          aria-label={mode === 'client' ? 'Portal cliente' : 'Administración'}
        >
          {nav.map(({ id, label, icon: Icon }) => (
            <button
              aria-current={page === id ? 'page' : undefined}
              className={page === id ? 'active' : ''}
              key={id}
              onClick={() => navigate(id)}
            >
              <Icon size={18} />
              {label}
              {id === 'tareas' && (
                <span className="nav-count">
                  {tasksFor().filter((t) => t.status !== 'DONE').length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <ShieldCheck size={21} />
          <p>
            Un negocio que crece.
            <br />
            <strong>Un dueño en control.</strong>
          </p>
          <span>CONTROL OS · demo funcional</span>
        </div>
      </aside>
      <main>
        <header>
          <div className="breadcrumb">
            {mode === 'client' ? 'Mi workspace' : 'Administración'}{' '}
            <ChevronRight size={13} />
            <span>
              {page === 'semana'
                ? 'Semana ' + week
                : nav.find((n) => n.id === page)?.label || 'Actividad'}
            </span>
          </div>
          <div className="header-right">
            <Pick
              label="Vista de demostración, no acceso autenticado"
              value={mode}
              options={[
                { value: 'client', label: 'Vista cliente' },
                { value: 'admin', label: 'Vista admin' },
              ]}
              onChange={(v) => {
                setMode(v as Mode);
                navigate(v === 'admin' ? 'portafolio' : 'inicio');
                setForm(null);
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Ver actividad local"
              onClick={() => navigate('notificaciones')}
            >
              <Bell size={18} />
            </Button>
            <span className="avatar">{mode === 'admin' ? 'CC' : 'AP'}</span>
          </div>
        </header>
        <div className="content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">
                {mode === 'client'
                  ? 'TU RUTA DE ESCALAMIENTO'
                  : 'VISIBILIDAD · EJECUCIÓN · RESULTADOS'}
              </p>
              <h1>{allTitles[page]}</h1>
              <p className="muted">
                {page === 'inicio'
                  ? 'Tu siguiente paso está claro. Enfócate en lo que mueve tu negocio.'
                  : mode === 'admin'
                    ? 'Decisiones con contexto. Acompañamiento con intención.'
                    : org.name + ' · ' + plan.name + ' · Semana ' + org.current}
              </p>
            </div>
            {page === 'inicio' && (
              <Button onClick={() => openWeek(org.current)}>
                Continuar mi semana <ArrowRight />
              </Button>
            )}
          </div>
          <div className="demo-notice">
            <span className="demo-dot" /> DEMO · Datos ficticios, guardados solo
            en este navegador. El selector de vistas no es autenticación. No
            ingreses datos reales.
          </div>
          {storageError && (
            <p className="error" role="alert">
              {storageError}
            </p>
          )}
          {body}
          <footer>
            CONTROL OS{' '}
            <span>
              Escalamiento con Control · Prototipo basado en especificación v1.0
            </span>
            <span>America/Lima · PEN</span>
          </footer>
        </div>
      </main>
      <FormDialog
        key={form?.title + JSON.stringify(form?.command)}
        form={form}
        onClose={() => setForm(null)}
        onSave={(c) => {
          if (c.type === 'score') {
            const raw = c as Command & Record<string, unknown>;
            c.values = dimensions.map((_, i) => Number(raw['dimension' + i]));
          }
          return act(c);
        }}
      />
      <Dialog
        open={!!selectedTask}
        onOpenChange={(open) => {
          if (!open) setTaskId(null);
        }}
      >
        <DialogContent className="control-dialog task-dialog">
          <DialogTitle>{selectedTask?.title}</DialogTitle>
          <DialogDescription>
            Semana {selectedTask?.week} · {org.person} · Evidencia de texto. Los
            archivos privados no están implementados.
          </DialogDescription>
          {selectedTask && (
            <>
              <Badge value={selectedTask.status} />
              {selectedTask.blocker && (
                <p className="error">Bloqueo: {selectedTask.blocker}</p>
              )}
              <div className="evidence-history">
                {selectedTask.evidence.length ? (
                  selectedTask.evidence.map((e, i) => (
                    <div className="evidence" key={e.id}>
                      <div className="section-top">
                        <strong>Versión {i + 1}</strong>
                        <Badge value={e.status} />
                      </div>
                      <p>{e.text}</p>
                      {e.feedback && <p className="feedback">{e.feedback}</p>}
                      <small className="muted">{displayDate(e.at)}</small>
                    </div>
                  ))
                ) : (
                  <p className="muted">
                    Aún no se envió evidencia para esta tarea.
                  </p>
                )}
              </div>
              {selectedTask.status !== 'DONE' && (
                <div className="inline-actions">
                  {mode === 'client' ? (
                    <>
                      <Button
                        onClick={() => {
                          setTaskId(null);
                          setForm({
                            title: 'Enviar evidencia',
                            description:
                              'Describe el entregable y su fuente. Mínimo 10 caracteres. No ingreses datos confidenciales.',
                            command: {
                              type: 'submit',
                              taskId: selectedTask.id,
                            },
                            fields: [
                              {
                                key: 'text',
                                label: 'Evidencia / referencia verificable',
                                type: 'textarea',
                              },
                            ],
                            button: 'Enviar a revisión',
                          });
                        }}
                      >
                        Enviar evidencia
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setTaskId(null);
                          setForm({
                            title: 'Declarar bloqueo',
                            description:
                              'Explica qué necesitas para continuar.',
                            command: { type: 'block', taskId: selectedTask.id },
                            fields: [
                              {
                                key: 'text',
                                label: 'Motivo del bloqueo',
                                type: 'textarea',
                              },
                            ],
                          });
                        }}
                      >
                        Necesito ayuda
                      </Button>
                    </>
                  ) : selectedTask.status === 'REVIEW' ? (
                    <>
                      <Button
                        onClick={() => {
                          setTaskId(null);
                          setForm({
                            title: 'Aceptar evidencia',
                            description:
                              'Esta validación queda registrada en el histórico local.',
                            command: {
                              type: 'reviewTask',
                              taskId: selectedTask.id,
                              checked: true,
                            },
                            fields: [
                              {
                                key: 'text',
                                label: 'Comentario de revisión',
                                type: 'textarea',
                                value:
                                  'Evidencia de demostración revisada y aceptada.',
                              },
                            ],
                          });
                        }}
                      >
                        Aceptar evidencia
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setTaskId(null);
                          setForm({
                            title: 'Solicitar corrección',
                            description:
                              'La evidencia original se conserva. El cliente podrá enviar otra versión.',
                            command: {
                              type: 'reviewTask',
                              taskId: selectedTask.id,
                              checked: false,
                            },
                            fields: [
                              {
                                key: 'text',
                                label: 'Corrección requerida',
                                type: 'textarea',
                              },
                            ],
                          });
                        }}
                      >
                        Pedir cambios
                      </Button>
                    </>
                  ) : (
                    <p className="muted">
                      El cliente aún no envió evidencia para revisar.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={resource !== null}
        onOpenChange={(open) => {
          if (!open) setResource(null);
        }}
      >
        <DialogContent className="control-dialog">
          <DialogTitle>Plantilla de trabajo · v1.0</DialogTitle>
          <DialogDescription>
            Ejemplo editable fuera de la plataforma. Descarga CSV UTF-8.
          </DialogDescription>
          {resource !== null && (
            <>
              <p>
                {
                  [
                    'Fecha, Actividad, Horas, Delegable, Observación',
                    'Período, Ingresos, Costos directos, Gastos, Utilidad',
                    'Proceso, Propósito, Owner, Pasos, SLA, KPI, Criterio de salida',
                    'Responsabilidad, Owner, Límites, Indicador, Revisión',
                    'Objetivo, Baseline, Meta, Owner, Fecha, Revisión',
                  ][resource]
                }
              </p>
              <Button
                onClick={() =>
                  download(
                    'control-os-plantilla-' + (resource + 1) + '.csv',
                    '\uFEFF' +
                      [
                        'Fecha;Actividad;Horas;Delegable;Observacion',
                        'Periodo;Ingresos;Costos directos;Gastos;Utilidad',
                        'Proceso;Proposito;Owner;Pasos;SLA;KPI;Criterio de salida',
                        'Responsabilidad;Owner;Limites;Indicador;Revision',
                        'Objetivo;Baseline;Meta;Owner;Fecha;Revision',
                      ][resource] +
                      '\r\n',
                    'text/csv;charset=utf-8',
                  )
                }
              >
                <Download /> Descargar plantilla
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
      {notice && (
        <output className="toast">
          <CheckSquare size={18} />
          <span>{notice}</span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Cerrar aviso"
            onClick={() => setNotice('')}
          >
            ×
          </Button>
        </output>
      )}
    </div>
  );
}
