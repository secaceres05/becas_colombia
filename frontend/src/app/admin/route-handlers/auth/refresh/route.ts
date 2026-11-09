import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:9000';
const ACCESS_COOKIE = 'admin_token';
const REFRESH_COOKIE = 'admin_refresh';

export async function POST() {
  const refreshToken = (await cookies()).get(REFRESH_COOKIE)?.value;

  if (!refreshToken) {
    return NextResponse.json({ message: 'No hay sesión que renovar.' }, { status: 401 });
  }

  const backendRes = await fetch(`${API_URL}/admin/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
  });

  if (!backendRes.ok) {
    return NextResponse.json({ message: 'Sesión expirada. Inicia sesión de nuevo.' }, { status: 401 });
  }

  const data = await backendRes.json();

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCESS_COOKIE, data.accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 15,
  });

  return response;
}
