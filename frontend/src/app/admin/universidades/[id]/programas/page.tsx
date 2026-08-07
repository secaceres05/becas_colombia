import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUniversityPrograms } from '@/lib/api';
import ProgramsManager from '@/components/admin/ProgramsManager';

export default async function ProgramasUniversidadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = (await cookies()).get('admin_token')?.value;
  if (!token) redirect('/admin/login');

  const data = await getUniversityPrograms(id).catch(() => null);

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

  const { university, programs } = data;

  return (
    <div>
      <Link href={`/admin/universidades/${university.id}`} style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--red)', display: 'inline-block', marginBottom: '14px' }}>
        ← Volver a {university.name}
      </Link>
      <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.8rem', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
        Programas académicos
      </h1>
      <p style={{ fontSize: '0.86rem', color: 'var(--muted)', marginBottom: '26px' }}>
        {programs.length} programa{programs.length !== 1 ? 's' : ''} de {university.name}.
      </p>

      <ProgramsManager universityId={university.id} programs={programs} />
    </div>
  );
}
