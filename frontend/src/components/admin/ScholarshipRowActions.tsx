'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch } from '@/lib/adminFetch';

export default function ScholarshipRowActions({ id, needsReview }: { id: number; needsReview: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function publish() {
    setError('');
    startTransition(async () => {
      const res = await adminFetch(`/admin/route-handlers/scholarships/${id}/publish`, { method: 'PATCH' });
      if (!res.ok) {
        setError(res.status === 401
          ? 'Tu sesión expiró. Inicia sesión de nuevo.'
          : 'No se pudo publicar.');
        return;
      }
      router.refresh();
    });
  }

  function remove() {
    if (!window.confirm('¿Eliminar esta beca? Esta acción no se puede deshacer.')) return;
    setError('');
    startTransition(async () => {
      const res = await adminFetch(`/admin/route-handlers/scholarships/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        setError(res.status === 401
          ? 'Tu sesión expiró. Inicia sesión de nuevo.'
          : 'No se pudo eliminar.');
        return;
      }
      router.refresh();
    });
  }

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
      {needsReview && (
        <button onClick={publish} disabled={isPending} style={{
          background: 'var(--red)', color: '#fff', border: 'none', padding: '6px 14px',
          borderRadius: '5px', fontSize: '0.76rem', fontWeight: 700, fontFamily: 'inherit',
          cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.6 : 1,
        }}>
          Publicar
        </button>
      )}
      <button onClick={remove} disabled={isPending} style={{
        background: 'var(--white)', color: '#c0392b', border: '1px solid #c0392b', padding: '6px 14px',
        borderRadius: '5px', fontSize: '0.76rem', fontWeight: 700, fontFamily: 'inherit',
        cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.6 : 1,
      }}>
        Eliminar
      </button>
      {error && <span style={{ fontSize: '0.72rem', color: '#c0392b' }}>{error}</span>}
    </div>
  );
}
