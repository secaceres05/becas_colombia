'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUniversities, getUniversityPrograms } from '@/lib/api';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid var(--border)',
  borderRadius: '6px', fontSize: '0.86rem', fontFamily: 'inherit', outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px',
};

function fmtDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtCost(cost: any, currency: string) {
  if (cost === null || cost === undefined) return '—';
  const n = Number(cost);
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: currency || 'COP', maximumFractionDigits: 0 }).format(n);
}

function estadoDe(calendar: any) {
  const closesAt = calendar?.closesAt;
  if (!closesAt) return { label: 'Sin fecha', bg: '#f1f1f1', fg: 'var(--muted)' };
  const closes = new Date(closesAt);
  if (Number.isNaN(closes.getTime())) return { label: 'Sin fecha', bg: '#f1f1f1', fg: 'var(--muted)' };
  const now = new Date();
  if (closes < now) return { label: 'Cerrado', bg: '#f1f1f1', fg: 'var(--muted)' };
  const opensAt = calendar?.opensAt ? new Date(calendar.opensAt) : null;
  if (opensAt && opensAt > now) return { label: 'Próximo', bg: '#fff3d6', fg: '#a97400' };
  return { label: 'Abierto', bg: '#e8f7ee', fg: '#1e7a41' };
}

type Process = {
  id: number;
  university: { id: number; name: string };
  program?: { id: number; name: string } | null;
  cost: any;
  currency: string;
  calendar: any;
};

export default function AdmissionsManager({ processes }: { processes: Process[] }) {
  const router = useRouter();
  const [universities, setUniversities] = useState<{ id: number; name: string }[]>([]);
  const [programs, setPrograms] = useState<{ id: number; name: string }[]>([]);
  const [form, setForm] = useState({
    universityId: '', programId: '', opensAt: '', closesAt: '',
    registrationUrl: '', cost: '', currency: 'COP', steps: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [loadingUniversities, setLoadingUniversities] = useState(true);

  useEffect(() => {
    getUniversities({ limit: '300', sort: 'name' })
      .then(({ data }) => setUniversities((data ?? []).map((u: any) => ({ id: u.id, name: u.name }))))
      .catch(() => setUniversities([]))
      .finally(() => setLoadingUniversities(false));
  }, []);

  useEffect(() => {
    if (!form.universityId) {
      setPrograms([]);
      return;
    }
    getUniversityPrograms(form.universityId)
      .then((data: any) => setPrograms((data?.programs ?? []).map((p: any) => ({ id: p.id, name: p.name }))))
      .catch(() => setPrograms([]));
  }, [form.universityId]);

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.universityId) {
      setError('Selecciona una universidad.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/admin/route-handlers/admission-processes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          universityId: Number(form.universityId),
          programId: form.programId ? Number(form.programId) : undefined,
          registrationUrl: form.registrationUrl || undefined,
          cost: form.cost || undefined,
          currency: form.currency,
          calendar: { opensAt: form.opensAt || undefined, closesAt: form.closesAt || undefined },
          steps: form.steps
            ? form.steps.split('\n').map(s => s.trim()).filter(Boolean)
            : [],
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? 'No se pudo crear el proceso de admisión.');
        setLoading(false);
        return;
      }

      setForm({ universityId: '', programId: '', opensAt: '', closesAt: '', registrationUrl: '', cost: '', currency: 'COP', steps: '' });
      router.refresh();
    } catch {
      setError('No pudimos conectar con el servidor. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('¿Eliminar este proceso de admisión? Esta acción no se puede deshacer.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/admin/route-handlers/admission-processes/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        setError('No se pudo eliminar el proceso.');
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
              {['Universidad', 'Programa', 'Inicio inscripción', 'Cierre', 'Costo', 'Estado', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '12px 16px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {processes.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--muted)' }}>
                  Aún no hay procesos de admisión registrados.
                </td>
              </tr>
            ) : processes.map(p => {
              const estado = estadoDe(p.calendar);
              return (
                <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text)' }}>{p.university?.name ?? '—'}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{p.program?.name ?? 'General'}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{fmtDate(p.calendar?.opensAt)}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{fmtDate(p.calendar?.closesAt)}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{fmtCost(p.cost, p.currency)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, background: estado.bg, color: estado.fg }}>
                      {estado.label}
                    </span>
                  </td>
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
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.3rem', fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', marginBottom: '14px' }}>
        Nuevo proceso de admisión
      </h2>

      <form onSubmit={handleCreate} style={{
        background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '8px',
        padding: '24px 26px', display: 'grid', gap: '16px', maxWidth: '680px',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Universidad</label>
            <select required style={inputStyle} value={form.universityId} onChange={e => { set('universityId', e.target.value); set('programId', ''); }}>
              <option value="">{loadingUniversities ? 'Cargando…' : 'Selecciona una universidad'}</option>
              {universities.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Programa (opcional)</label>
            <select style={inputStyle} value={form.programId} onChange={e => set('programId', e.target.value)} disabled={!form.universityId}>
              <option value="">General (toda la universidad)</option>
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Inicio de inscripción</label>
            <input type="date" style={inputStyle} value={form.opensAt} onChange={e => set('opensAt', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Cierre de inscripción</label>
            <input type="date" style={inputStyle} value={form.closesAt} onChange={e => set('closesAt', e.target.value)} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>URL de inscripción</label>
          <input type="url" style={inputStyle} value={form.registrationUrl} onChange={e => set('registrationUrl', e.target.value)} placeholder="https://…" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Costo</label>
            <input type="number" style={inputStyle} value={form.cost} onChange={e => set('cost', e.target.value)} placeholder="Ej. 350000" />
          </div>
          <div>
            <label style={labelStyle}>Moneda</label>
            <select style={inputStyle} value={form.currency} onChange={e => set('currency', e.target.value)}>
              <option value="COP">COP</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Pasos del proceso (uno por línea)</label>
          <textarea rows={4} style={{ ...inputStyle, resize: 'vertical' }} value={form.steps} onChange={e => set('steps', e.target.value)} placeholder={'Inscripción en línea\nPago de derechos de grado\nPresentación de examen de admisión'} />
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
            {loading ? 'Guardando…' : 'Crear proceso'}
          </button>
        </div>
      </form>
    </div>
  );
}
