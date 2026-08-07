import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:9000';
const COOKIE_NAME = 'admin_token';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body?.email || !body?.password) {
    return NextResponse.json({ message: 'Correo y contraseña son requeridos.' }, { status: 400 });
  }

  const backendRes = await fetch(`${API_URL}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: body.email, password: body.password }),
    cache: 'no-store',
  });

  if (!backendRes.ok) {
    const errorBody = await backendRes.json().catch(() => ({}));
    return NextResponse.json(
      { message: errorBody.message ?? 'Correo o contraseña incorrectos.' },
      { status: backendRes.status },
    );
  }

  const data = await backendRes.json();

  const response = NextResponse.json({ user: data.user });
  response.cookies.set(COOKIE_NAME, data.accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 15,
  });

  return response;
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/admin/login', request.url));
  response.cookies.delete(COOKIE_NAME);
  return response;
}
