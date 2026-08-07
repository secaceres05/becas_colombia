import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

const API_URL = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:9000';

export async function POST(req: NextRequest) {
  // Verificar que el usuario está autenticado como admin
  const token = (await cookies()).get('admin_token')?.value;
  if (!token) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json();

  const res = await fetch(`${API_URL}/ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.SCRAPER_API_KEY!,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const data = await res.json();

  if (res.ok) {
    revalidatePath('/admin/becas');
    revalidatePath('/admin/revision');
    revalidatePath('/becas');
    if (data?.slug) revalidatePath(`/becas/${data.slug}`);
  }

  return NextResponse.json(data, { status: res.status });
}
