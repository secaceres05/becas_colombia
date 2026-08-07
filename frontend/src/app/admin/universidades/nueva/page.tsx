import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDepartments } from '@/lib/api';
import UniversityForm from '@/components/admin/UniversityForm';

export default async function NuevaUniversidadPage() {
  const token = (await cookies()).get('admin_token')?.value;
  if (!token) redirect('/admin/login');

  const departments = await getDepartments().catch(() => []);

  return (
    <div style={{ maxWidth: '760px' }}>
      <Link href="/admin/universidades" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--red)', display: 'inline-block', marginBottom: '14px' }}>
        ← Volver a universidades
      </Link>
      <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.8rem', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
        Nueva universidad
      </h1>
      <p style={{ fontSize: '0.86rem', color: 'var(--muted)', marginBottom: '26px' }}>
        Registra una nueva institución en el directorio.
      </p>

      <UniversityForm departments={departments} />
    </div>
  );
}
