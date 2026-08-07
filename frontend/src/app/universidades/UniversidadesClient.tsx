'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { REGIONS, DANE_TO_REGION, type RegionKey } from '../becas/regions';

const TYPE_LABEL: Record<string, string> = { PUBLICA: 'Pública', PRIVADA: 'Privada' };

const FILTERS: [string, string][] = [
  ['', 'Todas'],
  ['PUBLICA', 'Pública'],
  ['PRIVADA', 'Privada'],
];

function formatCOP(value: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}

function withOfficialUrl(website?: string) {
  if (!website) return undefined;
  return website.startsWith('http') ? website : `https://${website}`;
}

function keyOf(u: any, idx: number) {
  return String(u.id ?? u.name ?? idx);
}

export default function UniversidadesClient({ universities }: { universities: any[] }) {
  const [tipo, setTipo] = useState('');
  const [q, setQ] = useState('');
  const [region, setRegion] = useState<RegionKey | ''>('');
  const [regionOpen, setRegionOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (regionRef.current && !regionRef.current.contains(e.target as Node)) setRegionOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const result = universities.filter(u => {
      if (tipo && u.type !== tipo) return false;
      if (region && DANE_TO_REGION[u.department?.daneCode] !== region) return false;
      if (q && !u.name?.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });

    // Orden por rankingUnirank ascendente; las que no tienen ranking quedan al final.
    return result.sort((a, b) => {
      const diff = (a.rankingUnirank ?? 999) - (b.rankingUnirank ?? 999);
      if (diff !== 0) return diff;
      return (a.name ?? '').localeCompare(b.name ?? '');
    });
  }, [universities, tipo, region, q]);

  const selectedIdx = selectedKey ? filtered.findIndex((u, i) => keyOf(u, i) === selectedKey) : -1;
  const selected = selectedIdx >= 0 ? filtered[selectedIdx] : filtered[0];
  const selectedRank = selectedIdx >= 0 ? selectedIdx : 0;

  return (
    <main style={{ background: 'var(--bg)', minHeight: 'calc(100vh - 56px)' }}>
      {/* HEADER */}
      <section style={{ background: 'var(--red)', padding: '40px 6% 32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px)',
          backgroundSize: '48px 48px', pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--yellow)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ display: 'inline-block', width: '28px', height: '2px', background: 'var(--yellow)' }} />
            Directorio de Universidades
          </div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 'clamp(2rem,5vw,3.2rem)', fontWeight: 700, color: '#fff', lineHeight: 1.05, textTransform: 'uppercase' }}>
            Instituciones acreditadas
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', maxWidth: '520px', lineHeight: 1.7, marginTop: '10px' }}>
            Explora universidades públicas y privadas en todo el territorio colombiano, ordenadas por ranking QS Latinoamérica.
          </p>
        </div>
      </section>

      {/* TOOLBAR */}
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '18px 6%', display: 'flex', gap: '18px', flexWrap: 'wrap', alignItems: 'center', position: 'sticky', top: '56px', zIndex: 50 }}>
        <input
          type="text" value={q} onChange={e => setQ(e.target.value)}
          placeholder="Buscar universidad por nombre..."
          style={{ flex: '1 1 260px', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.86rem', fontFamily: 'inherit', outline: 'none' }}
        />
        <div style={{ display: 'flex', gap: '6px' }}>
          {FILTERS.map(([val, lbl]) => (
            <button key={val} onClick={() => setTipo(val)} style={{
              padding: '8px 16px', borderRadius: '20px', fontSize: '0.76rem',
              fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              border: tipo === val ? 'none' : '1px solid var(--border)',
              background: tipo === val ? 'var(--red)' : 'var(--white)',
              color: tipo === val ? '#fff' : 'var(--muted)',
            }}>{lbl}</button>
          ))}
        </div>

        <div ref={regionRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setRegionOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px', borderRadius: '20px', fontSize: '0.76rem',
              fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              border: region ? 'none' : '1px solid var(--border)',
              background: region ? 'var(--red)' : 'var(--white)',
              color: region ? '#fff' : 'var(--muted)',
            }}
          >
            {region ? `Región: ${REGIONS.find(r => r.key === region)?.label}` : 'Región'}
            <span style={{ fontSize: '0.6rem', transform: regionOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}>▼</span>
          </button>

          {regionOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 60,
              background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '10px',
              boxShadow: '0 12px 28px -8px rgba(0,0,0,0.2)', minWidth: '200px', overflow: 'hidden',
            }}>
              <button
                onClick={() => { setRegion(''); setRegionOpen(false); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px',
                  fontSize: '0.8rem', fontWeight: region === '' ? 700 : 500, fontFamily: 'inherit',
                  border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                  background: region === '' ? 'var(--bg-light)' : 'var(--white)', color: 'var(--text)',
                }}
              >
                Todas las regiones
              </button>
              {REGIONS.map(r => (
                <button
                  key={r.key}
                  onClick={() => { setRegion(r.key); setRegionOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', width: '100%', textAlign: 'left', padding: '10px 16px',
                    fontSize: '0.8rem', fontWeight: region === r.key ? 700 : 500, fontFamily: 'inherit',
                    border: 'none', cursor: 'pointer',
                    background: region === r.key ? 'var(--bg-light)' : 'var(--white)', color: 'var(--text)',
                  }}
                >
                  <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RESULTS */}
      <div style={{ padding: '26px 6%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase' }}>
            Universidades
          </h2>
          <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
            {filtered.length} institución{filtered.length !== 1 ? 'es' : ''}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px', color: 'var(--muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🏛️</div>
            No hay universidades que coincidan con tu búsqueda.
          </div>
        ) : (
          <div className="uni-split">
            {/* POPUP — detalle de la universidad seleccionada */}
            <div className="uni-popup-slot">
              {selected && (
                <UniversityPopup
                  key={keyOf(selected, selectedRank)}
                  u={selected}
                  rank={selectedRank + 1}
                />
              )}
            </div>

            {/* LISTA — filas horizontales enumeradas por ranking */}
            <div className="uni-list">
              {filtered.map((u: any, idx: number) => {
                const isPublica = u.type === 'PUBLICA';
                const accent = isPublica ? 'var(--red)' : 'var(--yellow)';
                const ranking = u.rankingQsLatam ?? u.rankingQsWorld;
                const key = keyOf(u, idx);
                const isSelected = key === keyOf(selected, selectedRank);

                return (
                  <div
                    key={key}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedKey(key)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedKey(key); } }}
                    className="uni-row"
                    style={{
                      borderLeft: `4px solid ${isSelected ? accent : 'transparent'}`,
                      background: isSelected ? 'var(--bg-light)' : 'var(--white)',
                    }}
                  >
                    <span className="uni-row-rank" style={{ color: isSelected ? accent : 'var(--muted)' }}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>

                    <span className="uni-row-main">
                      {u.rankingUnirank && (
                        <span className="uni-pill" style={{ alignSelf: 'flex-start', background: 'var(--bg-light)', color: 'var(--muted)', marginBottom: '2px' }}>
                          #{u.rankingUnirank} Colombia
                        </span>
                      )}
                      <span className="uni-row-name">{u.name}</span>
                      {(u.city || u.department?.name) && (
                        <span className="uni-row-city">
                          📍 {[u.city, u.department?.name].filter(Boolean).join(', ')}
                        </span>
                      )}
                      {u.description && (
                        <span className="uni-row-description">{u.description}</span>
                      )}
                    </span>

                    <span className="uni-row-badges">
                      {u.type && (
                        <span className="uni-pill" style={{ background: isPublica ? 'var(--bg-light)' : '#fff3d6', color: isPublica ? 'var(--red)' : '#a97400' }}>
                          {TYPE_LABEL[u.type] ?? u.type}
                        </span>
                      )}
                      {u.accreditationType?.includes('10 años') && (
                        <span className="uni-pill" style={{ background: 'var(--yellow)', color: '#4a3600' }}>
                          Alta Calidad 10 años
                        </span>
                      )}
                      {ranking && (
                        <span className="uni-pill" style={{ background: isSelected ? accent : 'var(--border)', color: isSelected ? (isPublica ? '#fff' : '#4a3600') : 'var(--muted)' }}>
                          QS {u.rankingQsLatam ? 'Latam' : 'Mundial'} #{ranking}
                        </span>
                      )}
                    </span>

                    {u.id != null ? (
                      <Link
                        href={`/universidades/${u.id}`}
                        onClick={e => e.stopPropagation()}
                        className="uni-row-arrow"
                        style={{ opacity: isSelected ? 1 : 0.35 }}
                        title="Ver perfil completo"
                      >
                        →
                      </Link>
                    ) : (
                      <span className="uni-row-arrow" style={{ opacity: isSelected ? 1 : 0.35 }}>→</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .uni-split {
          display: grid;
          grid-template-columns: minmax(300px, 380px) 1fr;
          gap: 24px;
          align-items: start;
        }
        .uni-popup-slot {
          position: sticky;
          top: 128px;
        }
        .uni-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .uni-row {
          display: flex;
          align-items: center;
          gap: 14px;
          width: 100%;
          text-align: left;
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 12px 16px;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .uni-row:hover {
          background: var(--bg-light);
        }
        .uni-row-rank {
          flex-shrink: 0;
          width: 34px;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 1.3rem;
          font-weight: 700;
        }
        .uni-row-main {
          flex: 1 1 auto;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .uni-row-name {
          font-size: 0.92rem;
          font-weight: 700;
          color: var(--text);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .uni-row-city {
          font-size: 0.72rem;
          color: var(--muted);
        }
        .uni-row-description {
          font-size: 0.74rem;
          color: var(--muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-top: 1px;
        }
        .uni-row-badges {
          flex-shrink: 0;
          display: flex;
          gap: 6px;
        }
        .uni-pill {
          padding: 2px 9px;
          border-radius: 20px;
          font-size: 0.64rem;
          font-weight: 700;
          white-space: nowrap;
        }
        .uni-row-arrow {
          flex-shrink: 0;
          font-size: 0.9rem;
          color: var(--red);
        }
        @media (max-width: 860px) {
          .uni-split {
            grid-template-columns: 1fr;
          }
          .uni-popup-slot {
            position: static;
          }
          .uni-row-badges {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}

function UniversityPopup({ u, rank }: { u: any; rank: number }) {
  const isPublica = u.type === 'PUBLICA';
  const accent = isPublica ? 'var(--red)' : 'var(--yellow)';
  const officialUrl = withOfficialUrl(u.website);
  const enrollmentUrl = withOfficialUrl(u.enrollmentUrl);
  const hasRichInfo = Boolean(u.description || u.notes || u.tuitionMin || u.tuitionMax || u.accreditationDetail || u.highlightedPrograms);

  return (
    <div className="uni-popup" style={{ borderTop: `5px solid ${accent}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <span style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.6rem', fontWeight: 700,
          color: accent, lineHeight: 1,
        }}>
          #{rank}
        </span>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {u.type && (
            <span className="uni-pill" style={{ background: isPublica ? 'var(--bg-light)' : '#fff3d6', color: isPublica ? 'var(--red)' : '#a97400' }}>
              {TYPE_LABEL[u.type] ?? u.type}
            </span>
          )}
          {u.accreditation && (
            <span className="uni-pill" style={{ background: 'var(--border)', color: 'var(--muted)' }}>
              Acreditada{u.accreditationDetail?.includes('10 años') ? ' · 10 años' : ''}
            </span>
          )}
          {u.accreditationType === 'Sí - 10 años' && (
            <span className="uni-pill" style={{ background: 'var(--yellow)', color: '#4a3600' }}>
              ⭐ Acreditación 10 años
            </span>
          )}
        </div>
      </div>

      <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.5rem', fontWeight: 700, marginBottom: '6px', lineHeight: 1.1, color: 'var(--text)' }}>
        {u.name}
      </h3>

      {(u.city || u.department?.name) && (
        <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '12px' }}>
          📍 {[u.city, u.department?.name].filter(Boolean).join(', ')}
          {u.foundedYear ? ` · Fundada en ${u.foundedYear}` : ''}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' }}>
        {u.rankingUnirank && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text)' }}>🇨🇴 Ranking Colombia #{u.rankingUnirank}</p>
        )}
        {u.rankingQsLatam && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text)' }}>🏆 QS Latam #{u.rankingQsLatam}</p>
        )}
        {u.rankingQsWorld && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text)' }}>🌐 Ranking QS Mundial: #{u.rankingQsWorld}</p>
        )}
      </div>

      {u.description && (
        <p style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '12px' }}>
          {u.description}
        </p>
      )}

      {u.highlightedPrograms && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text)', lineHeight: 1.55, marginBottom: '12px' }}>
          ✨ {u.highlightedPrograms}
        </p>
      )}

      {u.featuredPrograms?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '12px' }}>
          {u.featuredPrograms.map((p: string) => (
            <span key={p} className="uni-pill" style={{ background: 'var(--bg-light)', color: 'var(--red)' }}>
              {p}
            </span>
          ))}
        </div>
      )}

      {(u.tuitionMin || u.tuitionMax) && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text)', marginBottom: '8px' }}>
          💰 Matrícula: {u.tuitionMin ? formatCOP(u.tuitionMin) : '—'}
          {u.tuitionMax ? ` a ${formatCOP(u.tuitionMax)}` : ''}
        </p>
      )}

      {u.notes && (
        <p style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.55, fontStyle: 'italic', marginBottom: '8px' }}>
          {u.notes}
        </p>
      )}

      {!hasRichInfo && (
        <p style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.55, marginBottom: '8px' }}>
          Aún no tenemos información detallada de esta universidad.
          {officialUrl ? ' Consulta su página oficial para más datos.' : ''}
        </p>
      )}

      {u.id != null && (
        <Link href={`/universidades/${u.id}`} style={{
          display: 'block', textAlign: 'center', background: accent, color: isPublica ? '#fff' : '#4a3600',
          padding: '11px 20px', borderRadius: '6px', fontWeight: 700, fontSize: '0.84rem', marginTop: '14px',
        }}>
          Ver perfil completo →
        </Link>
      )}

      <div style={{ marginTop: '14px', display: 'flex', gap: '14px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
        {officialUrl && (
          <a href={officialUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.78rem', fontWeight: 700, color: isPublica ? 'var(--red)' : '#a97400' }}>
            Página oficial →
          </a>
        )}
        {enrollmentUrl && (
          <a href={enrollmentUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--red)' }}>
            Matrícula ↗
          </a>
        )}
      </div>

      <style jsx>{`
        .uni-popup {
          background: var(--white);
          border-radius: 12px;
          padding: 24px 26px;
          box-shadow: 0 18px 40px -12px rgba(0, 0, 0, 0.22), 0 4px 12px rgba(0, 0, 0, 0.06);
          animation: uni-popup-in 0.18s ease-out;
          max-height: calc(100vh - 160px);
          overflow-y: auto;
        }
        @keyframes uni-popup-in {
          from { opacity: 0; transform: translateY(6px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .uni-pill {
          padding: 2px 9px;
          border-radius: 20px;
          font-size: 0.66rem;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
