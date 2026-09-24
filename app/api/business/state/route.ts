import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { isPrimaryAdministrator } from '@/lib/access';
import type { BusinessState } from '@/lib/business';

const noStoreHeaders = { 'Cache-Control': 'no-store' };
const storedStateKey = 'centra_business_state';

type AuthorizedContext = {
  adminClient: SupabaseClient;
  organizationId: string;
  userId: string;
};

function failure(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: noStoreHeaders });
}

function isBusinessState(value: unknown): value is BusinessState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<BusinessState>;
  return (
    candidate.schema === 2 &&
    Boolean(candidate.workspace) &&
    Array.isArray(candidate.clients) &&
    Array.isArray(candidate.services) &&
    Array.isArray(candidate.incomes) &&
    Array.isArray(candidate.expenses) &&
    Array.isArray(candidate.tasks) &&
    Array.isArray(candidate.team) &&
    Array.isArray(candidate.positions) &&
    Array.isArray(candidate.calendar)
  );
}

async function authorizedContext(
  request: Request,
): Promise<AuthorizedContext | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !publishableKey || !secretKey) return null;

  const authorization = request.headers.get('authorization') || '';
  const bearerToken = authorization.startsWith('Bearer ')
    ? authorization.slice(7).trim()
    : '';
  const cookieStore = await cookies();
  const accessToken =
    bearerToken || cookieStore.get('control-os-access-token')?.value || '';
  if (!accessToken) return null;

  const sessionClient = createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const adminClient = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const {
    data: { user },
  } = await sessionClient.auth.getUser(accessToken);
  if (!user) return null;

  const { data: profile } = await adminClient
    .from('profiles')
    .select('id, global_role, status')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || profile.status !== 'ACTIVE') return null;

  const globalRole = isPrimaryAdministrator(user.email)
    ? 'SUPER_ADMIN'
    : profile.global_role;
  let organizationId = '';
  if (globalRole === 'CLIENT') {
    const { data: membership } = await adminClient
      .from('memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    organizationId = membership?.organization_id || '';
  } else {
    const requested = new URL(request.url).searchParams.get('organizationId');
    if (
      requested &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        requested,
      )
    ) {
      const { data: organization } = await adminClient
        .from('organizations')
        .select('id')
        .eq('id', requested)
        .eq('status', 'ACTIVE')
        .maybeSingle();
      organizationId = organization?.id || '';
    }
  }
  if (!organizationId) return null;
  return { adminClient, organizationId, userId: user.id };
}

export async function GET(request: Request) {
  const context = await authorizedContext(request);
  if (!context)
    return failure('No tienes una empresa activa para consultar.', 403);

  const { data: workspace, error } = await context.adminClient
    .from('business_workspaces')
    .select('status, settings, updated_at')
    .eq('organization_id', context.organizationId)
    .maybeSingle();
  if (error)
    return failure('No se pudo cargar Mi Empresa desde Supabase.', 500);
  if (workspace && !['ACTIVE', 'PROVISIONING'].includes(workspace.status))
    return failure('El espacio de esta empresa no está activo.', 423);
  const settings = (workspace?.settings || {}) as Record<string, unknown>;
  const state = settings[storedStateKey];
  return Response.json(
    {
      state: isBusinessState(state) ? state : null,
      updatedAt: workspace?.updated_at || null,
    },
    { headers: noStoreHeaders },
  );
}

export async function PUT(request: Request) {
  const context = await authorizedContext(request);
  if (!context)
    return failure('No tienes una empresa activa para guardar cambios.', 403);

  const rawBody = await request.text();
  if (rawBody.length > 3_000_000)
    return failure('El espacio supera el tamaño permitido.', 413);
  let state: unknown;
  try {
    state = (JSON.parse(rawBody) as { state?: unknown }).state;
  } catch {
    return failure('Solicitud no válida.', 400);
  }
  if (!isBusinessState(state))
    return failure('El estado de Mi Empresa no es válido.', 400);
  if (state.workspace.organizationId !== context.organizationId)
    return failure('La empresa del contenido no coincide con tu sesión.', 403);

  const { data: existing, error: readError } = await context.adminClient
    .from('business_workspaces')
    .select('id, status, settings')
    .eq('organization_id', context.organizationId)
    .maybeSingle();
  if (readError)
    return failure('No se pudo preparar el espacio de la empresa.', 500);
  if (existing && !['ACTIVE', 'PROVISIONING'].includes(existing.status))
    return failure('El espacio de esta empresa no admite cambios.', 423);

  const settings = {
    ...((existing?.settings || {}) as Record<string, unknown>),
    [storedStateKey]: state,
    centra_business_state_updated_by: context.userId,
    centra_business_state_updated_at: new Date().toISOString(),
  };
  const query = existing
    ? context.adminClient
        .from('business_workspaces')
        .update({ settings, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    : context.adminClient.from('business_workspaces').insert({
        organization_id: context.organizationId,
        status: 'ACTIVE',
        currency: 'PEN',
        timezone: 'America/Lima',
        settings,
        provisioned_at: new Date().toISOString(),
      });
  const { error: writeError } = await query;
  if (writeError)
    return failure('No se pudo guardar Mi Empresa en Supabase.', 500);
  return Response.json({ ok: true }, { headers: noStoreHeaders });
}
