import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { isPrimaryAdministrator } from '@/lib/access';

const noStoreHeaders = { 'Cache-Control': 'no-store' };

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

  const response = NextResponse.json(
    {
      user: {
        id: profile.id,
        name: profile.display_name,
        username: profile.username,
        globalRole,
        mustChangePassword: profile.must_change_password,
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
