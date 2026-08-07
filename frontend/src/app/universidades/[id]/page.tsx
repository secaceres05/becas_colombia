import Link from 'next/link';
import { getUniversityPrograms } from '@/lib/api';

const TYPE_LABEL: Record<string, string> = { PUBLICA: 'Pública', PRIVADA: 'Privada' };

const LEVEL_LABEL: Record<string, string> = {
  TECNICO: 'Técnico',
  TECNOLOGO: 'Tecnólogo',
  PREGRADO: 'Pregrado',
  POSGRADO: 'Posgrado',
  MAESTRIA: 'Maestría',
  DOCTORADO: 'Doctorado',
};

function withOfficialUrl(website?: string) {
  if (!website) return undefined;
  return website.startsWith('http') ? website : `https://${website}`;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getUniversityPrograms(id).catch(() => null);

  if (!data?.university) {
    return {
      title: 'Universidad no encontrada | Becas Colombia',
      description: 'No encontramos esta universidad en el directorio de Becas Colombia.',
    };
  }

  const { university } = data;
  return {
    title: `${university.name} | Becas Colombia`,
    description: university.description
      ?? `Programas académicos, admisión y datos de ${university.name}, universidad ${TYPE_LABEL[university.type]?.toLowerCase() ?? ''} ubicada en ${university.city}.`,
  };
}

export default async function UniversityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getUniversityPrograms(id).catch(() => null);

  if (!data?.university) {
    return (
      <main style={{
        background: 'var(--bg)', minHeight: 'calc(100vh - 56px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '60px 6%', textAlign: 'center',
      }}>
        <div style={{ maxWidth: '420px' }}>
          <div style={{ fontSize: '2.6rem', marginBottom: '18px' }}>🏛️</div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.8rem', fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', marginBottom: '10px' }}>
            No encontramos esta universidad
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.7, marginBottom: '26px' }}>
            Puede que el enlace esté desactualizado o la universidad no exista en nuestro directorio. Vuelve al listado para ver todas las instituciones disponibles.
          </p>
          <Link href="/universidades" style={{
            display: 'inline-block', background: 'var(--red)', color: '#fff',
            padding: '12px 26px', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem',
          }}>
            ← Volver al directorio
          </Link>
        </div>
      </main>
    );
  }

  const { university, programs } = data;
  const isPublica = university.type === 'PUBLICA';
  const accent = isPublica ? 'var(--red)' : 'var(--yellow)';
  const officialUrl = withOfficialUrl(university.website);

  return (
    <main style={{ background: 'var(--bg)', minHeight: 'calc(100vh - 56px)', padding: '0 0 60px' }}>
      {/* HEADER */}
      <section style={{ background: 'var(--red)', padding: '30px 6% 44px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px)',
          backgroundSize: '48px 48px', pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '860px' }}>
          {/* BREADCRUMB */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '20px', flexWrap: 'wrap' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.7)' }}>Inicio</Link>
            <span>→</span>
            <Link href="/universidades" style={{ color: 'rgba(255,255,255,0.7)' }}>Directorio</Link>
            <span>→</span>
            <span style={{ color: 'var(--yellow)' }}>{university.name}</span>
          </nav>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <span style={{ padding: '3px 11px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700, background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
              {TYPE_LABEL[university.type] ?? university.type}
            </span>
            {university.accreditation && (
              <span style={{ padding: '3px 11px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700, background: 'var(--yellow)', color: 'var(--red-dark)' }}>
                Acreditada{university.accreditationDetail?.includes('10 años') ? ' · 10 años' : ''}
              </span>
            )}
            {university.accreditationType && (
              <span style={{ padding: '3px 11px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700, background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                {university.accreditationType}
              </span>
            )}
          </div>

          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 'clamp(2rem,5vw,3.2rem)', fontWeight: 700, color: '#fff', lineHeight: 1.05, textTransform: 'uppercase' }}>
            {university.name}
          </h1>

          {(university.city || university.department?.name) && (
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)', marginTop: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span aria-hidden>📍</span>
              {[university.city, university.department?.name].filter(Boolean).join(', ')}
              {university.foundedYear ? ` · Fundada en ${university.foundedYear}` : ''}
            </p>
          )}

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '22px' }}>
            {officialUrl && (
              <a href={officialUrl} target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-block', background: '#fff', color: 'var(--red)',
                padding: '11px 22px', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem',
              }}>
                Visitar sitio oficial ↗
              </a>
            )}
            <a href="#admision" style={{
              display: 'inline-block', background: 'transparent', color: '#fff',
              border: '1.5px solid rgba(255,255,255,0.6)',
              padding: '11px 22px', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem',
            }}>
              Ver proceso de admisión
            </a>
          </div>
        </div>
      </section>

      {/* BODY */}
      <div style={{ maxWidth: '980px', margin: '0 auto', padding: '32px 6% 0' }}>
        {(university.rankingUnirank || university.rankingQsWorld || university.rankingQsLatam) && (
          <section style={{ background: 'var(--white)', borderRadius: '8px', border: '1px solid var(--border)', borderTop: '4px solid var(--yellow)', padding: '24px 26px', marginBottom: '24px' }}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.3rem', fontWeight: 700, color: 'var(--red)', marginBottom: '16px', textTransform: 'uppercase' }}>
              Rankings
            </h2>
            <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
              {university.rankingUnirank && (
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.8rem', fontWeight: 700, color: accent }}>#{university.rankingUnirank}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 600 }}>Ranking Colombia (uniRank)</div>
                </div>
              )}
              {university.rankingQsWorld && (
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.8rem', fontWeight: 700, color: accent }}>#{university.rankingQsWorld}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 600 }}>QS Mundial 2027</div>
                </div>
              )}
              {university.rankingQsLatam && (
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.8rem', fontWeight: 700, color: accent }}>#{university.rankingQsLatam}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 600 }}>QS Latam 2026</div>
                </div>
              )}
            </div>
          </section>
        )}

        {(university.description || university.foundedYear) && (
          <section style={{ background: 'var(--white)', borderRadius: '8px', border: '1px solid var(--border)', borderTop: '4px solid var(--red)', padding: '24px 26px', marginBottom: '24px' }}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.3rem', fontWeight: 700, color: 'var(--red)', marginBottom: '12px', textTransform: 'uppercase' }}>
              Sobre la universidad
            </h2>
            {university.description && (
              <p style={{ fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.7 }}>{university.description}</p>
            )}
            {university.foundedYear && (
              <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '10px', fontWeight: 600 }}>
                🏛️ Fundada en {university.foundedYear}
              </p>
            )}
          </section>
        )}

        {university.highlightedPrograms && (
          <section style={{ background: 'var(--white)', borderRadius: '8px', border: '1px solid var(--border)', borderTop: `4px solid ${accent}`, padding: '24px 26px', marginBottom: '24px' }}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.3rem', fontWeight: 700, color: 'var(--red)', marginBottom: '14px', textTransform: 'uppercase' }}>
              Programas destacados
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {university.highlightedPrograms.split(',').map((p: string) => p.trim()).filter(Boolean).map((p: string) => (
                <span key={p} style={{ padding: '5px 13px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600, background: 'var(--bg-light)', color: 'var(--red)' }}>
                  {p}
                </span>
              ))}
            </div>
          </section>
        )}

        {university.accreditationType && (
          <section style={{ background: 'var(--white)', borderRadius: '8px', border: '1px solid var(--border)', borderTop: '4px solid var(--yellow)', padding: '24px 26px', marginBottom: '24px' }}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.3rem', fontWeight: 700, color: 'var(--red)', marginBottom: '12px', textTransform: 'uppercase' }}>
              Acreditación
            </h2>
            <span style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 700, background: 'var(--yellow)', color: '#4a3600' }}>
              {university.accreditationType}
            </span>
            {university.accreditationDetail && (
              <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '10px' }}>{university.accreditationDetail}</p>
            )}
          </section>
        )}

        {officialUrl && (
          <section style={{ background: 'var(--white)', borderRadius: '8px', border: '1px solid var(--border)', borderTop: '4px solid var(--red)', padding: '24px 26px', marginBottom: '24px', textAlign: 'center' }}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.3rem', fontWeight: 700, color: 'var(--red)', marginBottom: '14px', textTransform: 'uppercase' }}>
              Sitio web
            </h2>
            <a href={officialUrl} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-block', background: 'var(--red)', color: '#fff',
              padding: '12px 28px', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem',
            }}>
              Visitar sitio oficial ↗
            </a>
          </section>
        )}

        {/* PROGRAMAS ACADÉMICOS */}
        <section style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase' }}>
              Programas académicos
            </h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
              {programs.length} programa{programs.length !== 1 ? 's' : ''}
            </span>
          </div>

          {programs.length === 0 ? (
            <div style={{
              background: 'var(--bg-light)', borderRadius: '8px', padding: '32px',
              textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem',
            }}>
              Aún no tenemos programas académicos registrados para esta universidad.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '14px' }}>
              {programs.map((p: any) => (
                <div key={p.id} style={{
                  background: 'var(--white)', padding: '20px 22px',
                  borderRadius: '6px', border: '1px solid var(--border)',
                  borderTop: `4px solid ${accent}`,
                }}>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    {p.level && (
                      <span style={{ padding: '2px 9px', borderRadius: '20px', fontSize: '0.66rem', fontWeight: 700, background: 'var(--bg-light)', color: 'var(--red)' }}>
                        {LEVEL_LABEL[p.level] ?? p.level}
                      </span>
                    )}
                    {p.accredited && (
                      <span style={{ padding: '2px 9px', borderRadius: '20px', fontSize: '0.66rem', fontWeight: 700, background: 'var(--border)', color: 'var(--muted)' }}>
                        Acreditado
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.25, color: 'var(--text)' }}>
                    {p.name}
                  </h3>
                  {p.areaKnowledge && (
                    <p style={{ fontSize: '0.76rem', color: 'var(--muted)', marginTop: '6px' }}>{p.areaKnowledge}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ADMISIÓN */}
        <section id="admision" style={{
          background: 'var(--bg-light)', borderRadius: '8px', border: '1px solid var(--border)',
          borderTop: '4px solid var(--yellow)', padding: '32px 26px', textAlign: 'center', marginBottom: '30px',
          scrollMarginTop: '76px',
        }}>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', marginBottom: '10px' }}>
            Proceso de admisión
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.7, maxWidth: '480px', margin: '0 auto' }}>
            Información de admisión próximamente disponible.
          </p>
        </section>

        {/* VOLVER */}
        <div style={{ textAlign: 'center', paddingBottom: '10px' }}>
          <Link href="/universidades" style={{
            display: 'inline-block', background: 'var(--white)', color: 'var(--red)',
            border: '1.5px solid var(--red)', padding: '11px 26px', borderRadius: '6px',
            fontWeight: 700, fontSize: '0.85rem',
          }}>
            ← Volver al directorio
          </Link>
        </div>
      </div>
    </main>
  );
}
