'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { REGIONS, REGION_TO_DANE_CODES, CONTINENTS, type RegionKey } from '@/app/becas/regions';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid var(--border)',
  borderRadius: '6px', fontSize: '0.86rem', fontFamily: 'inherit', outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px',
};

export default function NuevaBecaPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    type: 'NACIONAL',
    coverage: 'TOTAL',
    status: 'PROXIMA',
    description: '',
    official_url: '',
    application_url: '',
    opening_date: '',
    closing_date: '',
    provider_name: '',
  });
  const [regions, setRegions] = useState<RegionKey[]>([]);
  const [continents, setContinents] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function toggleRegion(region: RegionKey) {
    setRegions(prev => prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]);
  }

  function toggleContinent(continent: string) {
    setContinents(prev => prev.includes(continent) ? prev.filter(c => c !== continent) : [...prev, continent]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // El campo "Estado" queda registrado en el formulario para referencia del equipo,
    // pero /ingest siempre crea la beca como PROXIMA + pendiente de revisión.
    const payload: Record<string, unknown> = {
      title: form.title,
      type: form.type,
      coverage: form.coverage,
      description: form.description || undefined,
      official_url: form.official_url,
      application_url: form.application_url || undefined,
      opening_date: form.opening_date || undefined,
      closing_date: form.closing_date || undefined,
      provider_name: form.provider_name || undefined,
      source_name: 'Panel de administración',
      department_codes: form.type === 'NACIONAL' && regions.length > 0
        ? regions.flatMap(r => REGION_TO_DANE_CODES[r])
        : undefined,
      continents: form.type === 'INTERNACIONAL' && continents.length > 0 ? continents : undefined,
    };

    try {
      const res = await fetch('/admin/route-handlers/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? 'No se pudo guardar la beca. Revisa los campos.');
        setLoading(false);
        return;
      }

      router.push('/admin/becas');
      router.refresh();
    } catch {
      setError('No pudimos conectar con el servidor. Intenta de nuevo.');
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '680px' }}>
      <Link href="/admin/becas" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--red)', display: 'inline-block', marginBottom: '14px' }}>
        ← Volver a becas
      </Link>
      <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.8rem', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
        Nueva beca
      </h1>
      <p style={{ fontSize: '0.86rem', color: 'var(--muted)', marginBottom: '26px' }}>
        Carga manual de una convocatoria. Quedará pendiente de revisión hasta que la publiques.
      </p>

      <form onSubmit={handleSubmit} style={{
        background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '8px',
        padding: '28px 30px', display: 'grid', gap: '18px',
      }}>
        <div>
          <label style={labelStyle}>Título</label>
          <input required style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ej. Beca Excelencia Académica 2027" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '18px' }}>
          <div>
            <label style={labelStyle}>Tipo</label>
            <select required style={inputStyle} value={form.type} onChange={e => set('type', e.target.value)}>
              <option value="NACIONAL">Nacional</option>
              <option value="INTERNACIONAL">Internacional</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Cobertura</label>
            <select required style={inputStyle} value={form.coverage} onChange={e => set('coverage', e.target.value)}>
              <option value="TOTAL">Total</option>
              <option value="PARCIAL">Parcial</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Estado</label>
            <select required style={inputStyle} value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="VIGENTE">Vigente</option>
              <option value="PROXIMA">Próxima</option>
              <option value="CERRADA">Cerrada</option>
            </select>
          </div>
        </div>

        {form.type === 'NACIONAL' ? (
          <div>
            <label style={labelStyle}>Restringir a región (opcional — sin selección aplica a todo el país)</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {REGIONS.map(r => (
                <button
                  key={r.key} type="button" onClick={() => toggleRegion(r.key)}
                  style={{
                    padding: '7px 14px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700,
                    border: regions.includes(r.key) ? 'none' : '1px solid var(--border)',
                    background: regions.includes(r.key) ? r.color : 'var(--white)',
                    color: regions.includes(r.key) ? '#fff' : 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <label style={labelStyle}>Restringir a continente (opcional — sin selección aplica a todo el mundo)</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {CONTINENTS.map(c => (
                <button
                  key={c} type="button" onClick={() => toggleContinent(c)}
                  style={{
                    padding: '7px 14px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700,
                    border: continents.includes(c) ? 'none' : '1px solid var(--border)',
                    background: continents.includes(c) ? 'var(--red)' : 'var(--white)',
                    color: continents.includes(c) ? '#fff' : 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label style={labelStyle}>Descripción</label>
          <textarea rows={4} style={{ ...inputStyle, resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Detalle de la convocatoria…" />
        </div>

        <div>
          <label style={labelStyle}>URL oficial</label>
          <input required type="url" style={inputStyle} value={form.official_url} onChange={e => set('official_url', e.target.value)} placeholder="https://…" />
        </div>

        <div>
          <label style={labelStyle}>URL de aplicación (opcional)</label>
          <input type="url" style={inputStyle} value={form.application_url} onChange={e => set('application_url', e.target.value)} placeholder="https://…" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '18px' }}>
          <div>
            <label style={labelStyle}>Fecha apertura (opcional)</label>
            <input type="date" style={inputStyle} value={form.opening_date} onChange={e => set('opening_date', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Fecha cierre</label>
            <input required type="date" style={inputStyle} value={form.closing_date} onChange={e => set('closing_date', e.target.value)} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Nombre del proveedor</label>
          <input style={inputStyle} value={form.provider_name} onChange={e => set('provider_name', e.target.value)} placeholder="Ej. ICETEX, Universidad Nacional…" />
        </div>

        {error && (
          <div style={{ background: '#fdeaea', color: '#c0392b', fontSize: '0.82rem', fontWeight: 600, padding: '10px 12px', borderRadius: '6px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
          <button type="submit" disabled={loading} style={{
            background: 'var(--red)', color: '#fff', border: 'none', padding: '12px 24px',
            borderRadius: '6px', fontWeight: 700, fontSize: '0.86rem', fontFamily: 'inherit',
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Guardando…' : 'Guardar beca'}
          </button>
          <Link href="/admin/becas" style={{
            display: 'inline-flex', alignItems: 'center', padding: '12px 24px',
            border: '1px solid var(--border)', borderRadius: '6px', fontWeight: 700, fontSize: '0.86rem', color: 'var(--muted)',
          }}>
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
