import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdminUniversities, AdminAuthError } from '@/lib/adminApi';
import { REGIONS, DANE_TO_REGION } from '@/app/becas/regions';

const TYPE_LABEL: Record<string, string> = { PUBLICA: 'Pública', PRIVADA: 'Privada' };

const TYPE_FILTERS: [string, string][] = [
  ['', 'Todas'],
  ['PUBLICA', 'Pública'],
  ['PRIVADA', 'Privada'],
];

const ACCREDITATION_FILTERS: [string, string][] = [
  ['', 'Todas'],
  ['true', 'Acreditadas'],
  ['false', 'No acreditadas'],
];

export default async function AdminUniversidadesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; type?: string; accreditation?: string; region?: string }>;
}) {
  const { search, type, accreditation, region } = await searchParams;
  const token = (await cookies()).get('admin_token')?.value;
  if (!token) redirect('/admin/login');

  const query: Record<string, string> = {};
  if (search) query.search = search;
  if (type) query.type = type;
  if (accreditation) query.accreditation = accreditation;

  let list: any[] = [];
  try {
    const { data } = await getAdminUniversities(token, query);
    list = data ?? [];
  } catch (err) {
    if (err instanceof AdminAuthError) redirect('/admin/login');
    throw err;
  }

  if (region) {
    list = list.filter((u: any) => DANE_TO_REGION[u.department?.daneCode] === region);
  }

  function buildHref(overrides: Record<string, string>) {
    const params = new URLSearchParams({
      ...(search ? { search } : {}), ...(type ? { type } : {}),
      ...(accreditation ? { accreditation } : {}), ...(region ? { region } : {}),
      ...overrides,
    });
    for (const [k, v] of Array.from(params.entries())) if (!v) params.delete(k);
    const qs = params.toString();
    return qs ? `/admin/universidades?${qs}` : '/admin/universidades';
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.8rem', fontWeight: 700, color: 'var(--text)' }}>
          Universidades
        </h1>
        <Link href="/admin/universidades/nueva" style={{
          background: 'var(--red)', color: '#fff', padding: '10px 20px', borderRadius: '6px',
          fontWeight: 700, fontSize: '0.84rem',
        }}>
          + Nueva universidad
        </Link>
      </div>
      <p style={{ fontSize: '0.86rem', color: 'var(--muted)', marginBottom: '22px' }}>
        {list.length} institución{list.length !== 1 ? 'es' : ''} en el directorio.
      </p>

      <form action="/admin/universidades" method="GET" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
        <input
          type="text" name="search" defaultValue={search ?? ''}
          placeholder="Buscar por nombre o ciudad…"
          style={{ flex: '1 1 240px', padding: '9px 14px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.84rem', fontFamily: 'inherit', outline: 'none' }}
        />
        {type && <input type="hidden" name="type" value={type} />}
        {accreditation && <input type="hidden" name="accreditation" value={accreditation} />}
        {region && <input type="hidden" name="region" value={region} />}
        <button type="submit" style={{
          padding: '9px 18px', borderRadius: '6px', border: 'none', background: 'var(--text)',
          color: '#fff', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
        }}>
          Buscar
        </button>
      </form>

      <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {TYPE_FILTERS.map(([val, lbl]) => (
            <Link key={val} href={buildHref({ type: val })} style={{
              padding: '7px 14px', borderRadius: '20px', fontSize: '0.76rem', fontWeight: 700,
              border: (type || '') === val ? 'none' : '1px solid var(--border)',
              background: (type || '') === val ? 'var(--red)' : 'var(--white)',
              color: (type || '') === val ? '#fff' : 'var(--muted)',
            }}>
              {lbl}
            </Link>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {ACCREDITATION_FILTERS.map(([val, lbl]) => (
            <Link key={val} href={buildHref({ accreditation: val })} style={{
              padding: '7px 14px', borderRadius: '20px', fontSize: '0.76rem', fontWeight: 700,
              border: (accreditation || '') === val ? 'none' : '1px solid var(--border)',
              background: (accreditation || '') === val ? 'var(--yellow)' : 'var(--white)',
              color: (accreditation || '') === val ? '#4a3600' : 'var(--muted)',
            }}>
              {lbl}
            </Link>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <Link href={buildHref({ region: '' })} style={{
            padding: '7px 14px', borderRadius: '20px', fontSize: '0.76rem', fontWeight: 700,
            border: !region ? 'none' : '1px solid var(--border)',
            background: !region ? 'var(--text)' : 'var(--white)',
            color: !region ? '#fff' : 'var(--muted)',
          }}>
            Todas las regiones
          </Link>
          {REGIONS.map(r => (
            <Link key={r.key} href={buildHref({ region: r.key })} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px', borderRadius: '20px', fontSize: '0.76rem', fontWeight: 700,
              border: region === r.key ? 'none' : '1px solid var(--border)',
              background: region === r.key ? r.color : 'var(--white)',
              color: region === r.key ? '#fff' : 'var(--muted)',
            }}>
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
              {['Ranking', 'Nombre', 'Ciudad', 'Región', 'Tipo', 'Acreditación', 'QS Latam', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '12px 16px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--muted)' }}>
                  No hay universidades que coincidan con estos filtros.
                </td>
              </tr>
            ) : list.map((u: any) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{u.rankingUnirank ?? '—'}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text)' }}>{u.name}</td>
                <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{u.city ?? '—'}</td>
                <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{DANE_TO_REGION[u.department?.daneCode] ?? '—'}</td>
                <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{TYPE_LABEL[u.type] ?? u.type}</td>
                <td style={{ padding: '12px 16px' }}>
                  {u.accreditation ? (
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, background: 'var(--yellow)', color: '#4a3600' }}>
                      Sí{u.accreditationType?.includes('10 años') ? ' · 10 años' : ''}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>No</span>
                  )}
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{u.rankingQsLatam ?? '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Link href={`/admin/universidades/${u.id}`} style={{
                      background: 'var(--red)', color: '#fff', padding: '6px 14px',
                      borderRadius: '5px', fontSize: '0.76rem', fontWeight: 700,
                    }}>
                      Editar
                    </Link>
                    <Link href={`/admin/universidades/${u.id}/programas`} style={{
                      background: 'var(--white)', color: 'var(--text)', border: '1px solid var(--border)', padding: '6px 14px',
                      borderRadius: '5px', fontSize: '0.76rem', fontWeight: 700,
                    }}>
                      Ver programas{u._count?.programs != null ? ` (${u._count.programs})` : ''}
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
