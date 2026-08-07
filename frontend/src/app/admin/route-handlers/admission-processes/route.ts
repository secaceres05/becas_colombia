import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const API_URL = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:9000';

export async function POST(request: NextRequest) {
  const token = (await cookies()).get('admin_token')?.value;
  if (!token) {
    return NextResponse.json({ message: 'No autenticado.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ message: 'Cuerpo de la solicitud inválido.' }, { status: 400 });
  }

  const backendRes = await fetch(`${API_URL}/admin/admission-processes`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!backendRes.ok) {
    const errorBody = await backendRes.json().catch(() => ({}));
    return NextResponse.json({ message: errorBody.message ?? 'No se pudo crear el proceso de admisión.' }, { status: backendRes.status });
  }

  const process = await backendRes.json();

  if (process?.university?.id ?? process?.universityId) {
    const universityId = process.university?.id ?? process.universityId;
    revalidatePath(`/universidades/${universityId}`);
    revalidatePath(`/admin/universidades/${universityId}`);
  }
  revalidatePath('/admin/admisiones');

  return NextResponse.json(process);
}
