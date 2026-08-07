import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getPendingScholarships, AdminAuthError } from '@/lib/adminApi';
import ScholarshipRowActions from '@/components/admin/ScholarshipRowActions';

const TYPE_LABEL: Record<string, string> = { NACIONAL: 'Nacional', INTERNACIONAL: 'Internacional' };
const COVERAGE_LABEL: Record<string, string> = { TOTAL: 'Cobertura total', PARCIAL: 'Cobertura parcial' };

function fmtDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function RevisionPage() {
  const token = (await cookies()).get('admin_token')?.value;
  if (!token) redirect('/admin/login');

  let pending: any[] = [];
  try {
    pending = await getPendingScholarships(token);
  } catch (err) {
    if (err instanceof AdminAuthError) redirect('/admin/login');
    throw err;
  }

  return (
    <div>
      <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.8rem', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
        Cola de revisión
      </h1>
      <p style={{ fontSize: '0.86rem', color: 'var(--muted)', marginBottom: '28px' }}>
        Becas ingresadas automáticamente por el scraper, pendientes de aprobación manual.
      </p>

      {pending.length === 0 ? (
        <div style={{
          background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '8px',
          padding: '48px', textAlign: 'center', color: 'var(--muted)',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>✅</div>
          No hay becas pendientes de revisión.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '14px' }}>
          {pending.map(s => (
            <div key={s.id} style={{
              background: 'var(--white)', border: '1px solid var(--border)', borderTop: '4px solid var(--yellow)',
              borderRadius: '8px', padding: '20px 24px', display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap',
            }}>
              <div style={{ flex: '1 1 320px', minWidth: 0 }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <span style={{ padding: '2px 9px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700, background: 'var(--bg-light)', color: 'var(--red)' }}>
                    {TYPE_LABEL[s.type] ?? s.type}
                  </span>
                  {s.coverage && (
                    <span style={{ padding: '2px 9px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700, background: '#f1f1f1', color: 'var(--muted)' }}>
                      {COVERAGE_LABEL[s.coverage] ?? s.coverage}
                    </span>
                  )}
                </div>
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                  Fuente: <strong style={{ color: 'var(--text)' }}>{s.source?.name ?? 'Desconocida'}</strong>
                  {' · '}Ingresada: {fmtDate(s.createdAt)}
                </p>
              </div>

              <ScholarshipRowActions id={s.id} needsReview />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
