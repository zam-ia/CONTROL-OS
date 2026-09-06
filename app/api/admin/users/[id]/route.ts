import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

type UpdateManagedUserBody = {
  name?: unknown;
  username?: unknown;
  password?: unknown;
};

const noStoreHeaders = { 'Cache-Control': 'no-store' };

function failure(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: noStoreHeaders });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !publishableKey || !secretKey)
    return failure(
      'La edición segura de contraseñas todavía no está configurada en el servidor.',
      503,
    );

  const authorization = request.headers.get('authorization') || '';
  const bearerToken = authorization.startsWith('Bearer ')
    ? authorization.slice(7).trim()
    : '';
  const cookieStore = await cookies();
  const accessToken =
    bearerToken || cookieStore.get('control-os-access-token')?.value || '';
  if (!accessToken) return failure('Inicia sesión nuevamente.', 401);

  const { id: targetReference } = await params;
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      targetReference,
    );
  if (!isUuid && !/^[a-z0-9._-]{3,40}$/i.test(targetReference))
    return failure('Identificador de usuario no válido.', 400);

  let body: UpdateManagedUserBody;
  try {
    body = (await request.json()) as UpdateManagedUserBody;
  } catch {
    return failure('Solicitud no válida.', 400);
  }
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const username =
    typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (name.length < 3 || name.length > 200)
    return failure('Escribe un nombre válido.', 400);
  if (!/^[a-z0-9._-]{3,40}$/.test(username))
    return failure('Escribe un usuario válido.', 400);
  if (password && password.length < 8)
    return failure(
      'La nueva contraseña debe tener al menos 8 caracteres.',
      400,
    );

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
  if (
    callerProfileError ||
    !callerProfile ||
    !['ADMIN', 'SUPER_ADMIN'].includes(callerProfile.global_role) ||
    callerProfile.status !== 'ACTIVE'
  )
    return failure('No tienes permiso para editar clientes.', 403);

  let targetQuery = adminClient
    .from('profiles')
    .select(
      'id, display_name, username, global_role, must_change_password, password_changed_at',
    );
  targetQuery = isUuid
    ? targetQuery.eq('id', targetReference)
    : targetQuery.eq('username', targetReference.toLowerCase());
  const { data: targetProfile, error: targetError } =
    await targetQuery.single();
  if (targetError || !targetProfile)
    return failure('El cliente no existe.', 404);
  if (targetProfile.global_role !== 'CLIENT')
    return failure('Solo se pueden editar clientes o alumnos.', 403);
  const targetId = targetProfile.id;

  const { data: duplicate } = await adminClient
    .from('profiles')
    .select('id')
    .eq('username', username)
    .neq('id', targetId)
    .limit(1);
  if (duplicate?.length)
    return failure('El nombre de usuario ya está registrado.', 409);

  const changedAt = password ? new Date().toISOString() : null;
  const profileChanges: {
    display_name: string;
    username: string;
    must_change_password?: boolean;
    password_changed_at?: string;
  } = { display_name: name, username };
  if (password) {
    profileChanges.must_change_password = true;
    profileChanges.password_changed_at = changedAt!;
  }
  const { error: profileError } = await adminClient
    .from('profiles')
    .update(profileChanges)
    .eq('id', targetId);
  if (profileError)
    return failure('No se pudieron actualizar los datos del cliente.', 500);

  const authAttributes: {
    password?: string;
    user_metadata: { name: string; username: string };
  } = { user_metadata: { name, username } };
  if (password) authAttributes.password = password;
  const { error: authError } = await adminClient.auth.admin.updateUserById(
    targetId,
    authAttributes,
  );
  if (authError) {
    await adminClient
      .from('profiles')
      .update({
        display_name: targetProfile.display_name,
        username: targetProfile.username,
        must_change_password: targetProfile.must_change_password,
        password_changed_at: targetProfile.password_changed_at,
      })
      .eq('id', targetId);
    return failure('Supabase Auth no pudo actualizar las credenciales.', 502);
  }

  await adminClient.from('audit_events').insert({
    actor_id: caller.id,
    event_type: password ? 'CLIENT_CREDENTIALS_UPDATED' : 'CLIENT_UPDATED',
    entity_type: 'profile',
    entity_id: targetId,
    payload: {
      fields: password
        ? ['name', 'username', 'password']
        : ['name', 'username'],
    },
  });

  return Response.json(
    {
      id: targetId,
      name,
      username,
      temporaryPasswordAssigned: Boolean(password),
      mustChangePassword: password || targetProfile.must_change_password,
    },
    { headers: noStoreHeaders },
  );
}
