'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid var(--border)',
  borderRadius: '6px', fontSize: '0.86rem', fontFamily: 'inherit', outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px',
};

const LEVEL_LABEL: Record<string, string> = {
  TECNICO: 'Técnico',
  TECNOLOGO: 'Tecnólogo',
  PREGRADO: 'Pregrado',
  POSGRADO: 'Posgrado',
  MAESTRIA: 'Maestría',
  DOCTORADO: 'Doctorado',
};

type Program = {
  id: number;
  name: string;
  level: string;
  areaKnowledge?: string | null;
  accredited: boolean;
  sniesCode?: string | null;
};

export default function ProgramsManager({ universityId, programs }: { universityId: number; programs: Program[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', level: 'PREGRADO', areaKnowledge: '', sniesCode: '', accredited: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.level) {
      setError('Nombre y nivel son obligatorios.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/admin/route-handlers/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          universityId,
          name: form.name.trim(),
          level: form.level,
          areaKnowledge: form.areaKnowledge || undefined,
          sniesCode: form.sniesCode || undefined,
          accredited: form.accredited,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? 'No se pudo crear el programa.');
        setLoading(false);
        return;
      }

      setForm({ name: '', level: 'PREGRADO', areaKnowledge: '', sniesCode: '', accredited: false });
      router.refresh();
    } catch {
      setError('No pudimos conectar con el servidor. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('¿Eliminar este programa? Esta acción no se puede deshacer.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/admin/route-handlers/programs/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        setError('No se pudo eliminar el programa.');
        return;
      }
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'auto', marginBottom: '26px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
              {['Nombre', 'Nivel', 'Área de conocimiento', 'Acreditado', 'SNIES', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '12px 16px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {programs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--muted)' }}>
                  Aún no hay programas registrados.
                </td>
              </tr>
            ) : programs.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text)' }}>{p.name}</td>
                <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{LEVEL_LABEL[p.level] ?? p.level}</td>
                <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{p.areaKnowledge ?? '—'}</td>
                <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{p.accredited ? 'Sí' : 'No'}</td>
                <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{p.sniesCode ?? '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <button onClick={() => handleDelete(p.id)} disabled={deletingId === p.id} style={{
                    background: 'var(--white)', color: '#c0392b', border: '1px solid #c0392b', padding: '6px 14px',
                    borderRadius: '5px', fontSize: '0.76rem', fontWeight: 700, fontFamily: 'inherit',
                    cursor: deletingId === p.id ? 'not-allowed' : 'pointer', opacity: deletingId === p.id ? 0.6 : 1,
                  }}>
                    {deletingId === p.id ? 'Eliminando…' : 'Eliminar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.3rem', fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', marginBottom: '14px' }}>
        Nuevo programa
      </h2>

      <form onSubmit={handleCreate} style={{
        background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '8px',
        padding: '24px 26px', display: 'grid', gap: '16px', maxWidth: '620px',
      }}>
        <div>
          <label style={labelStyle}>Nombre del programa</label>
          <input required style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej. Ingeniería de Sistemas" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Nivel</label>
            <select required style={inputStyle} value={form.level} onChange={e => set('level', e.target.value)}>
              {Object.entries(LEVEL_LABEL).map(([val, lbl]) => (
                <option key={val} value={val}>{lbl}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Área de conocimiento</label>
            <input style={inputStyle} value={form.areaKnowledge} onChange={e => set('areaKnowledge', e.target.value)} placeholder="Ej. Ingeniería" />
          </div>
          <div>
            <label style={labelStyle}>Código SNIES</label>
            <input style={inputStyle} value={form.sniesCode} onChange={e => set('sniesCode', e.target.value)} placeholder="Ej. 1234" />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            id="accredited" type="checkbox" checked={form.accredited}
            onChange={e => set('accredited', e.target.checked)}
            style={{ width: '16px', height: '16px' }}
          />
          <label htmlFor="accredited" style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text)' }}>Acreditado</label>
        </div>

        {error && (
          <div style={{ background: '#fdeaea', color: '#c0392b', fontSize: '0.82rem', fontWeight: 600, padding: '10px 12px', borderRadius: '6px' }}>
            {error}
          </div>
        )}

        <div>
          <button type="submit" disabled={loading} style={{
            background: 'var(--red)', color: '#fff', border: 'none', padding: '12px 24px',
            borderRadius: '6px', fontWeight: 700, fontSize: '0.86rem', fontFamily: 'inherit',
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Guardando…' : 'Agregar programa'}
          </button>
        </div>
      </form>
    </div>
  );
}
