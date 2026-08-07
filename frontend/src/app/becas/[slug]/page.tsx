import Link from 'next/link';
import { getScholarshipBySlug } from '@/lib/api';

const TYPE_LABEL: Record<string, string> = { NACIONAL: 'Nacional', INTERNACIONAL: 'Internacional' };
const COVERAGE_LABEL: Record<string, string> = { TOTAL: 'Cobertura total', PARCIAL: 'Cobertura parcial' };
const STATUS_LABEL: Record<string, string> = { VIGENTE: 'Vigente', PROXIMA: 'Próxima', CERRADA: 'Cerrada' };
const STATUS_COLORS: Record<string, [string, string]> = {
  VIGENTE: ['#e8f7ee', '#1e7a41'],
  PROXIMA: ['#fff3d6', '#a97400'],
  CERRADA: ['#f1f1f1', '#5A5A5A'],
};

function fmtDate(value?: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

function renderRequirementValue(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== 'object') return String(value);
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return null;
  return entries
    .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
    .join(' · ');
}

function departmentNames(beca: any): string[] {
  const depts: any[] = beca.departments ?? [];
  return depts
    .map((d: any) => d.name ?? d.department?.name)
    .filter(Boolean);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const beca = await getScholarshipBySlug(slug).catch(() => null);

  if (!beca) {
    return {
      title: 'Beca no encontrada',
      description: 'No encontramos esta convocatoria en Becas Colombia.',
    };
  }

  return {
    title: beca.title,
    description: beca.description
      ?? `${TYPE_LABEL[beca.type] ?? beca.type} · ${beca.provider?.name ?? 'Becas Colombia'}. Consulta requisitos, fechas y cobertura de esta convocatoria.`,
    openGraph: {
      title: beca.title,
      description: beca.description ?? undefined,
      url: `https://becascolombia.com/becas/${slug}`,
      siteName: 'Becas Colombia',
      locale: 'es_CO',
      type: 'website',
    },
  };
}

export default async function BecaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const beca = await getScholarshipBySlug(slug).catch(() => null);

  if (!beca) {
    return (
      <main style={{
        background: 'var(--bg)', minHeight: 'calc(100vh - 56px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '60px 6%', textAlign: 'center',
      }}>
        <div style={{ maxWidth: '420px' }}>
          <div style={{ fontSize: '2.6rem', marginBottom: '18px' }}>🔎</div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.8rem', fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', marginBottom: '10px' }}>
            No encontramos esta beca
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.7, marginBottom: '26px' }}>
            Puede que el enlace esté desactualizado o la convocatoria ya no exista. Vuelve al listado para ver todas las becas disponibles.
          </p>
          <Link href="/becas" style={{
            display: 'inline-block', background: 'var(--red)', color: '#fff',
            padding: '12px 26px', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem',
          }}>
            ← Volver a becas
          </Link>
        </div>
      </main>
    );
  }

  const [statusBg, statusFg] = STATUS_COLORS[beca.status] ?? ['#f1f1f1', 'var(--muted)'];
  const depts = departmentNames(beca);

  const metadata = [
    ['Tipo', TYPE_LABEL[beca.type] ?? beca.type],
    ['Cobertura', beca.coverage ? (COVERAGE_LABEL[beca.coverage] ?? beca.coverage) : 'No especificada'],
    ['Fecha de apertura', fmtDate(beca.openingDate) ?? 'No especificada'],
    ['Fecha de cierre', fmtDate(beca.closingDate) ?? 'No especificada'],
  ];

  return (
    <main style={{ background: 'var(--bg)', minHeight: 'calc(100vh - 56px)', padding: '0 0 60px' }}>
      {/* HEADER */}
      <section style={{ background: 'var(--red)', padding: '30px 6% 44px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px)',
          backgroundSize: '48px 48px', pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '820px' }}>
          {/* BREADCRUMB */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '20px', flexWrap: 'wrap' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.7)' }}>Inicio</Link>
            <span>→</span>
            <Link href="/becas" style={{ color: 'rgba(255,255,255,0.7)' }}>Becas</Link>
            <span>→</span>
            <span style={{ color: 'var(--yellow)' }}>{beca.title}</span>
          </nav>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <span style={{ padding: '3px 11px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700, background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
              {TYPE_LABEL[beca.type] ?? beca.type}
            </span>
            {beca.coverage && (
              <span style={{ padding: '3px 11px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700, background: 'var(--yellow)', color: 'var(--red-dark)' }}>
                {COVERAGE_LABEL[beca.coverage] ?? beca.coverage}
              </span>
            )}
            <span style={{ padding: '3px 11px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700, background: statusBg, color: statusFg }}>
              {STATUS_LABEL[beca.status] ?? beca.status}
            </span>
          </div>

          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 'clamp(2rem,5vw,3.2rem)', fontWeight: 700, color: '#fff', lineHeight: 1.05, textTransform: 'uppercase' }}>
            {beca.title}
          </h1>

          {beca.provider?.name && (
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)', marginTop: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span aria-hidden>🏛️</span>
              {beca.provider.name}{beca.provider.acronym ? ` (${beca.provider.acronym})` : ''}
            </p>
          )}
        </div>
      </section>

      {/* BODY */}
      <div style={{ maxWidth: '980px', margin: '0 auto', padding: '32px 6% 0', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '28px', alignItems: 'start' }}>
        {/* MAIN COLUMN */}
        <div style={{ display: 'grid', gap: '18px' }}>
          {beca.description && (
            <section style={{ background: 'var(--white)', borderRadius: '8px', border: '1px solid var(--border)', borderTop: '4px solid var(--red)', padding: '24px 26px' }}>
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.3rem', fontWeight: 700, color: 'var(--red)', marginBottom: '12px', textTransform: 'uppercase' }}>
                Descripción
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.7 }}>{beca.description}</p>
            </section>
          )}

          {/* METADATOS */}
          <section style={{ background: 'var(--white)', borderRadius: '8px', border: '1px solid var(--border)', borderTop: '4px solid var(--yellow)', padding: '24px 26px' }}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.3rem', fontWeight: 700, color: 'var(--red)', marginBottom: '16px', textTransform: 'uppercase' }}>
              Datos clave
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '18px' }}>
              {metadata.map(([label, value]) => (
                <div key={label}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>{label}</div>
                  <div style={{ fontSize: '0.92rem', color: 'var(--text)', fontWeight: 700 }}>{value}</div>
                </div>
              ))}
            </div>
          </section>

          {/* REQUISITOS */}
          <section style={{ background: 'var(--white)', borderRadius: '8px', border: '1px solid var(--border)', borderTop: '4px solid var(--red)', padding: '24px 26px' }}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.3rem', fontWeight: 700, color: 'var(--red)', marginBottom: '16px', textTransform: 'uppercase' }}>
              Requisitos
            </h2>
            {beca.requirements?.length ? (
              <ul style={{ listStyle: 'none', display: 'grid', gap: '12px' }}>
                {beca.requirements.map((r: any) => {
                  const req = r.requirement ?? r;
                  const detail = renderRequirementValue(req.value);
                  return (
                    <li key={req.id ?? req.type} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--red)', fontWeight: 800, lineHeight: 1.4 }}>✓</span>
                      <div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.4 }}>
                          {req.label ?? req.type}
                        </div>
                        {detail && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '2px' }}>{detail}</div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p style={{ fontSize: '0.86rem', color: 'var(--muted)' }}>Esta convocatoria no especifica requisitos formales.</p>
            )}
          </section>

          {/* DEPARTAMENTOS */}
          <section style={{ background: 'var(--white)', borderRadius: '8px', border: '1px solid var(--border)', borderTop: '4px solid var(--yellow)', padding: '24px 26px' }}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.3rem', fontWeight: 700, color: 'var(--red)', marginBottom: '16px', textTransform: 'uppercase' }}>
              Departamentos donde aplica
            </h2>
            {depts.length ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {depts.map(name => (
                  <span key={name} style={{ padding: '5px 13px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600, background: 'var(--bg-light)', color: 'var(--red)' }}>
                    {name}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.86rem', color: 'var(--muted)' }}>Aplica a nivel nacional, sin restricción de departamento.</p>
            )}
          </section>
        </div>

        {/* SIDEBAR */}
        <aside style={{ display: 'grid', gap: '16px', position: 'sticky', top: '76px' }}>
          <section style={{ background: 'var(--white)', borderRadius: '8px', border: '1px solid var(--border)', borderTop: '4px solid var(--red)', padding: '22px 22px' }}>
            <h3 style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '14px' }}>
              Proveedor
            </h3>
            <div style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span aria-hidden>🏛️</span>
              {beca.provider?.name ?? 'No especificado'}
            </div>
            {beca.provider?.type && (
              <div style={{ fontSize: '0.76rem', color: 'var(--muted)', marginTop: '3px' }}>{beca.provider.type}</div>
            )}
            {beca.provider?.website && (
              <a href={beca.provider.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--red)', display: 'inline-block', marginTop: '10px' }}>
                Sitio web →
              </a>
            )}
          </section>

          {beca.officialUrl && (
            <a href={beca.officialUrl} target="_blank" rel="noopener noreferrer" style={{
              display: 'block', textAlign: 'center', background: 'var(--red)', color: '#fff',
              padding: '16px 20px', borderRadius: '8px', fontWeight: 700, fontSize: '0.95rem',
            }}>
              Ir al enlace oficial ↗
            </a>
          )}

          {beca.applicationUrl && (
            <a href={beca.applicationUrl} target="_blank" rel="noopener noreferrer" style={{
              display: 'block', textAlign: 'center', background: 'var(--white)', color: 'var(--red)',
              border: '2px solid var(--red)', padding: '14px 20px', borderRadius: '8px',
              fontWeight: 700, fontSize: '0.88rem',
            }}>
              Aplicar ahora ↗
            </a>
          )}
        </aside>
      </div>
    </main>
  );
}
