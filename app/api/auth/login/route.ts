import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { isPrimaryAdministrator } from '@/lib/access';

const noStoreHeaders = { 'Cache-Control': 'no-store' };

async function activeOrganization(
  url: string,
  secretKey: string,
  userId: string,
) {
  const adminClient = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: membership } = await adminClient
    .from('memberships')
    .select('organization_id')
    .eq('user_id', userId)
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!membership?.organization_id) return null;
  const { data: organization } = await adminClient
    .from('organizations')
    .select('id, name')
    .eq('id', membership.organization_id)
    .eq('status', 'ACTIVE')
    .maybeSingle();
  return organization || null;
}

function failure(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: noStoreHeaders },
  );
}

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !publishableKey || !secretKey)
    return failure('Supabase Auth todavía no está conectado al servidor.', 503);

  let body: { username?: unknown; password?: unknown };
  try {
    body = (await request.json()) as {
      username?: unknown;
      password?: unknown;
    };
  } catch {
    return failure('Solicitud no válida.', 400);
  }
  const username =
    typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!/^[a-z0-9._-]{3,40}$/.test(username) || password.length < 8)
    return failure('Usuario o contraseña no válidos.', 400);

  const adminClient = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select(
      'id, display_name, username, global_role, status, must_change_password',
    )
    .eq('username', username)
    .single();
  if (profileError || !profile)
    return failure('La cuenta no está registrada.', 401);
  if (profile.status !== 'ACTIVE')
    return failure('Esta cuenta está suspendida.', 403);

  const {
    data: { user },
    error: userError,
  } = await adminClient.auth.admin.getUserById(profile.id);
  if (userError || !user?.email)
    return failure('La identidad de acceso no está disponible.', 401);

  const sessionClient = createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error: signInError } =
    await sessionClient.auth.signInWithPassword({
      email: user.email,
      password,
    });
  if (signInError || !data.session)
    return failure('Usuario o contraseña incorrectos.', 401);

  const globalRole = isPrimaryAdministrator(user.email)
    ? 'SUPER_ADMIN'
    : profile.global_role;
  const organization =
    globalRole === 'CLIENT'
      ? await activeOrganization(url, secretKey, profile.id)
      : null;
  if (globalRole === 'CLIENT' && !organization)
    return failure('La cuenta no tiene una empresa activa asignada.', 403);

  const response = NextResponse.json(
    {
      user: {
        id: profile.id,
        name: profile.display_name,
        username: profile.username,
        globalRole,
        mustChangePassword: profile.must_change_password,
        organization,
      },
    },
    { headers: noStoreHeaders },
  );
  const secure = process.env.NODE_ENV === 'production';
  response.cookies.set('control-os-access-token', data.session.access_token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: data.session.expires_in,
  });
  return response;
}

export async function GET(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !publishableKey || !secretKey)
    return failure('Supabase Auth todavía no está conectado al servidor.', 503);

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
    .select(
      'id, display_name, username, global_role, status, must_change_password',
    )
    .eq('id', user.id)
    .single();
  if (profileError || !profile || profile.status !== 'ACTIVE')
    return failure('La cuenta no está activa.', 403);

  const globalRole = isPrimaryAdministrator(user.email)
    ? 'SUPER_ADMIN'
    : profile.global_role;
  const organization =
    globalRole === 'CLIENT'
      ? await activeOrganization(url, secretKey, profile.id)
      : null;
  if (globalRole === 'CLIENT' && !organization)
    return failure('La cuenta no tiene una empresa activa asignada.', 403);

  return NextResponse.json(
    {
      user: {
        id: profile.id,
        name: profile.display_name,
        username: profile.username,
        globalRole,
        mustChangePassword: profile.must_change_password,
        organization,
      },
    },
    { headers: noStoreHeaders },
  );
}
