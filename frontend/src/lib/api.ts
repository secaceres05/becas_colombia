const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:9000';

export async function getScholarships(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  const res = await fetch(`${API_URL}/scholarships${query}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error('Error al obtener becas');
  return res.json();
}

export async function getScholarshipBySlug(slug: string) {
  const res = await fetch(`${API_URL}/scholarships/${slug}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error('Beca no encontrada');
  return res.json();
}

export async function getDepartments() {
  const res = await fetch(`${API_URL}/departments`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error('Error al obtener departamentos');
  return res.json();
}

export async function getUniversities(params?: Record<string, string>) {
  const defaultParams = { limit: '250', ...params };
  const query = '?' + new URLSearchParams(defaultParams).toString();
  const res = await fetch(`${API_URL}/universities${query}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error('Error al obtener universidades');
  return res.json();
}

export async function getUniversityPrograms(id: string) {
  const res = await fetch(`${API_URL}/universities/${id}/programs`, {
    next: { revalidate: 300 },
  });
  if (res.status === 404 || res.status === 400) return null;
  if (!res.ok) throw new Error('Error al obtener la universidad');
  return res.json();
}
