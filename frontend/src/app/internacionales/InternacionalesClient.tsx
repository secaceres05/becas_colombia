'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import ContinentSelector from '@/components/ContinentSelector';
import { scholarshipContinent, scholarshipCountry, type ContinentKey } from './continents';

export default function InternacionalesClient({ becas }: { becas: any[] }) {
  const [continent, setContinent] = useState<ContinentKey | ''>('');
  const [estado, setEstado] = useState('');
  const [q, setQ] = useState('');

  const toggleContinent = (c: string) => {
    setContinent(prev => (prev === c ? '' : (c as ContinentKey)));
  };

  const filtered = useMemo(() => becas.filter(b => {
    if (estado && b.status !== estado) return false;
    if (continent && scholarshipContinent(b) !== continent) return false;
    if (q && !b.title.toLowerCase().includes(q.toLowerCase()) &&
        !b.description?.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [becas, estado, continent, q]);

  return (
    <main style={{ background: 'var(--bg)', minHeight: 'calc(100vh - 56px)' }}>
      {/* HEADER */}
      <section style={{ background: 'var(--red)', padding: '38px 6% 32px' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--yellow)', marginBottom: '10px' }}>
          Becas internacionales
        </div>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>
          Convocatorias por continente
        </h1>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '0' }}>
        {/* SELECTOR DE CONTINENTE */}
        <aside style={{
          padding: '28px 24px', borderRight: '1px solid var(--border)',
          position: 'sticky', top: '56px', height: 'calc(100vh - 56px)',
          display: 'flex', flexDirection: 'column', overflowY: 'auto',
        }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '14px' }}>
            Filtrar por continente
          </div>

          <ContinentSelector
            activeContinent={continent}
            onSelect={toggleContinent}
            onReset={() => setContinent('')}
          />
        </aside>

        {/* LISTA */}
        <div style={{ padding: '26px 28px' }}>
          {/* TOOLBAR */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
            <input
              type="text" value={q} onChange={e => setQ(e.target.value)}
              placeholder="Buscar beca..."
              style={{ flex: '1 1 220px', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.84rem', fontFamily: 'inherit', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '5px' }}>
              {[['', 'Todos'], ['VIGENTE', 'Vigente'], ['PROXIMA', 'Próxima'], ['CERRADA', 'Cerrada']].map(([val, lbl]) => (
                <button key={val} onClick={() => setEstado(val)} style={{
                  padding: '7px 12px', borderRadius: '20px', fontSize: '0.72rem',
                  fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  border: estado === val ? 'none' : '1px solid var(--border)',
                  background: estado === val ? 'var(--red)' : 'var(--white)',
                  color: estado === val ? '#fff' : 'var(--muted)',
                }}>{lbl}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.3rem', fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase' }}>
              {continent ? `Becas en ${continent}` : 'Todas las convocatorias'}
            </h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
              {filtered.length} beca{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📭</div>
              No hay becas con esos filtros.
            </div>
          ) : (
            <div style={{ marginTop: '10px', borderTop: '1px solid var(--border)' }}>
              {filtered.map((b: any) => {
                const country = scholarshipCountry(b);
                return (
                  <Link key={b.id} href={`/becas/${b.slug}`} style={{
                    display: 'flex', alignItems: 'center', gap: '18px',
                    padding: '18px 6px', borderBottom: '1px solid var(--border)',
                  }}>
                    <div style={{
                      width: '5px', alignSelf: 'stretch', borderRadius: '3px', flexShrink: 0,
                      background: 'var(--yellow)',
                    }} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <span style={{ padding: '2px 9px', borderRadius: '20px', fontSize: '0.66rem', fontWeight: 700, background: '#fff3d6', color: '#a97400' }}>
                          Internacional
                        </span>
                        <span style={{ padding: '2px 9px', borderRadius: '20px', fontSize: '0.66rem', fontWeight: 700, background: 'var(--bg-light)', color: 'var(--red)' }}>
                          {b.coverage === 'TOTAL' ? 'Cobertura total' : 'Parcial'}
                        </span>
                        <span style={{
                          padding: '2px 9px', borderRadius: '20px', fontSize: '0.66rem', fontWeight: 700,
                          background: b.status === 'VIGENTE' ? '#e8f7ee' : '#f1f1f1',
                          color: b.status === 'VIGENTE' ? '#1e7a41' : 'var(--muted)',
                        }}>
                          {b.status}
                        </span>
                      </div>
                      <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.4rem', fontWeight: 700, lineHeight: 1.15, color: 'var(--text)' }}>
                        {b.title}
                      </h3>
                      <div style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600, marginTop: '3px' }}>
                        {[b.provider?.name, country].filter(Boolean).join(' · ')}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>
                        {b.closingDate ? `Cierra ${new Date(b.closingDate).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Sin cierre'}
                      </span>
                      <span style={{ fontSize: '1.3rem', color: 'var(--red)', fontWeight: 700 }}>→</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
