'use client';
import Image from 'next/image';
import Link from 'next/link';
import { flushSync } from 'react-dom';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BookOpen,
  BriefcaseBusiness,
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
  Pencil,
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
  methodOwnerLabels,
  methodSteps,
  phaseGate,
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
type ManagedUser = State['users'][number];
const STORAGE = 'control-os-production-v1';
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
  { id: 'metodologia', label: 'Metodología', icon: Route },
  { id: 'cliente', label: 'Cliente 360', icon: Users },
  { id: 'revisiones', label: 'Revisiones', icon: ClipboardCheck },
  { id: 'intervenciones', label: 'Intervenciones', icon: Flag },
  { id: 'clases', label: 'Clases', icon: BookOpen },
  { id: 'modulos', label: 'Módulos', icon: FolderPlus },
  { id: 'finanzas', label: 'Finanzas', icon: WalletCards },
  { id: 'planes', label: 'Planes y accesos', icon: ShieldCheck },
  { id: 'configuracion', label: 'Configuración', icon: Settings },
];
const controlFlow = [
  'Información',
  'Diagnóstico',
  'Hallazgo',
  'Prioridad',
  'Acción',
  'Evidencia',
  'Validación',
  'Estandarización',
  'KPI',
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
  onEnter: (username: string, password: string) => Promise<{ error: string }>;
}) {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
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
        <div>
          <p className="eyebrow">CONTROL OS</p>
          <h2>Iniciar sesión</h2>
          <p className="muted">
            Ingresa con el usuario asignado por tu administrador.
          </p>
        </div>
        <form
          onSubmit={async (event) => {
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
            setSubmitting(true);
            const result = await onEnter(username.toLowerCase(), password);
            setSubmitting(false);
            if (result.error) {
              setError(result.error);
              return;
            }
            try {
              sessionStorage.setItem('control-os-session', 'true');
            } catch {}
          }}
        >
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
              autoComplete="current-password"
              placeholder="8 caracteres o más"
            />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <Button className="full" type="submit" disabled={submitting}>
            {submitting ? 'Ingresando…' : 'Ingresar'} <ArrowRight />
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

async function responseError(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: unknown };
    return typeof payload.error === 'string' ? payload.error : fallback;
  } catch {
    return fallback;
  }
}

function EditUserDialog({
  user,
  onClose,
  onSave,
}: {
  user: ManagedUser | null;
  onClose: () => void;
  onSave: (command: Command) => boolean;
}) {
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  return (
    <Dialog
      open={!!user}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="control-dialog">
        <DialogTitle>Editar cliente</DialogTitle>
        <DialogDescription>
          Cambia sus datos de acceso. La contraseña temporal se guarda
          exclusivamente en Supabase Auth.
        </DialogDescription>
        {user && (
          <form
            key={user.id}
            onSubmit={async (event) => {
              event.preventDefault();
              setError('');
              const data = new FormData(event.currentTarget);
              const rawName = data.get('name');
              const rawUsername = data.get('username');
              const rawPassword = data.get('password');
              const name = typeof rawName === 'string' ? rawName.trim() : '';
              const username =
                typeof rawUsername === 'string'
                  ? rawUsername.trim().toLowerCase()
                  : '';
              const password =
                typeof rawPassword === 'string' ? rawPassword : '';
              setSaving(true);
              try {
                const response = await fetch(
                  `/api/admin/users/${encodeURIComponent(user.username)}`,
                  {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, username, password }),
                  },
                );
                if (!response.ok) {
                  const localOnly =
                    !password &&
                    (response.status === 401 || response.status === 503);
                  if (!localOnly)
                    throw Error(
                      await responseError(
                        response,
                        'No se pudo actualizar el cliente.',
                      ),
                    );
                }
                if (
                  onSave({
                    type: 'updateUser',
                    targetId: user.id,
                    name,
                    username,
                  })
                )
                  onClose();
              } catch (submitError) {
                setError(
                  submitError instanceof Error
                    ? submitError.message
                    : 'No se pudo actualizar el cliente.',
                );
              } finally {
                setSaving(false);
              }
            }}
          >
            <label className="field" htmlFor="managed-client-name">
              <span>Nombre completo</span>
              <Input
                id="managed-client-name"
                name="name"
                defaultValue={user.name}
                required
              />
            </label>
            <label className="field" htmlFor="managed-client-username">
              <span>Usuario</span>
              <Input
                id="managed-client-username"
                name="username"
                defaultValue={user.username}
                minLength={3}
                maxLength={40}
                pattern="[A-Za-z0-9._-]+"
                required
              />
              <small>Puede ser DNI, RUC o un alias interno.</small>
            </label>
            <label className="field" htmlFor="managed-client-password">
              <span>Contraseña temporal (opcional)</span>
              <Input
                id="managed-client-password"
                name="password"
                type="password"
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                placeholder="Déjala vacía para conservar la actual"
              />
              <small>
                Si asignas una, el cliente deberá reemplazarla después de
                ingresar.
              </small>
            </label>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <div className="form-footer">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PasswordDialog({
  open,
  onClose,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="control-dialog">
        <DialogTitle>Cambiar mi contraseña</DialogTitle>
        <DialogDescription>
          Crea una contraseña personal después de ingresar con la clave temporal
          asignada por administración.
        </DialogDescription>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setError('');
            const data = new FormData(event.currentTarget);
            const rawPassword = data.get('password');
            const rawConfirmation = data.get('confirmation');
            const password = typeof rawPassword === 'string' ? rawPassword : '';
            const confirmation =
              typeof rawConfirmation === 'string' ? rawConfirmation : '';
            if (password !== confirmation) {
              setError('Las contraseñas no coinciden.');
              return;
            }
            setSaving(true);
            try {
              const response = await fetch('/api/account/password', {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
              });
              if (!response.ok)
                throw Error(
                  await responseError(
                    response,
                    'No se pudo cambiar la contraseña.',
                  ),
                );
              onChanged();
              onClose();
            } catch (submitError) {
              setError(
                submitError instanceof Error
                  ? submitError.message
                  : 'No se pudo cambiar la contraseña.',
              );
            } finally {
              setSaving(false);
            }
          }}
        >
          <label className="field" htmlFor="account-new-password">
            <span>Nueva contraseña</span>
            <Input
              id="account-new-password"
              name="password"
              type="password"
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              required
            />
          </label>
          <label className="field" htmlFor="account-confirm-password">
            <span>Repite la contraseña</span>
            <Input
              id="account-confirm-password"
              name="confirmation"
              type="password"
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              required
            />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="form-footer">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando…' : 'Cambiar contraseña'}
            </Button>
          </div>
        </form>
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
  const [resource, setResource] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
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
            candidate.orgs.length < 1 ||
            !Array.isArray(candidate.plans)
          )
            throw Error('invalid');
          candidate.orgs.forEach((o: Org) => {
            if (o.weeks.length !== 12 || !o.tasks || !o.kpis || !o.events)
              throw Error('invalid');
            const freshOrg = s.orgs.find((item) => item.id === o.id);
            o.finances = Array.isArray(o.finances)
              ? o.finances
              : freshOrg?.finances || [];
            o.followUps = Array.isArray(o.followUps)
              ? o.followUps
              : freshOrg?.followUps || [];
            o.lessonRuns = Array.isArray(o.lessonRuns)
              ? o.lessonRuns
              : freshOrg?.lessonRuns || [];
            o.lessonRuns.forEach((run) => {
              const legacyRun = run as LessonRun & { playback?: number };
              if (typeof legacyRun.videoCompleted !== 'boolean')
                legacyRun.videoCompleted = (legacyRun.playback || 0) >= 90;
              delete legacyRun.playback;
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
            : [];
          const savedModules = new Set<string>(
            candidate.modules.map((resourceItem: State['modules'][number]) =>
              String(resourceItem.code || resourceItem.id),
            ),
          );
          s.modules.forEach((resourceItem) => {
            if (!savedModules.has(String(resourceItem.code || resourceItem.id)))
              candidate.modules.push(resourceItem);
          });
          candidate.modules.forEach(
            (resourceItem: State['modules'][number]) => {
              resourceItem.category = resourceItem.category || 'General';
              resourceItem.version = resourceItem.version || '1.0.0';
              resourceItem.tier = resourceItem.tier || 'BASIC';
              resourceItem.tags = Array.isArray(resourceItem.tags)
                ? resourceItem.tags
                : [];
              resourceItem.editorialStatus =
                resourceItem.editorialStatus ||
                (resourceItem.files.length ? 'LISTO' : 'EN_PRODUCCION');
            },
          );
          candidate.users = Array.isArray(candidate.users)
            ? candidate.users
            : s.users;
          candidate.lessons = Array.isArray(candidate.lessons)
            ? candidate.lessons
            : [];
          const savedLessons = new Map<string, Lesson>(
            candidate.lessons.map((lesson: Lesson): [string, Lesson] => [
              lesson.id,
              lesson,
            ]),
          );
          s.lessons.forEach((canonicalLesson) => {
            const savedLesson = savedLessons.get(canonicalLesson.id);
            if (savedLesson) {
              savedLesson.owner = canonicalLesson.owner;
              savedLesson.minAccess = canonicalLesson.minAccess;
            } else candidate.lessons.push(canonicalLesson);
          });
          candidate.lessons.forEach((lesson: Lesson) => {
            lesson.owner = lesson.owner || 'C+E';
            lesson.minAccess = lesson.minAccess || 'LOW';
          });
          candidate.orgs.forEach((organization: Org) => {
            const runs = new Set(
              organization.lessonRuns.map((run) => run.lessonId),
            );
            candidate.lessons.forEach((lesson: Lesson) => {
              if (runs.has(lesson.id)) return;
              organization.lessonRuns.push({
                lessonId: lesson.id,
                videoCompleted: false,
                status: 'NO_INICIADO',
                response: '',
                feedback: '',
                due: lesson.due,
                manuallyUnlocked: false,
                requirementSkipped: false,
              });
            });
          });
          const primaryAdmin = candidate.users.find(
            (user: State['users'][number]) => user.id === 'user-admin',
          );
          if (primaryAdmin) {
            primaryAdmin.name = 'Aldair Crizam';
            primaryAdmin.username = 'aldaircrizam';
            primaryAdmin.role = 'ADMIN';
            primaryAdmin.status = 'ACTIVO';
          }
          const defaultUsernames: Record<string, string> = {
            'user-admin': 'aldaircrizam',
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
            savedPlan.accessLevel =
              savedPlan.accessLevel ||
              (savedPlan.id === 'partnership-v1'
                ? 'HIGH'
                : savedPlan.id === 'implementacion-v1'
                  ? 'MEDIUM'
                  : 'LOW');
            const canonicalPlan = s.plans.find(
              (item) => item.accessLevel === savedPlan.accessLevel,
            );
            savedPlan.entitlements =
              savedPlan.entitlements ||
              canonicalPlan?.entitlements ||
              s.plans[0].entitlements;
          });
          candidate.orgs.forEach((organization: Org) => {
            organization.support = Array.isArray(organization.support)
              ? organization.support
              : [];
            organization.support.forEach((ticket) => {
              const legacy = ticket as Org['support'][number];
              legacy.type = legacy.type || 'ACOMPANAMIENTO';
              legacy.priority = legacy.priority || 'NORMAL';
              legacy.privacy = legacy.privacy || 'PRIVADA';
              legacy.status =
                legacy.status || (legacy.reply ? 'RESPONDIDO' : 'ABIERTO');
              legacy.due =
                legacy.due || new Date(Date.now() + 48 * 3600000).toISOString();
              legacy.lessonId = legacy.lessonId || '';
            });
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
          sessionStorage.getItem('control-os-session') === 'true',
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
        onEnter={async (username, password) => {
          try {
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, password }),
            });
            if (response.ok) {
              const payload = (await response.json()) as {
                user?: {
                  globalRole?: string;
                  mustChangePassword?: boolean;
                };
              };
              const nextMode: Mode =
                payload.user?.globalRole === 'CLIENT' ? 'client' : 'admin';
              setMode(nextMode);
              setPage(nextMode === 'admin' ? 'portafolio' : 'inicio');
              setSessionActive(true);
              setPasswordDialogOpen(Boolean(payload.user?.mustChangePassword));
              setNotice(
                payload.user?.mustChangePassword
                  ? 'Crea una contraseña personal para continuar.'
                  : 'Sesión iniciada.',
              );
              return { error: '' };
            }
            if (response.status !== 503)
              return {
                error: await responseError(
                  response,
                  'No se pudo iniciar sesión.',
                ),
              };
          } catch {
            // Local validation remains available until server integration is enabled.
          }
          const account = state.users.find(
            (user) => user.username.toLowerCase() === username,
          );
          if (!account) return { error: 'La cuenta no está registrada.' };
          if (account.status === 'SUSPENDIDO')
            return {
              error: 'Esta cuenta está suspendida. Contacta al administrador.',
            };
          const nextMode: Mode =
            account.role === 'CLIENTE' ? 'client' : 'admin';
          setMode(nextMode);
          setPage(nextMode === 'admin' ? 'portafolio' : 'inicio');
          setSessionActive(true);
          setNotice('Sesión iniciada.');
          return { error: '' };
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
  const onboardingLessons = implementationLessons.filter(
    (lesson) => lesson.stage === 0,
  );
  const onboardingMetrics = lessonMetrics(state, org, 0);
  const phaseGates = new Map(
    [1, 2, 3, 4].map((phase) => [phase, phaseGate(state, org, phase)] as const),
  );
  const gateFor = (phase: number) => phaseGates.get(phase)!;
  const lessonsThisWeek = implementationLessons.filter(
    (lesson) => lesson.week === week,
  );
  const lessonCountByWeek = new Map<number, number>();
  implementationLessons.forEach((lesson) =>
    lessonCountByWeek.set(
      lesson.week,
      (lessonCountByWeek.get(lesson.week) || 0) + 1,
    ),
  );
  const resourceTierRank = { BASIC: 1, COMPLETE: 2, ADVANCED: 3 } as const;
  const planResourceRank = resourceTierRank[plan.entitlements.resourceTier];
  const libraryResources = state.modules.filter((resourceItem) => {
    const matchesSearch = [
      resourceItem.title,
      resourceItem.description,
      resourceItem.category,
      ...(resourceItem.tags || []),
    ]
      .join(' ')
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesCategory =
      filter === 'all' || resourceItem.category === filter;
    return matchesSearch && matchesCategory;
  });
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
        Madurez del negocio · evaluación CONTROL v1
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
    metodologia: 'Un proceso maestro. Distintos niveles de acompañamiento.',
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
            <div className="big-number">{onboardingMetrics.learning}%</div>
            <Meter
              label="Contenido consumido"
              value={onboardingMetrics.learning}
            />
          </Section>
          <Section title="Ejecución">
            <div className="big-number">{onboardingMetrics.execution}%</div>
            <Meter
              label="Actividades entregadas"
              value={onboardingMetrics.execution}
            />
          </Section>
          <Section title="Validación">
            <div className="big-number">{onboardingMetrics.validation}%</div>
            <Meter
              label="Entregables aprobados"
              value={onboardingMetrics.validation}
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
          {onboardingLessons.map((lesson) => {
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
                  <div className="inline-actions">
                    <span
                      className={`owner-chip owner-${lesson.owner.replace('+', '')}`}
                      title={methodOwnerLabels[lesson.owner]}
                    >
                      [{lesson.owner}]
                    </span>
                    <Badge
                      value={
                        complete ? 'APROBADO' : run?.status || 'NO_INICIADO'
                      }
                      color={!unlocked ? 'gray' : undefined}
                    />
                  </div>
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
                  <p className="muted">
                    {reason ||
                      `${lessonCountByWeek.get(n) || 0} clases · ${w.objective}`}
                  </p>
                  <Button variant="outline" onClick={() => openWeek(n)}>
                    {reason ? <LockKeyhole /> : <ArrowRight />}
                    {reason ? 'Ver requisitos' : 'Abrir semana'}
                  </Button>
                </div>
              );
            })}
            {i < 4 && (
              <div className="phase-gate">
                <div className="section-top">
                  <div>
                    <small>GATE DE SALIDA · FASE {i + 1}</small>
                    <strong>
                      {gateFor(i + 1).ready
                        ? 'Criterios cumplidos'
                        : 'Validación pendiente'}
                    </strong>
                  </div>
                  <Badge
                    value={gateFor(i + 1).status}
                    color={gateFor(i + 1).ready ? '' : 'amber'}
                  />
                </div>
                <div className="gate-checklist">
                  {gateFor(i + 1).requirements.map((requirement) => (
                    <div key={requirement.label}>
                      {requirement.ok ? (
                        <Check size={16} className="green" />
                      ) : (
                        <LockKeyhole size={15} />
                      )}
                      <span>{requirement.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
            <Section
              title={`Clases de la semana ${week}`}
              className="wide"
              action={
                <Badge
                  value={`${lessonsThisWeek.length} clases`}
                  color="gray"
                />
              }
            >
              <div className="week-class-list">
                {lessonsThisWeek.map((lesson) => {
                  const run = org.lessonRuns.find(
                    (item) => item.lessonId === lesson.id,
                  )!;
                  const unlocked = lessonAvailable(state, org, lesson.id);
                  const youtubeUrl = youtubeEmbedUrl(lesson.videoUrl);
                  const activityCompleted = [
                    'ENVIADO',
                    'EN_REVISION',
                    'APROBADO',
                  ].includes(run.status);
                  return (
                    <article
                      className={`week-class ${unlocked ? '' : 'is-locked'}`}
                      key={lesson.id}
                    >
                      <div className="section-top">
                        <div>
                          <small>{lesson.code}</small>
                          <strong>{lesson.title}</strong>
                        </div>
                        <div className="inline-actions">
                          <span
                            className={`owner-chip owner-${lesson.owner.replace('+', '')}`}
                            title={methodOwnerLabels[lesson.owner]}
                          >
                            [{lesson.owner}]
                          </span>
                          <Badge
                            value={unlocked ? run.status : 'Bloqueada'}
                            color={unlocked ? undefined : 'gray'}
                          />
                        </div>
                      </div>
                      <p>{lesson.description}</p>
                      <div className="week-class-detail">
                        <span>
                          <small>ACCIÓN</small>
                          {lesson.action}
                        </span>
                        <span>
                          <small>ENTREGABLE</small>
                          {lesson.deliverable}
                        </span>
                      </div>
                      {youtubeUrl && unlocked && (
                        <div className="video-player compact-video">
                          <iframe
                            src={youtubeUrl}
                            title={lesson.title}
                            loading="lazy"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      )}
                      <div className="compact-checkpoints">
                        <div>
                          <Checkbox
                            aria-label={`Marcar como vista: ${lesson.title}`}
                            checked={run.videoCompleted}
                            disabled={
                              !unlocked || !youtubeUrl || activityCompleted
                            }
                            onCheckedChange={(checked) =>
                              act({
                                type: 'watchLesson',
                                targetId: lesson.id,
                                checked: checked === true,
                              })
                            }
                          />
                          Clase vista
                        </div>
                        <div>
                          <Checkbox
                            aria-label={`Completar actividad: ${lesson.title}`}
                            checked={activityCompleted}
                            disabled={
                              !unlocked ||
                              !run.videoCompleted ||
                              activityCompleted
                            }
                            onCheckedChange={(checked) => {
                              if (checked !== true) return;
                              setForm({
                                title: 'Entregar actividad',
                                description: `${lesson.deliverable} · La evidencia queda vinculada a esta clase.`,
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
                          Actividad completada
                        </div>
                      </div>
                      {!unlocked && (
                        <small className="muted">
                          Completa y valida la clase anterior para continuar.
                        </small>
                      )}
                    </article>
                  );
                })}
              </div>
            </Section>
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
              Cálculo acumulado hasta la semana actual. Las ventanas semanales y
              SLA se configuran según la operación de cada empresa.
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
        <div className="toolbar">
          <p className="muted">
            Recursos versionados y vinculados a tu ruta. Tu historial conserva
            la versión utilizada en cada entregable.
          </p>
          <Badge
            value={`Nivel ${plan.entitlements.resourceTier.toLowerCase()}`}
            color="gray"
          />
        </div>
        <div className="filters">
          <Input
            aria-label="Buscar recursos"
            placeholder="Buscar por nombre, categoría o etiqueta…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Pick
            label="Categoría"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'Todas las categorías' },
              ...Array.from(
                new Set(
                  state.modules.map(
                    (resourceItem) => resourceItem.category || 'General',
                  ),
                ),
              ).map((category) => ({ value: category, label: category })),
            ]}
          />
        </div>
        <div className="cards-grid spaced">
          {libraryResources.map((resourceItem) => {
            const tier = resourceItem.tier || 'BASIC';
            const planAllows = resourceTierRank[tier] <= planResourceRank;
            const routeAllows = resourceItem.week <= org.current;
            const ready = resourceItem.editorialStatus !== 'EN_PRODUCCION';
            const availableResource = planAllows && routeAllows && ready;
            return (
              <Section
                title={resourceItem.title}
                key={resourceItem.id}
                action={
                  <Badge
                    value={resourceItem.code || `SEM ${resourceItem.week}`}
                    color="gray"
                  />
                }
              >
                <div className="inline-actions">
                  <Badge
                    value={resourceItem.category || 'General'}
                    color="blue"
                  />
                  <Badge
                    value={`v${resourceItem.version || '1.0.0'}`}
                    color="gray"
                  />
                  <Badge value={tier} color="gray" />
                </div>
                <p className="resource-description">
                  {resourceItem.description}
                </p>
                <small className="muted">
                  Semana {resourceItem.week}
                  {resourceItem.relatedLesson
                    ? ` · Clase ${resourceItem.relatedLesson}`
                    : ''}
                  {resourceItem.editable ? ' · Editable' : ''}
                </small>
                {resourceItem.files.length > 0 && (
                  <FileChips files={resourceItem.files} />
                )}
                <div className="inline-actions">
                  <Button
                    variant="outline"
                    disabled={!availableResource}
                    onClick={() => setResource(resourceItem.id)}
                  >
                    {!planAllows ? (
                      <>
                        <LockKeyhole /> Fuera de tu plan
                      </>
                    ) : !routeAllows ? (
                      <>
                        <LockKeyhole /> Se habilita en tu ruta
                      </>
                    ) : !ready ? (
                      <>
                        <Clock3 /> En producción editorial
                      </>
                    ) : (
                      <>
                        Abrir recurso <ArrowUpRight />
                      </>
                    )}
                  </Button>
                  {resourceItem.relatedLesson && routeAllows && (
                    <Button
                      variant="ghost"
                      onClick={() => openWeek(resourceItem.week)}
                    >
                      Ver en mi ruta
                    </Button>
                  )}
                </div>
              </Section>
            );
          })}
        </div>
        {!libraryResources.length && (
          <Section title="Sin resultados" className="spaced">
            <Empty>Prueba otra búsqueda o categoría.</Empty>
          </Section>
        )}
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
            La agenda se administra dentro de CONTROL OS. Las integraciones con
            calendario, email y reuniones externas están pendientes.
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
            Soporte vinculado a tu ruta · SLA de respuesta: hasta{' '}
            {plan.entitlements.supportSlaHours} horas.
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
                    key: 'supportType',
                    label: 'Tipo de consulta',
                    value: 'METODOLOGICO',
                    options: [
                      { value: 'METODOLOGICO', label: 'Metodológica' },
                      { value: 'TECNICO', label: 'Incidencia técnica' },
                      { value: 'ACOMPANAMIENTO', label: 'Acompañamiento' },
                    ],
                  },
                  {
                    key: 'priority',
                    label: 'Prioridad',
                    value: 'NORMAL',
                    options: ['NORMAL', 'ALTA', 'URGENTE'].map((value) => ({
                      value,
                      label: value.charAt(0) + value.slice(1).toLowerCase(),
                    })),
                  },
                  {
                    key: 'privacy',
                    label: 'Privacidad',
                    value: 'PRIVADA',
                    options: [
                      {
                        value: 'PRIVADA',
                        label: 'Privada con el equipo CONTROL',
                      },
                      {
                        value: 'COMUNIDAD',
                        label: 'Compartida con la comunidad',
                      },
                    ],
                  },
                  {
                    key: 'lessonId',
                    label: 'Clase relacionada (opcional)',
                    value: '',
                    required: false,
                    options: [
                      { value: '', label: 'Sin clase relacionada' },
                      ...implementationLessons.map((lesson) => ({
                        value: lesson.id,
                        label: `${lesson.code} · ${lesson.title}`,
                      })),
                    ],
                  },
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
              title={
                t.type === 'TECNICO'
                  ? 'Incidencia técnica'
                  : t.type === 'METODOLOGICO'
                    ? 'Consulta metodológica'
                    : 'Consulta de acompañamiento'
              }
              key={t.id}
              className="spaced"
            >
              <div className="inline-actions">
                <Badge
                  value={t.priority}
                  color={
                    t.priority === 'URGENTE'
                      ? 'red'
                      : t.priority === 'ALTA'
                        ? 'amber'
                        : 'gray'
                  }
                />
                <Badge value={t.privacy} color="gray" />
                <Badge value={t.status} />
              </div>
              <p>{t.text}</p>
              <small className="muted">
                Respuesta comprometida antes de{' '}
                {new Intl.DateTimeFormat('es-PE', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                  timeZone: 'America/Lima',
                }).format(new Date(t.due))}
              </small>
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
                    <div className="inline-actions">
                      <span
                        className={`owner-chip owner-${lesson.owner.replace('+', '')}`}
                        title={methodOwnerLabels[lesson.owner]}
                      >
                        [{lesson.owner}]
                      </span>
                      <Badge
                        value={lesson.publication}
                        color={lesson.publication === 'BORRADOR' ? 'gray' : ''}
                      />
                    </div>
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
                    {lesson.approvalCriteria && (
                      <div>
                        <small>CRITERIO DE APROBACIÓN</small>
                        <p>{lesson.approvalCriteria}</p>
                      </div>
                    )}
                  </div>
                  {lesson.resourceId && (
                    <p className="caption">
                      Recurso {lesson.resourceId} · versión{' '}
                      {lesson.resourceVersion || '1.0.0'}
                    </p>
                  )}
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
                    key: 'category',
                    label: 'Categoría',
                    value: 'Operaciones',
                    options: [
                      'Diagnóstico',
                      'Estrategia',
                      'Operaciones',
                      'Delegación',
                      'Control',
                      'Crecimiento',
                      'Partnership',
                      'Ejemplos',
                    ].map((value) => ({ value, label: value })),
                  },
                  {
                    key: 'tier',
                    label: 'Nivel de biblioteca',
                    value: 'BASIC',
                    options: [
                      { value: 'BASIC', label: 'Básico' },
                      { value: 'COMPLETE', label: 'Completo' },
                      { value: 'ADVANCED', label: 'Avanzado' },
                    ],
                  },
                  { key: 'version', label: 'Versión', value: '1.0.0' },
                  {
                    key: 'tags',
                    label: 'Etiquetas separadas por coma',
                    value: 'CONTROL, implementación',
                  },
                  {
                    key: 'relatedLesson',
                    label: 'Código de clase relacionada (opcional)',
                    required: false,
                  },
                  {
                    key: 'editable',
                    label: 'Tipo de recurso',
                    value: 'yes',
                    options: [
                      { value: 'yes', label: 'Editable' },
                      { value: 'no', label: 'Solo lectura' },
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
          {state.modules.map((resourceItem) => (
            <Section
              key={resourceItem.id}
              title={resourceItem.title}
              action={
                <Badge value={'Semana ' + resourceItem.week} color="gray" />
              }
            >
              <p>{resourceItem.description}</p>
              <p className="muted text-small">
                {resourceItem.planId === 'all'
                  ? 'Todos los planes'
                  : state.plans.find((item) => item.id === resourceItem.planId)
                      ?.name}
              </p>
              <FileChips files={resourceItem.files} />
              <div className="inline-actions spaced-small">
                <small className="muted">
                  Creado {displayDate(resourceItem.createdAt)}
                </small>
                {resourceItem.id !== 'module-w1' && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (window.confirm('¿Eliminar este módulo?'))
                        act({
                          type: 'deleteModule',
                          targetId: resourceItem.id,
                        });
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
  } else if (page === 'metodologia')
    body = (
      <>
        <div className="method-rule methodology-rule">
          <ShieldCheck size={22} />
          <div>
            <strong>
              Una sola metodología CONTROL para todas las empresas.
            </strong>
            <span>
              El plan modifica acompañamiento, intervención y herramientas;
              nunca reemplaza el proceso ni borra el historial del cliente.
            </span>
          </div>
        </div>
        <div className="method-flow" aria-label="Flujo maestro CONTROL">
          {controlFlow.map((item, index) => (
            <div key={item}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{item}</strong>
            </div>
          ))}
        </div>
        <div className="cards-grid methodology-phases">
          {[1, 2].map((phase) => {
            const phaseLessons = state.lessons.filter(
              (lesson) => lesson.stage === phase,
            );
            return (
              <Section
                key={phase}
                title={`Fase ${phase} · ${stages[phase - 1]}`}
                action={
                  <Badge
                    value={`${methodSteps.filter((step) => step.phase === phase).length} controles`}
                    color="gray"
                  />
                }
              >
                <p className="muted">
                  Semanas {phase === 1 ? '1–3' : '4–6'} · {phaseLessons.length}{' '}
                  clases visibles para el cliente.
                </p>
                <div className="gate-checklist">
                  {gateFor(phase).requirements.map((requirement) => (
                    <div key={requirement.label}>
                      {requirement.ok ? (
                        <Check size={16} className="green" />
                      ) : (
                        <LockKeyhole size={15} />
                      )}
                      <span>{requirement.label}</span>
                    </div>
                  ))}
                </div>
              </Section>
            );
          })}
        </div>
        <Section
          title="Workflow interno de consultoría"
          className="spaced"
          action={
            <Pick
              label="Filtrar controles por fase"
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: 'Fases 1 y 2' },
                { value: '1', label: 'Fase 1' },
                { value: '2', label: 'Fase 2' },
              ]}
            />
          }
        >
          <p className="muted">
            El equipo CONTROL ve el detalle completo; el cliente recibe una ruta
            simplificada por semanas, clases y entregables.
          </p>
          <div className="method-legend">
            {Object.entries(methodOwnerLabels).map(([owner, label]) => (
              <span
                className={`owner-chip owner-${owner.replace('+', '')}`}
                key={owner}
              >
                [{owner}] {label}
              </span>
            ))}
          </div>
          <div className="method-step-list">
            {methodSteps
              .filter(
                (step) => filter === 'all' || String(step.phase) === filter,
              )
              .map((step) => (
                <div className="method-step" key={step.code}>
                  <span className="method-step-code">
                    {String(step.code).padStart(2, '0')}
                  </span>
                  <div>
                    <strong>{step.title}</strong>
                    <small>
                      Fase {step.phase} · Semana {step.week}
                    </small>
                  </div>
                  <span
                    className={`owner-chip owner-${step.owner.replace('+', '')}`}
                    title={methodOwnerLabels[step.owner]}
                  >
                    [{step.owner}]
                  </span>
                </div>
              ))}
          </div>
        </Section>
      </>
    );
  else if (page === 'cliente')
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
        <div className="method-rule">
          <ShieldCheck size={22} />
          <div>
            <strong>La metodología no cambia con el plan.</strong>
            <span>
              Todos conservan diagnóstico, historial, CONTROL Score y roadmap.
              Una mejora de plan desbloquea mayor profundidad de intervención.
            </span>
          </div>
        </div>
        <div className="cards-grid">
          {state.plans.map((p) => (
            <Section
              key={p.id}
              title={p.name}
              action={<Badge value={'v' + p.version} color="gray" />}
            >
              <ul className="plan-list">
                {[
                  ['Metodología CONTROL', 'Proceso maestro'],
                  ['Diagnóstico interno', 'Incluido'],
                  ['Historial y CONTROL Score', 'Incluido'],
                  ['Roadmap general', 'Incluido'],
                  [
                    'Clases',
                    p.accessLevel === 'LOW'
                      ? 'Según alcance'
                      : p.accessLevel === 'MEDIUM'
                        ? 'Ampliadas'
                        : 'Completas',
                  ],
                  [
                    'Revisión humana',
                    p.accessLevel === 'LOW'
                      ? 'Limitada'
                      : p.accessLevel === 'MEDIUM'
                        ? 'Regular'
                        : 'Intensiva',
                  ],
                  [
                    'Implementación CONTROL',
                    p.accessLevel === 'LOW'
                      ? 'Mínima'
                      : p.accessLevel === 'MEDIUM'
                        ? 'Parcial'
                        : 'Alta',
                  ],
                  [
                    'Auditoría profunda',
                    p.accessLevel === 'HIGH'
                      ? 'Incluida'
                      : p.accessLevel === 'MEDIUM'
                        ? 'Parcial'
                        : 'No incluida',
                  ],
                  [
                    'Sesiones 1:1',
                    p.accessLevel === 'HIGH'
                      ? 'Incluidas'
                      : p.accessLevel === 'MEDIUM'
                        ? 'Limitadas'
                        : 'No incluidas',
                  ],
                  ['Techo de ruta', `Etapa ${p.entitlements.maxStageAccess}`],
                  ['Biblioteca', p.entitlements.resourceTier],
                  ['Revisiones humanas', p.entitlements.reviewLimit],
                  ['Comunidad', p.entitlements.community],
                  ['SLA de soporte', `${p.entitlements.supportSlaHours} h`],
                  [
                    'Auditoría',
                    p.entitlements.audit === 'FULL'
                      ? 'Completa'
                      : p.entitlements.audit === 'LIGHT'
                        ? 'Parcial'
                        : 'No incluida',
                  ],
                  [
                    'Plan 90D post',
                    p.entitlements.post90DayPlan ? 'Incluido' : 'No incluido',
                  ],
                ].map(([feature, value]) => (
                  <li key={feature}>
                    <Check className="green" size={16} />
                    <span>{feature}</span>
                    <small>{value}</small>
                  </li>
                ))}
              </ul>
              <p className="muted">
                Nivel de acceso:{' '}
                {p.accessLevel === 'LOW'
                  ? 'Base'
                  : p.accessLevel === 'MEDIUM'
                    ? 'Ampliado'
                    : 'Completo'}{' '}
                · Equipo: {p.team} · Sesiones: {p.sessions}
              </p>
              <p className="caption">
                Al ampliar el plan, el cliente continúa desde su historial
                actual.
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
                      {user.role === 'CLIENTE' && (
                        <Button
                          variant="outline"
                          onClick={() => setEditingUser(user)}
                        >
                          <Pencil size={15} /> Editar
                        </Button>
                      )}
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
        <Link
          className="business-launcher-sidebar"
          href={`/business?org=${encodeURIComponent(org.id)}`}
          title={sidebarCollapsed ? 'Mi Empresa' : undefined}
        >
          <BriefcaseBusiness size={18} />
          <span>Mi Empresa</span>
          <ArrowUpRight size={15} />
        </Link>
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
            <Link
              className="business-launcher-header"
              href={`/business?org=${encodeURIComponent(org.id)}`}
            >
              <BriefcaseBusiness size={17} />
              <span>Mi Empresa</span>
              <ArrowUpRight size={14} />
            </Link>
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
            {mode === 'client' && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Cambiar mi contraseña"
                title="Cambiar mi contraseña"
                onClick={() => setPasswordDialogOpen(true)}
              >
                <LockKeyhole size={18} />
              </Button>
            )}
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
                void fetch('/api/auth/logout', {
                  method: 'POST',
                  credentials: 'include',
                });
                try {
                  sessionStorage.removeItem('control-os-session');
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
      <EditUserDialog
        key={editingUser?.id || 'closed-user-editor'}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSave={act}
      />
      <PasswordDialog
        key={
          passwordDialogOpen ? 'open-password-editor' : 'closed-password-editor'
        }
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
        onChanged={() => setNotice('Contraseña actualizada correctamente.')}
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
          <DialogTitle>
            {state.modules.find((resourceItem) => resourceItem.id === resource)
              ?.title || 'Recurso CONTROL'}
          </DialogTitle>
          <DialogDescription>
            Recurso versionado del expediente de implementación.
          </DialogDescription>
          {resource !== null && (
            <>
              {(() => {
                const selectedResource = state.modules.find(
                  (resourceItem) => resourceItem.id === resource,
                );
                if (!selectedResource) return null;
                return (
                  <>
                    <p>{selectedResource.description}</p>
                    <div className="inline-actions">
                      <Badge
                        value={selectedResource.category || 'General'}
                        color="blue"
                      />
                      <Badge
                        value={`v${selectedResource.version || '1.0.0'}`}
                        color="gray"
                      />
                    </div>
                    <FileChips files={selectedResource.files} />
                    <p className="caption">
                      La descarga segura se habilitará desde Supabase Storage.
                      El expediente conservará la versión usada.
                    </p>
                  </>
                );
              })()}
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
