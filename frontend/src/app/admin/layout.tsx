import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/admin/Sidebar';
import { getPendingScholarships } from '@/lib/adminApi';

export const metadata = {
  title: 'Panel de administración',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get('x-pathname') ?? '';
  const isLoginPage = pathname === '/admin/login';
  const token = (await cookies()).get('admin_token')?.value;

  if (!token && !isLoginPage) redirect('/admin/login');
  if (token && isLoginPage) redirect('/admin');

  if (isLoginPage) {
    return (
      <div style={{ background: 'var(--bg-light)', minHeight: '100vh' }}>
        {children}
      </div>
    );
  }

  let pendingCount = 0;
  try {
    const pending = await getPendingScholarships(token!);
    pendingCount = Array.isArray(pending) ? pending.length : 0;
  } catch {
    // El badge simplemente queda en 0 si el token expiró; las páginas internas manejan el redirect.
  }

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)', background: 'var(--bg-light)', fontFamily: "'Barlow', sans-serif" }}>
      <Sidebar pendingCount={pendingCount} />
      <main style={{ flex: 1, minWidth: 0, padding: '32px 40px' }}>
        {children}
      </main>
    </div>
  );
}
