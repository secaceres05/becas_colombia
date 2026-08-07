'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import ColombiaMap from '@/components/ColombiaMap';
import { REGIONS, scholarshipRegions, type RegionKey } from './regions';

export default function BecasClient({ becas }: { becas: any[] }) {
  const [region, setRegion] = useState<RegionKey | ''>('');
  const [estado, setEstado] = useState('');
  const [q, setQ] = useState('');

  const toggleRegion = (r: string) => {
    setRegion(prev => (prev === r ? '' : (r as RegionKey)));
  };

  const filtered = useMemo(() => becas.filter(b => {
    if (b.type !== 'NACIONAL') return false;
    if (estado && b.status !== estado) return false;
    if (region) {
      const regions = scholarshipRegions(b);
      if (regions.length > 0 && !regions.includes(region)) return false;
    }
    if (q && !b.title.toLowerCase().includes(q.toLowerCase()) &&
        !b.description?.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [becas, estado, region, q]);

  return (
    <main style={{ background: 'var(--bg)', minHeight: 'calc(100vh - 56px)' }}>
      {/* HEADER */}
      <section style={{ background: 'var(--red)', padding: '38px 6% 32px' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--yellow)', marginBottom: '10px' }}>
          Becas nacionales
        </div>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>
          Convocatorias por región
        </h1>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px,420px) 1fr', gap: '0' }}>
        {/* MAPA */}
        <aside style={{
          padding: '28px 24px', borderRight: '1px solid var(--border)',
          position: 'sticky', top: '56px', height: 'calc(100vh - 56px)',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '10px' }}>
            Filtrar por región
          </div>

          <ColombiaMap
            activeRegion={region}
            onRegionClick={toggleRegion}
            onReset={() => setRegion('')}
          />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px' }}>
            {REGIONS.map(r => (
              <button key={r.key} onClick={() => toggleRegion(r.key)} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '5px 11px', borderRadius: '20px', fontSize: '0.72rem',
                fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                border: region === r.key ? '2px solid var(--yellow)' : '1px solid var(--border)',
                background: region === r.key ? 'var(--bg-light)' : 'var(--white)',
                color: 'var(--text)',
              }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: r.color, display: 'inline-block' }} />
                {r.label}
              </button>
            ))}
          </div>
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
            {[
              { label: 'Estado', value: estado, set: setEstado, options: [['', 'Todos'], ['VIGENTE', 'Vigente'], ['PROXIMA', 'Próxima'], ['CERRADA', 'Cerrada']] },
            ].map(({ label, value, set, options }) => (
              <div key={label} style={{ display: 'flex', gap: '5px' }}>
                {options.map(([val, lbl]) => (
                  <button key={val} onClick={() => set(val)} style={{
                    padding: '7px 12px', borderRadius: '20px', fontSize: '0.72rem',
                    fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    border: value === val ? 'none' : '1px solid var(--border)',
                    background: value === val ? 'var(--red)' : 'var(--white)',
                    color: value === val ? '#fff' : 'var(--muted)',
                  }}>{lbl}</button>
                ))}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.3rem', fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase' }}>
              {region ? `Región ${REGIONS.find(r => r.key === region)?.label}` : 'Todas las convocatorias'}
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
              {filtered.map((b: any) => (
                <Link key={b.id} href={`/becas/${b.slug}`} style={{
                  display: 'flex', alignItems: 'center', gap: '18px',
                  padding: '18px 6px', borderBottom: '1px solid var(--border)',
                }}>
                  <div style={{
                    width: '5px', alignSelf: 'stretch', borderRadius: '3px', flexShrink: 0,
                    background: b.type === 'NACIONAL' ? 'var(--red)' : 'var(--yellow)',
                  }} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <span style={{ padding: '2px 9px', borderRadius: '20px', fontSize: '0.66rem', fontWeight: 700, background: 'var(--bg-light)', color: 'var(--red)' }}>
                        {b.type === 'NACIONAL' ? 'Nacional' : 'Internacional'}
                      </span>
                      <span style={{ padding: '2px 9px', borderRadius: '20px', fontSize: '0.66rem', fontWeight: 700, background: '#fff3d6', color: '#a97400' }}>
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
                    {b.provider?.name && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600, marginTop: '3px' }}>{b.provider.name}</div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>
                      {b.closingDate ? `Cierra ${new Date(b.closingDate).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Sin cierre'}
                    </span>
                    <span style={{ fontSize: '1.3rem', color: 'var(--red)', fontWeight: 700 }}>→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
