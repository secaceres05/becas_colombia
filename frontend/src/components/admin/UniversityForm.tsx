'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid var(--border)',
  borderRadius: '6px', fontSize: '0.86rem', fontFamily: 'inherit', outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px',
};

type Department = { id: number; name: string; daneCode: string };

type University = {
  id?: number;
  name?: string;
  city?: string;
  type?: string;
  departmentId?: number;
  department?: { id: number };
  accreditation?: boolean;
  accreditationDetail?: string | null;
  accreditationType?: string | null;
  website?: string | null;
  foundedYear?: number | null;
  rankingUnirank?: number | null;
  rankingQsWorld?: string | null;
  rankingQsLatam?: string | null;
  description?: string | null;
  highlightedPrograms?: string | null;
  enrollmentUrl?: string | null;
  notes?: string | null;
};

export default function UniversityForm({ departments, university }: { departments: Department[]; university?: University }) {
  const router = useRouter();
  const isEdit = Boolean(university?.id);

  const [form, setForm] = useState({
    name: university?.name ?? '',
    city: university?.city ?? '',
    type: university?.type ?? 'PUBLICA',
    departmentId: String(university?.departmentId ?? university?.department?.id ?? departments[0]?.id ?? ''),
    accreditation: university?.accreditation ?? false,
    accreditationType: university?.accreditationType ?? '',
    website: university?.website ?? '',
    foundedYear: university?.foundedYear != null ? String(university.foundedYear) : '',
    rankingUnirank: university?.rankingUnirank != null ? String(university.rankingUnirank) : '',
    rankingQsWorld: university?.rankingQsWorld ?? '',
    rankingQsLatam: university?.rankingQsLatam ?? '',
    description: university?.description ?? '',
    highlightedPrograms: university?.highlightedPrograms ?? '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.name.trim() || !form.city.trim() || !form.departmentId) {
      setError('Nombre, ciudad y departamento son obligatorios.');
      return;
    }

    setLoading(true);

    const payload = {
      name: form.name.trim(),
      city: form.city.trim(),
      type: form.type,
      departmentId: Number(form.departmentId),
      accreditation: form.accreditation,
      accreditationType: form.accreditationType || null,
      website: form.website || null,
      foundedYear: form.foundedYear || null,
      rankingUnirank: form.rankingUnirank || null,
      rankingQsWorld: form.rankingQsWorld || null,
      rankingQsLatam: form.rankingQsLatam || null,
      description: form.description || null,
      highlightedPrograms: form.highlightedPrograms || null,
    };

    try {
      const url = isEdit ? `/admin/route-handlers/universities/${university!.id}` : '/admin/route-handlers/universities';
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? 'No se pudo guardar la universidad.');
        setLoading(false);
        return;
      }

      if (isEdit) {
        setSuccess('Cambios guardados.');
        setLoading(false);
        router.refresh();
      } else {
        router.push('/admin/universidades');
        router.refresh();
      }
    } catch {
      setError('No pudimos conectar con el servidor. Intenta de nuevo.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{
      background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '8px',
      padding: '28px 30px', display: 'grid', gap: '18px',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '18px' }}>
        <div>
          <label style={labelStyle}>Nombre</label>
          <input required style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej. Universidad de los Andes" />
        </div>
        <div>
          <label style={labelStyle}>Ciudad</label>
          <input required style={inputStyle} value={form.city} onChange={e => set('city', e.target.value)} placeholder="Ej. Bogotá" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '18px' }}>
        <div>
          <label style={labelStyle}>Tipo</label>
          <select required style={inputStyle} value={form.type} onChange={e => set('type', e.target.value)}>
            <option value="PUBLICA">Pública</option>
            <option value="PRIVADA">Privada</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Departamento</label>
          <select required style={inputStyle} value={form.departmentId} onChange={e => set('departmentId', e.target.value)}>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          id="accreditation" type="checkbox" checked={form.accreditation}
          onChange={e => set('accreditation', e.target.checked)}
          style={{ width: '16px', height: '16px' }}
        />
        <label htmlFor="accreditation" style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text)' }}>Acreditada</label>
      </div>

      <div>
        <label style={labelStyle}>Tipo de acreditación</label>
        <input style={inputStyle} value={form.accreditationType} onChange={e => set('accreditationType', e.target.value)} placeholder='Ej. "Sí - 10 años"' />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '18px' }}>
        <div>
          <label style={labelStyle}>Sitio web</label>
          <input style={inputStyle} value={form.website} onChange={e => set('website', e.target.value)} placeholder="ejemplo.edu.co" />
        </div>
        <div>
          <label style={labelStyle}>Año de fundación</label>
          <input type="number" style={inputStyle} value={form.foundedYear} onChange={e => set('foundedYear', e.target.value)} placeholder="1948" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '18px' }}>
        <div>
          <label style={labelStyle}>Ranking uniRank</label>
          <input type="number" style={inputStyle} value={form.rankingUnirank} onChange={e => set('rankingUnirank', e.target.value)} placeholder="1" />
        </div>
        <div>
          <label style={labelStyle}>Ranking QS Mundial</label>
          <input style={inputStyle} value={form.rankingQsWorld} onChange={e => set('rankingQsWorld', e.target.value)} placeholder="233" />
        </div>
        <div>
          <label style={labelStyle}>Ranking QS Latam</label>
          <input style={inputStyle} value={form.rankingQsLatam} onChange={e => set('rankingQsLatam', e.target.value)} placeholder="8" />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Descripción</label>
        <textarea rows={4} style={{ ...inputStyle, resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Descripción de la universidad…" />
      </div>

      <div>
        <label style={labelStyle}>Programas destacados</label>
        <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={form.highlightedPrograms} onChange={e => set('highlightedPrograms', e.target.value)} placeholder="Ingeniería de Sistemas, Medicina, Derecho…" />
      </div>

      {error && (
        <div style={{ background: '#fdeaea', color: '#c0392b', fontSize: '0.82rem', fontWeight: 600, padding: '10px 12px', borderRadius: '6px' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: '#e8f7ee', color: '#1e7a41', fontSize: '0.82rem', fontWeight: 600, padding: '10px 12px', borderRadius: '6px' }}>
          {success}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
        <button type="submit" disabled={loading} style={{
          background: 'var(--red)', color: '#fff', border: 'none', padding: '12px 24px',
          borderRadius: '6px', fontWeight: 700, fontSize: '0.86rem', fontFamily: 'inherit',
          cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
        }}>
          {loading ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear universidad'}
        </button>
        {isEdit && (
          <Link href={`/admin/universidades/${university!.id}/programas`} style={{
            display: 'inline-flex', alignItems: 'center', padding: '12px 24px',
            border: '1px solid var(--red)', borderRadius: '6px', fontWeight: 700, fontSize: '0.86rem', color: 'var(--red)',
          }}>
            Gestionar programas →
          </Link>
        )}
        <Link href="/admin/universidades" style={{
          display: 'inline-flex', alignItems: 'center', padding: '12px 24px',
          border: '1px solid var(--border)', borderRadius: '6px', fontWeight: 700, fontSize: '0.86rem', color: 'var(--muted)',
        }}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
