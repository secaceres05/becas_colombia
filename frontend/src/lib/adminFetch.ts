export async function adminFetch(url: string, options: RequestInit = {}) {
  const res = await fetch(url, options);
  if (res.status !== 401) return res;

  const refreshed = await fetch('/admin/route-handlers/auth/refresh', { method: 'POST' });
  if (!refreshed.ok) return res;

  return fetch(url, options);
}
