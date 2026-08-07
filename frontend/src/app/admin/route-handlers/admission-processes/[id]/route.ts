import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const API_URL = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:9000';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = (await cookies()).get('admin_token')?.value;
  if (!token) {
    return NextResponse.json({ message: 'No autenticado.' }, { status: 401 });
  }

  const backendRes = await fetch(`${API_URL}/admin/admission-processes/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!backendRes.ok) {
    const errorBody = await backendRes.json().catch(() => ({}));
    return NextResponse.json({ message: errorBody.message ?? 'No se pudo eliminar el proceso de admisión.' }, { status: backendRes.status });
  }

  const deleted = await backendRes.json().catch(() => null);

  if (deleted?.universityId) {
    revalidatePath(`/universidades/${deleted.universityId}`);
    revalidatePath(`/admin/universidades/${deleted.universityId}`);
  }
  revalidatePath('/admin/admisiones');

  return NextResponse.json({ ok: true });
}
