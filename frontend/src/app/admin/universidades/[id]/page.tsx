import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDepartments, getUniversityPrograms } from '@/lib/api';
import UniversityForm from '@/components/admin/UniversityForm';

export default async function EditarUniversidadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = (await cookies()).get('admin_token')?.value;
  if (!token) redirect('/admin/login');

  const [departments, data] = await Promise.all([
    getDepartments().catch(() => []),
    getUniversityPrograms(id).catch(() => null),
  ]);

  if (!data?.university) {
    return (
      <div>
        <Link href="/admin/universidades" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--red)', display: 'inline-block', marginBottom: '14px' }}>
          ← Volver a universidades
        </Link>
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '8px', padding: '32px', textAlign: 'center', color: 'var(--muted)' }}>
          No encontramos esta universidad.
        </div>
      </div>
    );
  }

  const { university } = data;

  return (
    <div style={{ maxWidth: '760px' }}>
      <Link href="/admin/universidades" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--red)', display: 'inline-block', marginBottom: '14px' }}>
        ← Volver a universidades
      </Link>
      <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.8rem', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
        {university.name}
      </h1>
      <p style={{ fontSize: '0.86rem', color: 'var(--muted)', marginBottom: '26px' }}>
        Edita los datos de la universidad.
      </p>

      <UniversityForm departments={departments} university={university} />
    </div>
  );
}
