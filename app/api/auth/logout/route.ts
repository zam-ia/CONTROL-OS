import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json(
    { signedOut: true },
    { headers: { 'Cache-Control': 'no-store' } },
  );
  response.cookies.set('control-os-access-token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
  return response;
}
