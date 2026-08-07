import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdminScholarships, AdminAuthError } from '@/lib/adminApi';
import ScholarshipRowActions from '@/components/admin/ScholarshipRowActions';

const TYPE_LABEL: Record<string, string> = { NACIONAL: 'Nacional', INTERNACIONAL: 'Internacional' };
const COVERAGE_LABEL: Record<string, string> = { TOTAL: 'Total', PARCIAL: 'Parcial' };
const STATUS_LABEL: Record<string, string> = { VIGENTE: 'Vigente', PROXIMA: 'Próxima', CERRADA: 'Cerrada' };
const STATUS_COLORS: Record<string, [string, string]> = {
  VIGENTE: ['#e8f7ee', '#1e7a41'],
  PROXIMA: ['#fff3d6', '#a97400'],
  CERRADA: ['#f1f1f1', '#5A5A5A'],
};

const FILTERS: [string, string][] = [
  ['', 'Todas'],
  ['VIGENTE', 'Vigentes'],
  ['PROXIMA', 'Próximas'],
  ['CERRADA', 'Cerradas'],
];

function fmtDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function AdminBecasPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const token = (await cookies()).get('admin_token')?.value;
  if (!token) redirect('/admin/login');

  let scholarships: any[] = [];
  try {
    scholarships = await getAdminScholarships(token, status || undefined);
  } catch (err) {
    if (err instanceof AdminAuthError) redirect('/admin/login');
    throw err;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.8rem', fontWeight: 700, color: 'var(--text)' }}>
          Becas
        </h1>
        <Link href="/admin/becas/nueva" style={{
          background: 'var(--red)', color: '#fff', padding: '10px 20px', borderRadius: '6px',
          fontWeight: 700, fontSize: '0.84rem',
        }}>
          + Nueva beca
        </Link>
      </div>
      <p style={{ fontSize: '0.86rem', color: 'var(--muted)', marginBottom: '22px' }}>
        {scholarships.length} beca{scholarships.length !== 1 ? 's' : ''} registrada{scholarships.length !== 1 ? 's' : ''}
      </p>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {FILTERS.map(([val, lbl]) => (
          <Link key={val} href={val ? `/admin/becas?status=${val}` : '/admin/becas'} style={{
            padding: '8px 16px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700,
            border: (status || '') === val ? 'none' : '1px solid var(--border)',
            background: (status || '') === val ? 'var(--red)' : 'var(--white)',
            color: (status || '') === val ? '#fff' : 'var(--muted)',
          }}>
            {lbl}
          </Link>
        ))}
      </div>

      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
              {['Título', 'Tipo', 'Cobertura', 'Estado', 'Revisión', 'Proveedor', 'Cierre', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '12px 16px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scholarships.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--muted)' }}>
                  No hay becas para este filtro.
                </td>
              </tr>
            ) : scholarships.map(s => {
              const [bg, fg] = STATUS_COLORS[s.status] ?? ['#f1f1f1', 'var(--muted)'];
              return (
                <tr key={s.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text)', maxWidth: '280px' }}>{s.title}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{TYPE_LABEL[s.type] ?? s.type}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{COVERAGE_LABEL[s.coverage] ?? s.coverage}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, background: bg, color: fg }}>
                      {STATUS_LABEL[s.status] ?? s.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {s.needsReview ? (
                      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, background: 'var(--yellow)', color: '#4a3600' }}>
                        Pendiente
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{s.provider?.name ?? '—'}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{fmtDate(s.closingDate)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <ScholarshipRowActions id={s.id} needsReview={s.needsReview} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
