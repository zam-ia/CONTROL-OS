import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { canManageClientCredentials } from '@/lib/access';

type CreateManagedUserBody = {
  name?: unknown;
  username?: unknown;
  password?: unknown;
  role?: unknown;
  organizationName?: unknown;
};

const noStoreHeaders = { 'Cache-Control': 'no-store' };
const roleMap = {
  CLIENTE: 'CLIENT',
  CONSULTOR: 'COACH',
  OPERADOR: 'OPERATOR',
  ADMIN: 'ADMIN',
} as const;

function failure(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: noStoreHeaders });
}

function organizationSlug(name: string) {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 45);
  return `${base || 'empresa'}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !publishableKey || !secretKey)
    return failure(
      'La creación segura de usuarios todavía no está configurada en el servidor.',
      503,
    );

  let body: CreateManagedUserBody;
  try {
    body = (await request.json()) as CreateManagedUserBody;
  } catch {
    return failure('Solicitud no válida.', 400);
  }
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const username =
    typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const requestedRole =
    typeof body.role === 'string'
      ? (body.role.toUpperCase() as keyof typeof roleMap)
      : 'CLIENTE';
  const globalRole = roleMap[requestedRole];
  const organizationName =
    typeof body.organizationName === 'string'
      ? body.organizationName.trim()
      : '';
  if (name.length < 2 || name.length > 200)
    return failure('Escribe un nombre válido.', 400);
  if (!/^[a-z0-9._-]{3,40}$/.test(username))
    return failure('Escribe un usuario válido.', 400);
  if (!globalRole) return failure('Selecciona un rol válido.', 400);
  if (password && password.length < 8)
    return failure(
      'La contraseña temporal debe tener al menos 8 caracteres.',
      400,
    );
  if (globalRole === 'CLIENT' && organizationName.length < 2)
    return failure('Asigna una empresa al cliente.', 400);

  const authorization = request.headers.get('authorization') || '';
  const bearerToken = authorization.startsWith('Bearer ')
    ? authorization.slice(7).trim()
    : '';
  const cookieStore = await cookies();
  const accessToken =
    bearerToken || cookieStore.get('control-os-access-token')?.value || '';
  if (!accessToken) return failure('Inicia sesión nuevamente.', 401);

  const sessionClient = createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const adminClient = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const {
    data: { user: caller },
    error: callerError,
  } = await sessionClient.auth.getUser(accessToken);
  if (callerError || !caller) return failure('La sesión ya no es válida.', 401);

  const { data: callerProfile, error: callerProfileError } = await adminClient
    .from('profiles')
    .select('id, global_role, status')
    .eq('id', caller.id)
    .single();
  const canManageUsers =
    !callerProfileError &&
    callerProfile &&
    canManageClientCredentials({
      email: caller.email,
      globalRole: callerProfile.global_role,
      status: callerProfile.status,
    });
  if (!canManageUsers)
    return failure('No tienes permiso para crear usuarios.', 403);

  const { data: duplicate } = await adminClient
    .from('profiles')
    .select('id')
    .eq('username', username)
    .limit(1);
  if (duplicate?.length)
    return failure('El nombre de usuario ya está registrado.', 409);

  let organizationId: string | null = null;
  let organizationCreated = false;
  if (globalRole === 'CLIENT') {
    const { data: existingOrganization } = await adminClient
      .from('organizations')
      .select('id')
      .eq('name', organizationName)
      .limit(1)
      .maybeSingle();
    organizationId = existingOrganization?.id || null;
    if (!organizationId) {
      const { data: createdOrganization, error: organizationError } =
        await adminClient
          .from('organizations')
          .insert({
            name: organizationName,
            slug: organizationSlug(organizationName),
            country_code: 'PE',
            timezone: 'America/Lima',
            status: 'ACTIVE',
          })
          .select('id')
          .single();
      if (organizationError || !createdOrganization)
        return failure('No se pudo registrar la empresa en Supabase.', 500);
      organizationId = createdOrganization.id;
      organizationCreated = true;
    }
  }

  const internalEmail = `${username}@accounts.crisdalcompany.com`;
  const initialPassword = password || `${crypto.randomUUID()}Aa1!`;
  const { data: createdIdentity, error: identityError } =
    await adminClient.auth.admin.createUser({
      email: internalEmail,
      password: initialPassword,
      email_confirm: true,
      user_metadata: { name, username },
    });
  if (identityError || !createdIdentity.user) {
    if (organizationCreated && organizationId)
      await adminClient.from('organizations').delete().eq('id', organizationId);
    return failure(
      identityError?.message?.toLowerCase().includes('already')
        ? 'Ese usuario ya tiene una identidad de acceso registrada.'
        : 'Supabase Auth no pudo crear la identidad del usuario.',
      identityError?.message?.toLowerCase().includes('already') ? 409 : 502,
    );
  }
  const targetId = createdIdentity.user.id;
  const cleanup = async () => {
    await adminClient.auth.admin.deleteUser(targetId);
    if (organizationCreated && organizationId)
      await adminClient.from('organizations').delete().eq('id', organizationId);
  };

  const { error: profileError } = await adminClient
    .from('profiles')
    .update({
      display_name: name,
      username,
      global_role: globalRole,
      status: 'ACTIVE',
      must_change_password: Boolean(password),
      password_changed_at: password ? new Date().toISOString() : null,
    })
    .eq('id', targetId);
  if (profileError) {
    await cleanup();
    return failure('No se pudo completar el perfil del usuario.', 500);
  }

  if (globalRole === 'CLIENT' && organizationId) {
    const { error: membershipError } = await adminClient
      .from('memberships')
      .insert({
        organization_id: organizationId,
        user_id: targetId,
        role: 'MEMBER',
        status: 'ACTIVE',
      });
    if (membershipError) {
      await cleanup();
      return failure('No se pudo vincular el cliente con su empresa.', 500);
    }
  }

  await adminClient.from('audit_events').insert({
    organization_id: organizationId,
    actor_id: caller.id,
    event_type: 'MANAGED_USER_CREATED',
    entity_type: 'profile',
    entity_id: targetId,
    payload: {
      role: globalRole,
      temporaryPasswordAssigned: Boolean(password),
    },
  });

  return Response.json(
    {
      id: targetId,
      name,
      username,
      role: globalRole,
      organizationId,
      temporaryPasswordAssigned: Boolean(password),
    },
    { status: 201, headers: noStoreHeaders },
  );
}
