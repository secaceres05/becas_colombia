import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdminScholarships, AdminAuthError } from '@/lib/adminApi';
import ScholarshipRowActions from '@/components/admin/ScholarshipRowActions';

const TYPE_LABEL: Record<string, string> = { NACIONAL: 'Nacional', INTERNACIONAL: 'Internacional' };
const STATUS_LABEL: Record<string, string> = { VIGENTE: 'Vigente', PROXIMA: 'Próxima', CERRADA: 'Cerrada' };
const STATUS_COLORS: Record<string, [string, string]> = {
  VIGENTE: ['#e8f7ee', '#1e7a41'],
  PROXIMA: ['#fff3d6', '#a97400'],
  CERRADA: ['#f1f1f1', '#5A5A5A'],
};

function fmtDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function AdminDashboardPage() {
  const token = (await cookies()).get('admin_token')?.value;
  if (!token) redirect('/admin/login');

  let scholarships: any[] = [];
  try {
    scholarships = await getAdminScholarships(token);
  } catch (err) {
    if (err instanceof AdminAuthError) redirect('/admin/login');
    throw err;
  }

  const total = scholarships.length;
  const pendientes = scholarships.filter(s => s.needsReview).length;
  const vigentes = scholarships.filter(s => s.status === 'VIGENTE').length;
  const cerradas = scholarships.filter(s => s.status === 'CERRADA').length;

  const ultimas = [...scholarships]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const STATS = [
    { label: 'Total becas', value: total, color: 'var(--red)' },
    { label: 'Pendientes revisión', value: pendientes, color: 'var(--yellow)' },
    { label: 'Vigentes', value: vigentes, color: '#1e7a41' },
    { label: 'Cerradas', value: cerradas, color: '#5A5A5A' },
  ];

  return (
    <div>
      <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.8rem', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
        Dashboard
      </h1>
      <p style={{ fontSize: '0.86rem', color: 'var(--muted)', marginBottom: '28px' }}>
        Resumen general de las convocatorias registradas en la plataforma.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '16px', marginBottom: '34px' }}>
        {STATS.map(stat => (
          <div key={stat.label} style={{
            background: 'var(--white)', border: '1px solid var(--border)', borderTop: `4px solid ${stat.color}`,
            borderRadius: '8px', padding: '20px 22px',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
              {stat.label}
            </div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2.2rem', fontWeight: 700, color: 'var(--text)' }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)' }}>
          Últimas becas registradas
        </h2>
      </div>

      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
              {['Título', 'Tipo', 'Estado', 'Revisión', 'Creada', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '12px 16px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ultimas.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--muted)' }}>
                  Aún no hay becas registradas.
                </td>
              </tr>
            ) : ultimas.map(s => {
              const [bg, fg] = STATUS_COLORS[s.status] ?? ['#f1f1f1', 'var(--muted)'];
              return (
                <tr key={s.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text)', maxWidth: '320px' }}>{s.title}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{TYPE_LABEL[s.type] ?? s.type}</td>
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
                  <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{fmtDate(s.createdAt)}</td>
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
