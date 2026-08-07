'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch('/admin/route-handlers/auth', { method: 'DELETE' });
    } finally {
      router.push('/admin/login');
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
        padding: '11px 14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.12)',
        background: 'transparent', color: 'rgba(255,255,255,0.75)',
        fontSize: '0.84rem', fontWeight: 600, fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
      }}
    >
      <span aria-hidden>⏻</span>
      {loading ? 'Cerrando sesión…' : 'Cerrar sesión'}
    </button>
  );
}
