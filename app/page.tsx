'use client';
import Image from 'next/image';
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
  FileSpreadsheet,
  FileText,
  Flag,
  FolderPlus,
  LayoutDashboard,
  LockKeyhole,
  MessageSquare,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Route,
  Search,
  Settings,
  ShieldCheck,
  Target,
  Trash2,
  UserPlus,
  Users,
  WalletCards,
  X,
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
  lessonAvailable,
  lessonMetrics,
  lessonsFor,
  programProgress,
  progress,
  requirements,
  seed,
  stages,
  statusLabels,
  weeks,
  type Command,
  type Attachment,
  type Mode,
  type Lesson,
  type LessonRun,
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
  accept?: string;
  multiple?: boolean;
  required?: boolean;
  hint?: string;
  createOrganization?: boolean;
  showForNewOrganization?: boolean;
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
  { id: 'onboarding', label: 'Etapa 00', icon: BookOpen },
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
  { id: 'clases', label: 'Clases', icon: BookOpen },
  { id: 'modulos', label: 'Módulos', icon: FolderPlus },
  { id: 'finanzas', label: 'Finanzas', icon: WalletCards },
  { id: 'planes', label: 'Planes y accesos', icon: ShieldCheck },
  { id: 'configuracion', label: 'Configuración', icon: Settings },
];
const fileKind = (name: string): Attachment['type'] => {
  const extension = name.split('.').pop()?.toLowerCase();
  if (extension === 'pdf') return 'PDF';
  if (extension === 'doc' || extension === 'docx') return 'WORD';
  return 'EXCEL';
};
const fileSize = (bytes: number) =>
  bytes < 1048576
    ? Math.max(1, Math.round(bytes / 1024)) + ' KB'
    : (bytes / 1048576).toFixed(1) + ' MB';
const youtubeEmbedUrl = (value: string) => {
  if (!value) return '';
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, '');
    const id =
      host === 'youtu.be'
        ? url.pathname.slice(1).split('/')[0]
        : host === 'youtube.com' || host === 'm.youtube.com'
          ? url.pathname.startsWith('/embed/')
            ? url.pathname.split('/')[2]
            : url.pathname.startsWith('/shorts/')
              ? url.pathname.split('/')[2]
              : url.searchParams.get('v') || ''
          : '';
    return /^[A-Za-z0-9_-]{6,20}$/.test(id)
      ? 'https://www.youtube-nocookie.com/embed/' + id + '?rel=0'
      : '';
  } catch {
    return '';
  }
};
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
function FileChips({ files }: { files: Attachment[] }) {
  if (!files.length) return null;
  return (
    <div className="file-chips">
      {files.map((file) => (
        <span key={file.id} title={file.name}>
          {file.type === 'EXCEL' ? (
            <FileSpreadsheet size={15} />
          ) : (
            <FileText size={15} />
          )}
          <b>{file.name}</b>
          <small>
            {file.type} · {fileSize(file.size)}
          </small>
        </span>
      ))}
    </div>
  );
}
function AuthScreen({
  onEnter,
}: {
  onEnter: (username: string, action: 'login' | 'signup') => string;
}) {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState('');
  return (
    <main className="auth-shell">
      <section className="auth-brand-panel">
        <div className="auth-brand">
          <Image
            src="/crisdal-agency.png"
            alt="Crisdal Agency"
            width={190}
            height={190}
            priority
          />
          <span>
            CONTROL <b>OS</b>
          </span>
        </div>
        <div>
          <p className="eyebrow">ESCALAMIENTO CON CONTROL</p>
          <h1>Todo el acompañamiento, en un solo lugar.</h1>
          <p>
            Avances, evidencias, finanzas y decisiones con una ruta clara para
            cada cliente.
          </p>
        </div>
        <small>Plataforma de implementación para clientes y equipo</small>
      </section>
      <section className="auth-card">
        <div className="auth-tabs" role="tablist" aria-label="Tipo de acceso">
          <button
            role="tab"
            aria-selected={tab === 'login'}
            onClick={() => {
              setTab('login');
              setError('');
            }}
          >
            Iniciar sesión
          </button>
          <button
            role="tab"
            aria-selected={tab === 'signup'}
            onClick={() => {
              setTab('signup');
              setError('');
            }}
          >
            Crear cuenta
          </button>
        </div>
        <div>
          <p className="eyebrow">CONTROL OS</p>
          <h2>
            {tab === 'login' ? 'Bienvenido de vuelta' : 'Comienza tu espacio'}
          </h2>
          <p className="muted">
            {tab === 'login'
              ? 'Ingresa con la cuenta asignada por tu administrador.'
              : 'Registra tus datos para comenzar el proceso de acceso.'}
          </p>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const rawUsername = data.get('username');
            const rawPassword = data.get('password');
            const username =
              typeof rawUsername === 'string' ? rawUsername.trim() : '';
            const password = typeof rawPassword === 'string' ? rawPassword : '';
            if (
              !/^[a-zA-Z0-9._-]{3,40}$/.test(username) ||
              password.length < 8
            ) {
              setError(
                'Usa un identificador válido y una contraseña de al menos 8 caracteres.',
              );
              return;
            }
            const accessError = onEnter(username.toLowerCase(), tab);
            if (accessError) {
              setError(accessError);
              return;
            }
            try {
              sessionStorage.setItem('control-os-demo-session', 'true');
            } catch {}
          }}
        >
          {tab === 'signup' && (
            <label className="field" htmlFor="auth-name">
              <span>Nombre completo</span>
              <Input
                id="auth-name"
                name="name"
                required
                placeholder="Tu nombre"
              />
            </label>
          )}
          {tab === 'signup' && (
            <label className="field" htmlFor="auth-company">
              <span>Empresa</span>
              <Input
                id="auth-company"
                name="company"
                required
                placeholder="Nombre de la empresa"
              />
            </label>
          )}
          <label className="field" htmlFor="auth-username">
            <span>Usuario</span>
            <Input
              id="auth-username"
              name="username"
              type="text"
              required
              autoComplete="username"
              minLength={3}
              maxLength={40}
              pattern="[A-Za-z0-9._-]+"
              placeholder="DNI, RUC o usuario asignado"
            />
          </label>
          <label className="field" htmlFor="auth-password">
            <span>Contraseña</span>
            <Input
              id="auth-password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete={
                tab === 'login' ? 'current-password' : 'new-password'
              }
              placeholder="8 caracteres o más"
            />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <Button className="full" type="submit">
            {tab === 'login' ? 'Ingresar' : 'Crear cuenta'} <ArrowRight />
          </Button>
        </form>
        <p className="caption">
          Acceso personal · no compartas tus credenciales.
        </p>
      </section>
    </main>
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
  const [creatingOrganization, setCreatingOrganization] = useState(false);
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
              let fileError = '';
              form.fields.forEach((f) => {
                if (f.type === 'file') {
                  const selected = data
                    .getAll(f.key)
                    .filter(
                      (item): item is File =>
                        item instanceof File && item.size > 0,
                    );
                  if (selected.some((item) => item.size > 15 * 1024 * 1024)) {
                    fileError = 'Cada archivo debe pesar como máximo 15 MB.';
                    return;
                  }
                  c.files = selected.map((item) => ({
                    id: crypto.randomUUID(),
                    name: item.name,
                    size: item.size,
                    type: fileKind(item.name),
                  }));
                  return;
                }
                const raw = data.get(f.key);
                (c as Record<string, unknown>)[f.key] =
                  f.type === 'number'
                    ? Number(raw)
                    : typeof raw === 'string'
                      ? raw
                      : '';
              });
              if (fileError) {
                setError(fileError);
                return;
              }
              if (onSave(c)) onClose();
              else
                setError(
                  'Verifica los datos. El detalle del error aparece en el aviso inferior.',
                );
            }}
          >
            {form.fields.map((f) => {
              if (f.showForNewOrganization && !creatingOrganization)
                return null;
              const control =
                f.type === 'file' ? (
                  <>
                    <Input
                      name={f.key}
                      type="file"
                      accept={f.accept}
                      multiple={f.multiple}
                      required={f.required}
                    />
                    <small>
                      {f.hint ||
                        'PDF, Word o Excel · máximo 15 MB por archivo.'}
                    </small>
                  </>
                ) : f.type === 'textarea' ? (
                  <Textarea
                    name={f.key}
                    defaultValue={f.value}
                    required
                    maxLength={10000}
                  />
                ) : f.options ? (
                  <select
                    name={f.key}
                    defaultValue={f.value}
                    disabled={f.createOrganization && creatingOrganization}
                    required={f.required !== false}
                  >
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
                    required={f.required !== false}
                    maxLength={500}
                  />
                );
              if (f.createOrganization)
                return (
                  <div className="field" key={f.key}>
                    <span>{f.label}</span>
                    <div className="select-with-action">
                      {control}
                      <Button
                        type="button"
                        variant="outline"
                        aria-expanded={creatingOrganization}
                        onClick={() =>
                          setCreatingOrganization((current) => !current)
                        }
                      >
                        <Plus size={16} />
                        {creatingOrganization
                          ? 'Usar existente'
                          : 'Nueva empresa'}
                      </Button>
                    </div>
                  </div>
                );
              return (
                <label className="field" key={f.key}>
                  <span>{f.label}</span>
                  {control}
                  {f.hint && f.type !== 'file' && <small>{f.hint}</small>}
                </label>
              );
            })}
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
  const [sessionActive, setSessionActive] = useState<boolean | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
        setSidebarCollapsed(
          localStorage.getItem('control-os-sidebar-collapsed') === 'true',
        );
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
            const freshOrg = s.orgs.find((item) => item.id === o.id)!;
            o.finances = Array.isArray(o.finances)
              ? o.finances
              : freshOrg.finances;
            o.followUps = Array.isArray(o.followUps)
              ? o.followUps
              : freshOrg.followUps;
            o.lessonRuns = Array.isArray(o.lessonRuns)
              ? o.lessonRuns
              : freshOrg.lessonRuns;
            o.lessonRuns.forEach((run) => {
              const legacyRun = run as LessonRun & { playback?: number };
              if (typeof legacyRun.videoCompleted !== 'boolean')
                legacyRun.videoCompleted = (legacyRun.playback || 0) >= 90;
              delete legacyRun.playback;
            });
            o.events.forEach((event) => {
              if (event.text.includes('Workspace de demostración'))
                event.text = 'Espacio de trabajo activado.';
            });
            o.finances.forEach((entry) => {
              if (entry.note.includes('ficticio'))
                entry.note = 'Movimiento inicial registrado';
            });
            o.followUps.forEach((follow) => {
              if (follow.owner === 'Consultor demo')
                follow.owner = 'Consultor asignado';
            });
            o.tasks.forEach((task) =>
              task.evidence.forEach((evidence) => {
                evidence.files = Array.isArray(evidence.files)
                  ? evidence.files
                  : [];
              }),
            );
            o.goals.forEach((goal) => {
              const legacyGoal = goal as Org['goals'][number] & {
                current?: number;
              };
              if (!Array.isArray(legacyGoal.checkpoints)) {
                const rawProgress =
                  legacyGoal.current === undefined ||
                  legacyGoal.target === legacyGoal.baseline
                    ? 0
                    : Math.max(
                        0,
                        Math.min(
                          1,
                          (legacyGoal.current - legacyGoal.baseline) /
                            (legacyGoal.target - legacyGoal.baseline),
                        ),
                      );
                const completed = Math.round(rawProgress * 3);
                legacyGoal.checkpoints = [
                  'Validar la línea base',
                  'Completar la acción prioritaria',
                  'Validar el resultado con evidencia',
                ].map((title, index) => ({
                  id: goal.id + '-checkpoint-' + index,
                  title,
                  completed: index < completed,
                }));
              }
              delete legacyGoal.current;
            });
          });
          candidate.modules = Array.isArray(candidate.modules)
            ? candidate.modules
            : s.modules;
          candidate.users = Array.isArray(candidate.users)
            ? candidate.users
            : s.users;
          candidate.lessons = Array.isArray(candidate.lessons)
            ? candidate.lessons
            : s.lessons;
          const primaryAdmin = candidate.users.find(
            (user: State['users'][number]) => user.id === 'user-admin',
          );
          if (primaryAdmin) {
            primaryAdmin.name = 'Administrador Crisdal';
            primaryAdmin.username = 'admin';
            primaryAdmin.role = 'ADMIN';
            primaryAdmin.status = 'ACTIVO';
          }
          const defaultUsernames: Record<string, string> = {
            'user-admin': 'admin',
            'user-norte': 'cliente.norte',
            'user-orbita': 'cliente.orbita',
            'user-consultor': 'consultor.control',
          };
          candidate.users.forEach((user: State['users'][number]) => {
            const legacyUser = user as State['users'][number] & {
              email?: string;
            };
            if (!legacyUser.username)
              legacyUser.username =
                defaultUsernames[user.id] ||
                legacyUser.email?.split('@')[0].toLowerCase() ||
                'usuario.' + user.id.slice(0, 8).toLowerCase();
            delete legacyUser.email;
          });
          candidate.plans.forEach((savedPlan: State['plans'][number]) => {
            savedPlan.name =
              savedPlan.name === 'CONTROL Diagnóstico'
                ? 'CONTROL Score'
                : savedPlan.name === 'CONTROL Implementación'
                  ? 'CONTROL 90'
                  : savedPlan.name === 'CONTROL Partnership'
                    ? 'CONTROL Partner'
                    : savedPlan.name;
          });
          s = candidate;
          getOrg(s, s.selected);
        }
      } catch {
        setStorageError(
          'No se pudo recuperar la sesión anterior; se inició un espacio nuevo.',
        );
      }
      stateRef.current = s;
      setState(s);
      setWeek(getOrg(s, s.selected).current);
      try {
        setSessionActive(
          sessionStorage.getItem('control-os-demo-session') === 'true',
        );
      } catch {
        setSessionActive(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!mobileNavOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileNavOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileNavOpen]);
  const persist = (s: State) => {
    stateRef.current = s;
    setState(s);
    try {
      localStorage.setItem(STORAGE, JSON.stringify(s));
    } catch {
      setStorageError(
        'Los cambios están en memoria, pero el navegador no permitió guardarlos. Exporta los datos para conservarlos.',
      );
    }
  };
  const act = (c: Command) => {
    try {
      const current = stateRef.current;
      if (!current) throw Error('Espera a que cargue CONTROL OS.');
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
    setMobileNavOpen(false);
  };
  const toggleSidebar = () => {
    setSidebarCollapsed((collapsed) => {
      const next = !collapsed;
      try {
        localStorage.setItem('control-os-sidebar-collapsed', String(next));
      } catch {}
      return next;
    });
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
              'Abre una semana de CONTROL OS; no envía evidencia ni cambia progreso.',
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
              if (!s) throw Error('CONTROL OS no ha terminado de cargar');
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
  if (!state || sessionActive === null)
    return (
      <output className="loading">Preparando tu espacio de CONTROL OS…</output>
    );
  if (!sessionActive)
    return (
      <AuthScreen
        onEnter={(username, action) => {
          if (action === 'login') {
            const account = state.users.find(
              (user) => user.username.toLowerCase() === username,
            );
            if (!account) return 'La cuenta no está registrada.';
            if (account.status === 'SUSPENDIDO')
              return 'Esta cuenta está suspendida. Contacta al administrador.';
            const nextMode: Mode =
              account.role === 'CLIENTE' ? 'client' : 'admin';
            setMode(nextMode);
            setPage(nextMode === 'admin' ? 'portafolio' : 'inicio');
          } else {
            setMode('client');
            setPage('inicio');
          }
          setSessionActive(true);
          setNotice(
            action === 'login' ? 'Sesión iniciada.' : 'Cuenta registrada.',
          );
          return '';
        }}
      />
    );
  const org = getOrg(state, state.selected);
  const plan = getPlan(state, org);
  const h = health(state, org);
  const currentRun = org.weeks[org.current - 1];
  const selectedTask = org.tasks.find((t) => t.id === taskId);
  const implementationLessons = lessonsFor(state, org);
  const implementationMetrics = lessonMetrics(state, org);
  const implementationGaps = state.orgs.filter((item) => {
    const metrics = lessonMetrics(state, item);
    return metrics.learning >= 50 && metrics.execution + 30 < metrics.learning;
  });
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
          value: 'Registro manual',
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
        { key: 'owner', label: 'Responsable', value: 'Consultor asignado' },
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
              goalProgress(g) === 100
                ? 'Meta alcanzada'
                : g.checkpoints.filter((checkpoint) => checkpoint.completed)
                    .length +
                  ' de ' +
                  g.checkpoints.length +
                  ' checkpoints'
            }
            color={goalProgress(g) === 100 ? '' : 'blue'}
          />
          <div className="goal-numbers">
            <strong>
              {g.baseline} <small>{g.unit}</small>
            </strong>
            <ArrowRight size={18} />
            <span>
              {g.target} {g.unit}
              <small>Meta · {displayDate(g.due)}</small>
            </span>
          </div>
          <Meter label="Checkpoints completados" value={goalProgress(g)} />
          <div className="goal-checkpoints">
            {g.checkpoints.map((checkpoint) => (
              <div className="goal-checkpoint" key={checkpoint.id}>
                <Checkbox
                  aria-label={'Marcar checkpoint: ' + checkpoint.title}
                  checked={checkpoint.completed}
                  onCheckedChange={(checked) =>
                    act({
                      type: 'goalCheckpoint',
                      targetId: g.id,
                      code: checkpoint.id,
                      checked: checked === true,
                    })
                  }
                />
                <span>{checkpoint.title}</span>
              </div>
            ))}
          </div>
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
                {e.actor === 'admin' ? 'Equipo CONTROL' : 'Cliente'}
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
          <small>America/Lima · sesión de acompañamiento</small>
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
          {org.session.attended ? 'Retirar asistencia' : 'Registrar asistencia'}
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
                    'Se conserva la evidencia original y el cliente recibe esta observación.',
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
          Gate híbrido: validación de mínimos + revisión humana. No evalúa
          automáticamente la calidad de los datos.
        </p>
      </Section>
    );
  };
  const allTitles: Record<string, string> = {
    inicio: 'Menos ruido. Más control.',
    onboarding: 'Etapa 00 · Onboarding y bienvenida',
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
    clases: 'Aprender, aplicar, entregar y avanzar',
    planes: 'Acceso claro. Alcance definido.',
    modulos: 'Contenido que acompaña la ejecución',
    finanzas: 'Rentabilidad por cliente, sin perder contexto',
    configuracion: 'Configuración y gobierno',
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
  else if (page === 'onboarding')
    body = (
      <>
        <div className="implementation-metrics">
          <Section title="Aprendizaje">
            <div className="big-number">{implementationMetrics.learning}%</div>
            <Meter
              label="Contenido consumido"
              value={implementationMetrics.learning}
            />
          </Section>
          <Section title="Ejecución">
            <div className="big-number">{implementationMetrics.execution}%</div>
            <Meter
              label="Actividades entregadas"
              value={implementationMetrics.execution}
            />
          </Section>
          <Section title="Validación">
            <div className="big-number">
              {implementationMetrics.validation}%
            </div>
            <Meter
              label="Entregables aprobados"
              value={implementationMetrics.validation}
            />
          </Section>
        </div>
        <div className="method-rule">
          <ShieldCheck size={22} />
          <div>
            <strong>Dos checkpoints para completar cada clase.</strong>
            <span>
              Clase vista + actividad completada + validación cuando
              corresponda.
            </span>
          </div>
        </div>
        <div className="lesson-grid">
          {implementationLessons.map((lesson) => {
            const run = org.lessonRuns.find(
              (item) => item.lessonId === lesson.id,
            )!;
            const unlocked = lessonAvailable(state, org, lesson.id);
            const complete = run?.videoCompleted && run.status === 'APROBADO';
            const youtubeUrl = youtubeEmbedUrl(lesson.videoUrl);
            const activityCompleted = [
              'ENVIADO',
              'EN_REVISION',
              'APROBADO',
            ].includes(run.status);
            return (
              <Section
                key={lesson.id}
                title={lesson.code + ' · ' + lesson.title}
                action={
                  <Badge
                    value={complete ? 'APROBADO' : run?.status || 'NO_INICIADO'}
                    color={!unlocked ? 'gray' : undefined}
                  />
                }
              >
                {!unlocked ? (
                  <div className="video-placeholder locked">
                    <LockKeyhole size={30} />
                    <span>Completa la clase anterior para desbloquear</span>
                  </div>
                ) : youtubeUrl ? (
                  <div className="video-player">
                    <iframe
                      src={youtubeUrl}
                      title={lesson.title}
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : lesson.videoUrl ? (
                  <div className="video-placeholder pending">
                    <BookOpen size={30} />
                    <span>El enlace debe ser un video válido de YouTube</span>
                  </div>
                ) : (
                  <div className="video-placeholder pending">
                    <BookOpen size={30} />
                    <span>Video pendiente de publicación</span>
                  </div>
                )}
                <p>{lesson.description}</p>
                <div className="lesson-structure">
                  <div>
                    <small>QUÉ APRENDERÁS</small>
                    <p>{lesson.learnings.join(' · ')}</p>
                  </div>
                  <div>
                    <small>QUÉ DEBES HACER</small>
                    <p>{lesson.action}</p>
                  </div>
                  <div>
                    <small>ENTREGABLE</small>
                    <p>{lesson.deliverable}</p>
                  </div>
                </div>
                {run?.feedback && (
                  <p className="feedback">Feedback: {run.feedback}</p>
                )}
                <div className="lesson-checkpoints">
                  <div className="checkpoint-row">
                    <Checkbox
                      aria-label="Marcar clase como vista"
                      checked={run.videoCompleted}
                      disabled={!unlocked || !youtubeUrl || activityCompleted}
                      onCheckedChange={(checked) =>
                        act({
                          type: 'watchLesson',
                          targetId: lesson.id,
                          checked: checked === true,
                        })
                      }
                    />
                    <span>
                      <strong>Clase vista</strong>
                      <small>Marca este checkpoint al terminar el video.</small>
                    </span>
                  </div>
                  <div className="checkpoint-row">
                    <Checkbox
                      aria-label="Marcar actividad como completada"
                      checked={activityCompleted}
                      disabled={
                        !unlocked || !run.videoCompleted || activityCompleted
                      }
                      onCheckedChange={(checked) => {
                        if (checked !== true) return;
                        setForm({
                          title: 'Entregar actividad',
                          description:
                            lesson.deliverable +
                            ' · La evidencia queda vinculada a esta clase.',
                          command: {
                            type: 'submitLesson',
                            targetId: lesson.id,
                          },
                          fields: [
                            {
                              key: 'text',
                              label: 'Respuesta, evidencia o URL',
                              type: 'textarea',
                              value: run.response,
                            },
                          ],
                          button: lesson.requiresReview
                            ? 'Enviar a revisión'
                            : 'Completar actividad',
                        });
                      }}
                    />
                    <span>
                      <strong>Actividad completada</strong>
                      <small>
                        Marca para registrar la respuesta o evidencia.
                      </small>
                    </span>
                  </div>
                </div>
                <p className="caption">
                  Cierre: clase vista + actividad completada
                  {lesson.requiresReview ? ' + aprobación del equipo' : ''}.
                  Vence {displayDate(run?.due || lesson.due)}.
                </p>
              </Section>
            );
          })}
        </div>
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
                    Los videos y materiales se administran desde el módulo de
                    Clases y se publican según plan y avance.
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
                      {n.shared ? 'Compartida con consultor' : 'Solo yo'}
                    </small>
                  </p>
                ))}
                <div className="inline-actions">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setForm({
                        title: 'Nota personal',
                        description: 'Define quién puede consultar esta nota.',
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
                          'Visible en Cliente 360 para el equipo asignado.',
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
            Horizonte mensual y 90 días · avance por checkpoints
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
                    key: 'checkpoint1',
                    label: 'Checkpoint 1',
                    value: 'Validar la línea base',
                  },
                  {
                    key: 'checkpoint2',
                    label: 'Checkpoint 2',
                    value: 'Completar la acción prioritaria',
                  },
                  {
                    key: 'checkpoint3',
                    label: 'Checkpoint 3',
                    value: 'Validar el resultado con evidencia',
                  },
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
          <p className="muted">Moneda PEN · fuente y validación explícitas</p>
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
          equipo responsable.
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
                  {w.feedback || 'Validación registrada por el equipo.'}
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
        {state.modules
          .filter(
            (module) =>
              module.week <= org.current &&
              (module.planId === 'all' || module.planId === org.planId),
          )
          .map((module) => (
            <Section
              title={module.title}
              key={module.id}
              className="module-feature"
            >
              <div className="section-top">
                <p className="muted">
                  Semana {module.week} · material asignado por el equipo
                </p>
                <Badge value="Disponible" color="blue" />
              </div>
              <p>{module.description}</p>
              <FileChips files={module.files} />
              <p className="caption">
                El acceso al archivo se habilita mediante almacenamiento
                privado.
              </p>
            </Section>
          ))}
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
                  'Tu consulta aparecerá en Cliente 360 para el equipo asignado.',
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
  else if (page === 'clases')
    body = (
      <>
        <div className="toolbar">
          <p className="muted">
            Cada clase exige una acción y un criterio de cierre. Añade un enlace
            de YouTube para reproducirlo dentro de CONTROL OS sin cargar el
            servidor.
          </p>
          <Button
            onClick={() =>
              setForm({
                title: 'Crear clase de implementación',
                description:
                  'La clase no puede publicarse sin acción, entregable y criterio de avance.',
                command: { type: 'createLesson' },
                fields: [
                  { key: 'title', label: 'Nombre de la clase' },
                  {
                    key: 'value',
                    label: 'Etapa',
                    value: 0,
                    options: [
                      { value: '0', label: 'Etapa 00 · Onboarding' },
                      ...stages.map((stage, index) => ({
                        value: String(index + 1),
                        label: 'Etapa ' + (index + 1) + ' · ' + stage,
                      })),
                    ],
                  },
                  {
                    key: 'week',
                    label: 'Semana (0 para onboarding)',
                    type: 'number',
                    min: 0,
                    max: 12,
                    value: 0,
                  },
                  {
                    key: 'planId',
                    label: 'Asignar a',
                    value: 'all',
                    options: [
                      { value: 'all', label: 'Todos los planes' },
                      ...state.plans.map((item) => ({
                        value: item.id,
                        label: item.name + ' v' + item.version,
                      })),
                      {
                        value: 'org:' + org.id,
                        label: 'Extraordinaria · solo ' + org.name,
                      },
                    ],
                  },
                  {
                    key: 'videoUrl',
                    label: 'Enlace de YouTube',
                    type: 'url',
                  },
                  {
                    key: 'thumbnailUrl',
                    label: 'URL HTTPS de miniatura (opcional)',
                    type: 'url',
                    required: false,
                  },
                  {
                    key: 'duration',
                    label: 'Duración (minutos)',
                    type: 'number',
                    min: 1,
                    max: 600,
                    value: 8,
                  },
                  {
                    key: 'description',
                    label: 'Descripción',
                    type: 'textarea',
                  },
                  {
                    key: 'objective',
                    label: 'Qué aprenderá',
                    type: 'textarea',
                  },
                  { key: 'action', label: 'Qué debe hacer', type: 'textarea' },
                  {
                    key: 'resourceType',
                    label: 'Tipo de recurso',
                    value: 'PLANTILLA',
                    options: [
                      'PDF',
                      'EXCEL',
                      'GOOGLE SHEET',
                      'DOCX',
                      'PLANTILLA',
                      'CHECKLIST',
                      'ENLACE',
                      'FORMULARIO',
                      'CALCULADORA',
                      'SOP',
                      'CANVAS',
                      'EJEMPLO',
                    ].map((value) => ({ value, label: value })),
                  },
                  {
                    key: 'deliverable',
                    label: 'Entregable obligatorio',
                    type: 'textarea',
                  },
                  {
                    key: 'due',
                    label: 'Fecha límite',
                    type: 'date',
                    value: today(),
                  },
                  {
                    key: 'points',
                    label: 'Puntos / logro',
                    type: 'number',
                    min: 0,
                    max: 1000,
                    value: 10,
                  },
                  {
                    key: 'requiresReview',
                    label: 'Requiere revisión',
                    value: 'yes',
                    options: [
                      { value: 'yes', label: 'Sí' },
                      { value: 'no', label: 'No' },
                    ],
                  },
                  {
                    key: 'requiredForUnlock',
                    label: 'Bloquea la siguiente clase',
                    value: 'yes',
                    options: [
                      { value: 'yes', label: 'Sí' },
                      { value: 'no', label: 'No' },
                    ],
                  },
                  {
                    key: 'publication',
                    label: 'Estado editorial',
                    value: 'BORRADOR',
                    options: [
                      { value: 'BORRADOR', label: 'Borrador' },
                      { value: 'PUBLICADO', label: 'Publicado' },
                    ],
                  },
                ],
                button: 'Crear clase',
              })
            }
          >
            <Plus /> Crear clase
          </Button>
        </div>
        <div className="implementation-metrics compact">
          <Section title="Aprendizaje">
            <div className="big-number">{implementationMetrics.learning}%</div>
            <small className="muted">Contenido consumido</small>
          </Section>
          <Section title="Ejecución">
            <div className="big-number">{implementationMetrics.execution}%</div>
            <small className="muted">Actividades entregadas</small>
          </Section>
          <Section title="Validación">
            <div className="big-number">
              {implementationMetrics.validation}%
            </div>
            <small className="muted">Entregables aprobados</small>
          </Section>
        </div>
        {implementationMetrics.learning >= 50 &&
          implementationMetrics.execution + 30 <
            implementationMetrics.learning && (
            <div className="implementation-alert">
              <Flag size={20} />
              <div>
                <strong>Consumo alto y ejecución baja · {org.name}</strong>
                <span>
                  {org.lessonRuns.filter((run) => run.videoCompleted).length}{' '}
                  clases vistas /{' '}
                  {
                    org.lessonRuns.filter((run) =>
                      ['ENVIADO', 'EN_REVISION', 'APROBADO'].includes(
                        run.status,
                      ),
                    ).length
                  }{' '}
                  actividades entregadas.
                </span>
              </div>
              <Button variant="outline" onClick={() => intervene()}>
                Intervenir
              </Button>
            </div>
          )}
        <div className="lesson-grid admin-lessons">
          {state.lessons
            .toSorted((a, b) => a.code.localeCompare(b.code))
            .map((lesson: Lesson) => {
              const run = org.lessonRuns.find(
                (item) => item.lessonId === lesson.id,
              );
              const assigned = Boolean(run);
              const unlocked =
                assigned && lessonAvailable(state, org, lesson.id);
              return (
                <Section
                  key={lesson.id}
                  title={lesson.code + ' · ' + lesson.title}
                  action={
                    <Badge
                      value={lesson.publication}
                      color={lesson.publication === 'BORRADOR' ? 'gray' : ''}
                    />
                  }
                >
                  <p>{lesson.description}</p>
                  <div className="class-meta">
                    <span>Etapa {String(lesson.stage).padStart(2, '0')}</span>
                    <span>Semana {lesson.week}</span>
                    <span>{lesson.duration} min</span>
                    <span>{lesson.points} pts</span>
                    <span>
                      {lesson.videoUrl
                        ? 'YouTube vinculado'
                        : 'Video pendiente'}
                    </span>
                  </div>
                  <div className="lesson-structure">
                    <div>
                      <small>ACCIÓN</small>
                      <p>{lesson.action}</p>
                    </div>
                    <div>
                      <small>ENTREGABLE</small>
                      <p>{lesson.deliverable}</p>
                    </div>
                    <div>
                      <small>CIERRE</small>
                      <p>
                        Clase vista + actividad
                        {lesson.requiresReview ? ' + revisión' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="section-top">
                    <span className="muted text-small">
                      {assigned
                        ? org.name + ' · vence ' + displayDate(run!.due)
                        : 'No asignada al cliente seleccionado'}
                    </span>
                    {assigned && (
                      <Badge
                        value={run!.status}
                        color={!unlocked ? 'gray' : undefined}
                      />
                    )}
                  </div>
                  {run && (
                    <div className="inline-actions checkpoint-summary">
                      <Badge
                        value={
                          run.videoCompleted ? 'Clase vista' : 'Clase pendiente'
                        }
                        color={run.videoCompleted ? undefined : 'gray'}
                      />
                      <Badge
                        value={
                          ['ENVIADO', 'EN_REVISION', 'APROBADO'].includes(
                            run.status,
                          )
                            ? 'Actividad completada'
                            : 'Actividad pendiente'
                        }
                        color={
                          ['ENVIADO', 'EN_REVISION', 'APROBADO'].includes(
                            run.status,
                          )
                            ? undefined
                            : 'gray'
                        }
                      />
                    </div>
                  )}
                  {run?.feedback && <p className="feedback">{run.feedback}</p>}
                  {run && (
                    <div className="inline-actions">
                      {!unlocked && (
                        <Button
                          variant="outline"
                          onClick={() =>
                            act({
                              type: 'lessonOverride',
                              targetId: lesson.id,
                              override: 'unlock',
                            })
                          }
                        >
                          Desbloquear
                        </Button>
                      )}
                      {!run.requirementSkipped && run.status !== 'APROBADO' && (
                        <Button
                          variant="ghost"
                          onClick={() =>
                            act({
                              type: 'lessonOverride',
                              targetId: lesson.id,
                              override: 'skip',
                            })
                          }
                        >
                          Saltar requisito
                        </Button>
                      )}
                      {['APROBADO', 'OBSERVADO'].includes(run.status) && (
                        <Button
                          variant="outline"
                          onClick={() =>
                            act({
                              type: 'lessonOverride',
                              targetId: lesson.id,
                              override: 'reopen',
                            })
                          }
                        >
                          Reabrir actividad
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        onClick={() =>
                          setForm({
                            title: 'Extender fecha límite',
                            description: lesson.title + ' · ' + org.name,
                            command: {
                              type: 'extendLesson',
                              targetId: lesson.id,
                            },
                            fields: [
                              {
                                key: 'due',
                                label: 'Nueva fecha límite',
                                type: 'date',
                                value: run.due,
                              },
                            ],
                          })
                        }
                      >
                        <CalendarDays size={16} /> Extender fecha
                      </Button>
                      {['ENVIADO', 'EN_REVISION'].includes(run.status) && (
                        <>
                          <Button
                            onClick={() =>
                              setForm({
                                title: 'Aprobar actividad',
                                description: run.response,
                                command: {
                                  type: 'reviewLesson',
                                  targetId: lesson.id,
                                  checked: true,
                                },
                                fields: [
                                  {
                                    key: 'text',
                                    label: 'Feedback y recomendación',
                                    type: 'textarea',
                                  },
                                ],
                                button: 'Aprobar',
                              })
                            }
                          >
                            Aprobar
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() =>
                              setForm({
                                title: 'Solicitar cambios',
                                description: run.response,
                                command: {
                                  type: 'reviewLesson',
                                  targetId: lesson.id,
                                  checked: false,
                                },
                                fields: [
                                  {
                                    key: 'text',
                                    label: 'Observación o corrección',
                                    type: 'textarea',
                                  },
                                ],
                                button: 'Solicitar cambios',
                              })
                            }
                          >
                            Observar
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </Section>
              );
            })}
        </div>
      </>
    );
  else if (page === 'modulos')
    body = (
      <>
        <div className="toolbar">
          <p className="muted">
            Organiza material por semana y plan. Los archivos se registran como
            metadatos y acceso según permisos.
          </p>
          <Button
            onClick={() =>
              setForm({
                title: 'Añadir módulo',
                description:
                  'Publica un recurso de apoyo con PDF, Word o Excel. La carga real requiere un bucket privado de Supabase Storage.',
                command: { type: 'createModule' },
                fields: [
                  { key: 'title', label: 'Nombre del módulo' },
                  {
                    key: 'description',
                    label: 'Objetivo y uso esperado',
                    type: 'textarea',
                  },
                  {
                    key: 'week',
                    label: 'Semana',
                    type: 'number',
                    min: 1,
                    max: 12,
                    value: org.current,
                  },
                  {
                    key: 'planId',
                    label: 'Disponible para',
                    value: 'all',
                    options: [
                      { value: 'all', label: 'Todos los planes' },
                      ...state.plans.map((item) => ({
                        value: item.id,
                        label: item.name + ' v' + item.version,
                      })),
                    ],
                  },
                  {
                    key: 'files',
                    label: 'Archivos adjuntos',
                    type: 'file',
                    accept: '.pdf,.doc,.docx,.xls,.xlsx',
                    multiple: true,
                    required: true,
                  },
                ],
                button: 'Publicar módulo',
              })
            }
          >
            <Plus /> Añadir módulo
          </Button>
        </div>
        <div className="cards-grid">
          {state.modules.map((module) => (
            <Section
              key={module.id}
              title={module.title}
              action={<Badge value={'Semana ' + module.week} color="gray" />}
            >
              <p>{module.description}</p>
              <p className="muted text-small">
                {module.planId === 'all'
                  ? 'Todos los planes'
                  : state.plans.find((item) => item.id === module.planId)?.name}
              </p>
              <FileChips files={module.files} />
              <div className="inline-actions spaced-small">
                <small className="muted">
                  Creado {displayDate(module.createdAt)}
                </small>
                {module.id !== 'module-w1' && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (window.confirm('¿Eliminar este módulo?'))
                        act({ type: 'deleteModule', targetId: module.id });
                    }}
                  >
                    <Trash2 size={16} /> Eliminar
                  </Button>
                )}
              </div>
            </Section>
          ))}
        </div>
      </>
    );
  else if (page === 'finanzas') {
    const portfolioIncome = state.orgs.reduce(
      (sum, item) =>
        sum +
        item.finances
          .filter(
            (entry) => entry.kind === 'INGRESO' && entry.status === 'PAGADO',
          )
          .reduce((acc, entry) => acc + entry.amount, 0),
      0,
    );
    const portfolioExpense = state.orgs.reduce(
      (sum, item) =>
        sum +
        item.finances
          .filter(
            (entry) => entry.kind === 'EGRESO' && entry.status === 'PAGADO',
          )
          .reduce((acc, entry) => acc + entry.amount, 0),
      0,
    );
    const pending = state.orgs.reduce(
      (sum, item) =>
        sum +
        item.finances
          .filter(
            (entry) => entry.kind === 'INGRESO' && entry.status !== 'PAGADO',
          )
          .reduce((acc, entry) => acc + entry.amount, 0),
      0,
    );
    body = (
      <>
        <div className="stats-grid">
          <Section title="Ingresos cobrados">
            <div className="finance-number">
              S/ {portfolioIncome.toLocaleString('es-PE')}
            </div>
            <small className="muted">Cartera activa</small>
          </Section>
          <Section title="Costo registrado">
            <div className="finance-number">
              S/ {portfolioExpense.toLocaleString('es-PE')}
            </div>
            <small className="muted">Movimientos pagados</small>
          </Section>
          <Section title="Margen de cartera">
            <div className="finance-number">
              {portfolioIncome
                ? Math.round(
                    ((portfolioIncome - portfolioExpense) / portfolioIncome) *
                      100,
                  )
                : 0}
              %
            </div>
            <small className="muted">Margen estimado</small>
          </Section>
          <Section title="Por cobrar">
            <div className="finance-number">
              S/ {pending.toLocaleString('es-PE')}
            </div>
            <small className="muted">Pendiente o vencido</small>
          </Section>
        </div>
        <Section title="Rentabilidad por cliente" className="spaced">
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  'Cliente',
                  'Cobrado',
                  'Costo',
                  'Contribución',
                  'Pendiente',
                ].map((label) => (
                  <TableHead key={label}>{label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.orgs.map((item) => {
                const income = item.finances
                  .filter(
                    (entry) =>
                      entry.kind === 'INGRESO' && entry.status === 'PAGADO',
                  )
                  .reduce((sum, entry) => sum + entry.amount, 0);
                const expense = item.finances
                  .filter(
                    (entry) =>
                      entry.kind === 'EGRESO' && entry.status === 'PAGADO',
                  )
                  .reduce((sum, entry) => sum + entry.amount, 0);
                const due = item.finances
                  .filter(
                    (entry) =>
                      entry.kind === 'INGRESO' && entry.status !== 'PAGADO',
                  )
                  .reduce((sum, entry) => sum + entry.amount, 0);
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <strong>{item.name}</strong>
                      <small>{item.person}</small>
                    </TableCell>
                    <TableCell>S/ {income.toLocaleString('es-PE')}</TableCell>
                    <TableCell>S/ {expense.toLocaleString('es-PE')}</TableCell>
                    <TableCell>
                      <Badge
                        value={
                          'S/ ' + (income - expense).toLocaleString('es-PE')
                        }
                        color={income - expense >= 0 ? '' : 'red'}
                      />
                    </TableCell>
                    <TableCell>S/ {due.toLocaleString('es-PE')}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Section>
        <Section
          title={'Movimientos · ' + org.name}
          className="spaced"
          action={
            <Button
              onClick={() =>
                setForm({
                  title: 'Registrar movimiento',
                  description:
                    'Control interno por cliente. No emite comprobantes ni procesa pagos.',
                  command: { type: 'finance' },
                  fields: [
                    {
                      key: 'kind',
                      label: 'Tipo',
                      value: 'INGRESO',
                      options: [
                        { value: 'INGRESO', label: 'Ingreso' },
                        { value: 'EGRESO', label: 'Egreso / costo' },
                      ],
                    },
                    { key: 'category', label: 'Categoría' },
                    {
                      key: 'amount',
                      label: 'Importe (PEN)',
                      type: 'number',
                      min: 0.01,
                    },
                    {
                      key: 'period',
                      label: 'Fecha',
                      type: 'date',
                      value: today(),
                    },
                    {
                      key: 'status',
                      label: 'Estado',
                      value: 'PAGADO',
                      options: ['PAGADO', 'PENDIENTE', 'VENCIDO'].map(
                        (value) => ({ value, label: statusLabels[value] }),
                      ),
                    },
                    {
                      key: 'note',
                      label: 'Concepto y referencia',
                      type: 'textarea',
                    },
                  ],
                  button: 'Registrar movimiento',
                })
              }
            >
              <Plus /> Movimiento
            </Button>
          }
        >
          {org.finances.map((entry) => (
            <div className="task-row" key={entry.id}>
              <span className={'finance-icon ' + entry.kind.toLowerCase()}>
                {entry.kind === 'INGRESO' ? '+' : '−'}
              </span>
              <div className="task-title">
                <strong>{entry.category}</strong>
                <small>
                  {displayDate(entry.date)} · {entry.note}
                </small>
              </div>
              <strong>
                {entry.kind === 'EGRESO' ? '−' : '+'} S/{' '}
                {entry.amount.toLocaleString('es-PE')}
              </strong>
              <Badge value={entry.status} />
            </div>
          ))}
        </Section>
      </>
    );
  } else if (page === 'portafolio') {
    const clients = state.orgs.filter(
      (o) =>
        o.name.toLowerCase().includes(query.toLowerCase()) &&
        (filter === 'all' || health(state, o).label === filter),
    );
    body = (
      <>
        <div className="stats-grid">
          <Section title="Clientes activos">
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
        <Section title="Brechas de implementación" className="spaced">
          {implementationGaps.length ? (
            implementationGaps.map((item) => {
              const metrics = lessonMetrics(state, item);
              const viewed = item.lessonRuns.filter(
                (run) => run.videoCompleted,
              ).length;
              const delivered = item.lessonRuns.filter((run) =>
                ['ENVIADO', 'EN_REVISION', 'APROBADO'].includes(run.status),
              ).length;
              return (
                <div
                  className="implementation-alert compact-alert"
                  key={item.id}
                >
                  <Flag size={19} />
                  <div>
                    <strong>{item.name} · consumo alto, ejecución baja</strong>
                    <span>
                      {viewed} clases vistas / {delivered} actividades
                      entregadas · aprendizaje {metrics.learning}% / ejecución{' '}
                      {metrics.execution}%.
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      switchOrg(item.id);
                      navigate('clases');
                    }}
                  >
                    Revisar clases
                  </Button>
                </div>
              );
            })
          ) : (
            <p className="muted">
              No hay brechas críticas entre consumo y ejecución.
            </p>
          )}
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
        <div className="tracking-strip" aria-label="Resumen de seguimiento">
          <div>
            <small>Ruta</small>
            <strong>
              Semana {org.current} de {plan.stages.length * 3}
            </strong>
            <span>{programProgress(state, org)}% aprobado</span>
          </div>
          <div>
            <small>Aprendizaje</small>
            <strong>{implementationMetrics.learning}%</strong>
            <span>contenido consumido</span>
          </div>
          <div>
            <small>Implementación</small>
            <strong>{implementationMetrics.execution}%</strong>
            <span>actividades entregadas</span>
          </div>
          <div>
            <small>Validación</small>
            <strong>{implementationMetrics.validation}%</strong>
            <span>entregables aprobados</span>
          </div>
          <div>
            <small>Ejecución semanal</small>
            <strong>{execution(org)}%</strong>
            <span>
              {
                org.tasks.filter(
                  (task) => task.week <= org.current && task.status !== 'DONE',
                ).length
              }{' '}
              acciones abiertas
            </span>
          </div>
          <div>
            <small>Sustentos</small>
            <strong>
              {org.tasks.filter((task) => task.status === 'REVIEW').length}
            </strong>
            <span>pendientes de validar</span>
          </div>
          <div>
            <small>Próxima sesión</small>
            <strong>{displayDate(org.session.date)}</strong>
            <span>
              {org.session.attended ? 'Asistencia confirmada' : 'Por confirmar'}
            </span>
          </div>
          <div>
            <small>Intervenciones</small>
            <strong>
              {
                org.interventions.filter((item) => item.status === 'OPEN')
                  .length
              }
            </strong>
            <span>acciones internas abiertas</span>
          </div>
        </div>
        <div className="dashboard-grid">
          {scoreCard}
          <Section title="Contexto y riesgo">
            <p>
              {org.person} · Semana {org.current} · Cohorte activa
            </p>
            {h.reasons.map((r) => (
              <p className="risk-line" key={r}>
                <Flag size={15} /> {r}
              </p>
            ))}
            <p className="caption">
              Health: ejecución 25%, actividad 15%, vencidas 15%, KPI 15%,
              asistencia 10%, bloqueos 10%, evaluación manual neutral 5/10.
              Modelo configurable.
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
                        'Respuesta visible en el portal del cliente.',
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
        <Section
          title="Bitácora de seguimiento"
          className="spaced"
          action={
            <Button
              variant="outline"
              onClick={() =>
                setForm({
                  title: 'Programar seguimiento',
                  description:
                    'Deja un siguiente paso verificable con responsable y fecha límite.',
                  command: { type: 'followUp' },
                  fields: [
                    {
                      key: 'text',
                      label: 'Acuerdo o siguiente paso',
                      type: 'textarea',
                    },
                    {
                      key: 'owner',
                      label: 'Responsable',
                      value: 'Consultor asignado',
                    },
                    {
                      key: 'due',
                      label: 'Fecha límite',
                      type: 'date',
                      value: today(),
                    },
                  ],
                  button: 'Programar',
                })
              }
            >
              <Plus /> Seguimiento
            </Button>
          }
        >
          {org.followUps.map((follow) => (
            <div className="task-row" key={follow.id}>
              <Clock3 size={18} />
              <div className="task-title">
                <strong>{follow.summary}</strong>
                <small>
                  {follow.owner} · vence {displayDate(follow.due)} · registrado{' '}
                  {displayDate(follow.at)}
                </small>
              </div>
              <Badge
                value={follow.status}
                color={follow.status === 'COMPLETADO' ? '' : 'amber'}
              />
              {follow.status === 'ABIERTO' && (
                <Button
                  variant="outline"
                  onClick={() =>
                    act({ type: 'completeFollowUp', targetId: follow.id })
                  }
                >
                  <Check size={16} /> Completar
                </Button>
              )}
            </div>
          ))}
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
          Matriz de acceso por plan y versión. Los contratos y cobros se
          gestionan desde el proceso administrativo correspondiente.
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
              {p.name === 'CONTROL 90' && (
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
        <Section
          title="Usuarios y accesos"
          className="wide"
          action={
            <Button
              onClick={() =>
                setForm({
                  title: 'Crear usuario',
                  description:
                    'Crea el acceso y asígnalo a una empresa existente o registra una nueva.',
                  command: { type: 'createUser' },
                  fields: [
                    { key: 'name', label: 'Nombre completo' },
                    {
                      key: 'username',
                      label: 'Usuario',
                      hint: 'Puede ser DNI, RUC o un identificador interno.',
                    },
                    {
                      key: 'role',
                      label: 'Rol',
                      value: 'CLIENTE',
                      options: [
                        { value: 'CLIENTE', label: 'Cliente / alumno' },
                        { value: 'CONSULTOR', label: 'Consultor' },
                        { value: 'OPERADOR', label: 'Operador' },
                        { value: 'ADMIN', label: 'Administrador' },
                      ],
                    },
                    {
                      key: 'orgId',
                      label: 'Empresa (obligatoria para cliente)',
                      value: org.id,
                      options: [
                        { value: '', label: 'Sin empresa' },
                        ...state.orgs.map((item) => ({
                          value: item.id,
                          label: item.name,
                        })),
                      ],
                      createOrganization: true,
                    },
                    {
                      key: 'newOrgName',
                      label: 'Nombre de la nueva empresa',
                      showForNewOrganization: true,
                    },
                    {
                      key: 'newOrgPlanId',
                      label: 'Plan de la nueva empresa',
                      value: plan.id,
                      options: state.plans.map((item) => ({
                        value: item.id,
                        label: item.name + ' · v' + item.version,
                      })),
                      showForNewOrganization: true,
                    },
                  ],
                  button: 'Crear usuario',
                })
              }
            >
              <UserPlus /> Crear usuario
            </Button>
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  'Usuario',
                  'Rol',
                  'Empresa',
                  'Estado',
                  'Último acceso',
                  'Acciones',
                ].map((label) => (
                  <TableHead key={label}>{label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <strong>{user.name}</strong>
                    <small>@{user.username}</small>
                  </TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    {state.orgs.find((item) => item.id === user.orgId)?.name ||
                      'Equipo interno'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      value={user.status}
                      color={user.status === 'SUSPENDIDO' ? 'red' : ''}
                    />
                  </TableCell>
                  <TableCell>
                    {user.lastAccess
                      ? displayDate(user.lastAccess)
                      : 'Sin acceso'}
                  </TableCell>
                  <TableCell>
                    <div className="table-actions">
                      <Button
                        variant="outline"
                        disabled={user.id === 'user-admin'}
                        onClick={() =>
                          act({ type: 'toggleUser', targetId: user.id })
                        }
                      >
                        {user.status === 'ACTIVO' ? 'Suspender' : 'Reactivar'}
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={user.id === 'user-admin'}
                        aria-label={'Eliminar a ' + user.name}
                        onClick={() => {
                          if (
                            window.confirm(
                              '¿Eliminar a ' +
                                user.name +
                                '? El historial de actividad se conservará por separado.',
                            )
                          )
                            act({ type: 'deleteUser', targetId: user.id });
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="caption">
            Suspender conserva el histórico; eliminar retira el acceso asignado.
          </p>
        </Section>
        <Section title="Umbrales de Client Health">
          <p className="muted">Configuración aplicada a todo el portafolio.</p>
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
        <Section title="Infraestructura y datos">
          <p className="muted">
            Mientras se completa la conexión con Supabase, los cambios de esta
            versión se conservan en el navegador. No cargues información
            sensible.
          </p>
          <Button
            variant="outline"
            onClick={() =>
              download(
                'control-os-export.json',
                JSON.stringify(state, null, 2),
                'application/json',
              )
            }
          >
            <Download /> Exportar datos
          </Button>
          <p className="caption">
            El archivo incluye organizaciones, seguimiento y configuraciones del
            navegador.
          </p>
        </Section>
        <Section title="Integraciones y seguridad" className="wide">
          <p>
            Conectar las pantallas de acceso a Supabase Auth, invitaciones, 2FA,
            RBAC servidor, base de datos multi-tenant, archivos privados,
            auditoría inmutable, backups, rúbrica de score aprobada, CMS
            versionado, integraciones y pruebas de seguridad/UAT.
          </p>
          <p className="muted">
            Arquitectura recomendada por el PDF: Laravel + PostgreSQL +
            React/TypeScript. La siguiente fase conecta estos flujos con
            servicios de autenticación, datos y almacenamiento privados.
          </p>
        </Section>
      </div>
    );
  else
    body = (
      <Section title="Actividad local" action={<Bell size={19} />}>
        <p className="muted">
          Actividad registrada en CONTROL OS. El envío por email se configura
          por separado.
        </p>
        {timeline(mode === 'admin')}
      </Section>
    );
  return (
    <div
      className={`shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}${mobileNavOpen ? ' mobile-nav-open' : ''}`}
    >
      <aside
        className="sidebar"
        id="sidebar-navigation"
        aria-label="Navegación principal"
      >
        <div className="sidebar-head">
          <div className="brand" aria-label="CONTROL OS">
            <span className="brand-symbol" aria-hidden="true">
              <Image
                src="/crisdal-agency.png"
                alt=""
                width={108}
                height={108}
                priority
              />
            </span>
            <span className="brand-label">
              CONTROL <b>OS</b>
            </span>
          </div>
          <button
            className="sidebar-toggle"
            type="button"
            aria-controls="sidebar-navigation"
            aria-expanded={!sidebarCollapsed}
            aria-label={
              sidebarCollapsed
                ? 'Desplegar barra lateral'
                : 'Contraer barra lateral'
            }
            title={
              sidebarCollapsed
                ? 'Desplegar barra lateral'
                : 'Contraer barra lateral'
            }
            onClick={toggleSidebar}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>
          <button
            className="mobile-nav-close"
            type="button"
            aria-label="Cerrar navegación"
            onClick={() => setMobileNavOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <div className="workspace">
          <small>ORGANIZACIÓN</small>
          <Pick
            label="Organización activa"
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
              aria-label={sidebarCollapsed ? label : undefined}
              className={page === id ? 'active' : ''}
              key={id}
              title={sidebarCollapsed ? label : undefined}
              onClick={() => navigate(id)}
            >
              <Icon size={18} />
              <span className="nav-label">{label}</span>
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
          <span>CRISDAL AGENCY · CONTROL OS</span>
        </div>
      </aside>
      <button
        className="sidebar-backdrop"
        type="button"
        aria-label="Cerrar navegación"
        aria-hidden={!mobileNavOpen}
        tabIndex={mobileNavOpen ? 0 : -1}
        onClick={() => setMobileNavOpen(false)}
      />
      <main>
        <header>
          <div className="header-start">
            <button
              className="mobile-nav-toggle"
              type="button"
              aria-controls="sidebar-navigation"
              aria-expanded={mobileNavOpen}
              aria-label="Abrir navegación"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu size={21} />
            </button>
            <div className="breadcrumb">
              {mode === 'client' ? 'Mi workspace' : 'Administración'}{' '}
              <ChevronRight size={13} />
              <span>
                {page === 'semana'
                  ? 'Semana ' + week
                  : nav.find((n) => n.id === page)?.label || 'Actividad'}
              </span>
            </div>
          </div>
          <div className="header-right">
            <Pick
              label="Cambiar espacio de trabajo"
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
            <button
              className="avatar"
              type="button"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              onClick={() => {
                try {
                  sessionStorage.removeItem('control-os-demo-session');
                } catch {}
                setSessionActive(false);
              }}
            >
              {mode === 'admin' ? 'CC' : 'AP'}
            </button>
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
          {storageError && (
            <p className="error" role="alert">
              {storageError}
            </p>
          )}
          {body}
          <footer>
            CONTROL OS <span>Escalamiento con Control · Método CONTROL™</span>
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
            Semana {selectedTask?.week} · {org.person} · Sustento con
            descripción y archivos.
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
                      <FileChips files={e.files || []} />
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
                              'Describe el entregable y complementa el sustento con PDF, Word o Excel.',
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
                              {
                                key: 'files',
                                label: 'Archivos de sustento (opcional)',
                                type: 'file',
                                accept: '.pdf,.doc,.docx,.xls,.xlsx',
                                multiple: true,
                                required: false,
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
                                value: 'Evidencia revisada y aceptada.',
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
