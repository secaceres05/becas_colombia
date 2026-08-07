const ADMIN_API_URL = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:9000';

export class AdminAuthError extends Error {}

async function adminFetch(path: string, token: string, init?: RequestInit) {
  const res = await fetch(`${ADMIN_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (res.status === 401) throw new AdminAuthError('Token inválido o expirado');
  return res;
}

export async function getAdminScholarships(token: string, status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const res = await adminFetch(`/admin/scholarships${query}`, token);
  if (!res.ok) throw new Error('Error al obtener becas');
  return res.json();
}

export async function getPendingScholarships(token: string) {
  const res = await adminFetch('/admin/scholarships/pending', token);
  if (!res.ok) throw new Error('Error al obtener la cola de revisión');
  return res.json();
}

export async function getAdminUniversities(token: string, params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  const res = await adminFetch(`/admin/universities${query}`, token);
  if (!res.ok) throw new Error('Error al obtener universidades');
  return res.json();
}

export async function getAdminAdmissionProcesses(token: string) {
  const res = await adminFetch('/admin/admission-processes', token);
  if (!res.ok) throw new Error('Error al obtener los procesos de admisión');
  return res.json();
}
