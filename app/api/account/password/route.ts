import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const noStoreHeaders = { 'Cache-Control': 'no-store' };

function failure(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: noStoreHeaders });
}

export async function PATCH(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !publishableKey || !secretKey)
    return failure(
      'El cambio seguro de contraseña todavía no está configurado en el servidor.',
      503,
    );

  let body: { password?: unknown };
  try {
    body = (await request.json()) as { password?: unknown };
  } catch {
    return failure('Solicitud no válida.', 400);
  }
  const password = typeof body.password === 'string' ? body.password : '';
  if (password.length < 8 || password.length > 128)
    return failure('La contraseña debe tener entre 8 y 128 caracteres.', 400);

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
    data: { user },
    error: userError,
  } = await sessionClient.auth.getUser(accessToken);
  if (userError || !user) return failure('La sesión ya no es válida.', 401);

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('id, status')
    .eq('id', user.id)
    .single();
  if (profileError || !profile || profile.status !== 'ACTIVE')
    return failure('La cuenta no está activa.', 403);

  const { error: authError } = await adminClient.auth.admin.updateUserById(
    user.id,
    { password },
  );
  if (authError)
    return failure('Supabase Auth no pudo cambiar la contraseña.', 502);

  const changedAt = new Date().toISOString();
  const { error: updateError } = await adminClient
    .from('profiles')
    .update({ must_change_password: false, password_changed_at: changedAt })
    .eq('id', user.id);
  if (updateError)
    return failure(
      'La contraseña cambió, pero no se pudo actualizar el estado del perfil.',
      500,
    );

  await adminClient.from('audit_events').insert({
    actor_id: user.id,
    event_type: 'PASSWORD_CHANGED',
    entity_type: 'profile',
    entity_id: user.id,
    payload: { source: 'self_service' },
  });

  return Response.json(
    { changed: true, mustChangePassword: false },
    { headers: noStoreHeaders },
  );
}
