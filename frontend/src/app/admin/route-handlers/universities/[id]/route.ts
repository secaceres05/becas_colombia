import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const API_URL = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:9000';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = (await cookies()).get('admin_token')?.value;
  if (!token) {
    return NextResponse.json({ message: 'No autenticado.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ message: 'Cuerpo de la solicitud inválido.' }, { status: 400 });
  }

  const backendRes = await fetch(`${API_URL}/admin/universities/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!backendRes.ok) {
    const errorBody = await backendRes.json().catch(() => ({}));
    return NextResponse.json({ message: errorBody.message ?? 'No se pudo actualizar la universidad.' }, { status: backendRes.status });
  }

  revalidatePath(`/universidades/${id}`);
  revalidatePath(`/admin/universidades/${id}`);
  revalidatePath(`/admin/universidades/${id}/programas`);
  revalidatePath('/universidades');
  revalidatePath('/admin/universidades');

  return NextResponse.json(await backendRes.json());
}
