'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/admin/route-handlers/auth/refresh', { method: 'POST' });
        if (res.ok) {
          router.replace('/admin');
          router.refresh();
          return;
        }
      } catch {}
      if (!cancelled) setChecking(false);
    })();
    return () => { cancelled = true; };
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/admin/route-handlers/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? 'Correo o contraseña incorrectos.');
        setLoading(false);
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch {
      setError('No pudimos conectar con el servidor. Intenta de nuevo.');
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main style={{
        minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>Restaurando tu sesión…</p>
      </main>
    );
  }

  return (
    <main style={{
      minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 6%',
    }}>
      <div style={{
        width: '100%', maxWidth: '380px', background: 'var(--white)',
        border: '1px solid var(--border)', borderTop: '4px solid var(--red)',
        borderRadius: '8px', padding: '34px 32px',
      }}>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.15rem', fontWeight: 700,
          color: 'var(--text)', textTransform: 'uppercase', marginBottom: '4px',
        }}>
          Becas <span style={{ color: 'var(--red)' }}>Colombia</span>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '26px' }}>
          Panel de administración
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
              Correo electrónico
            </label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@becas.com"
              style={{
                width: '100%', padding: '10px 12px', border: '1px solid var(--border)',
                borderRadius: '6px', fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
              Contraseña
            </label>
            <input
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%', padding: '10px 12px', border: '1px solid var(--border)',
                borderRadius: '6px', fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: '#fdeaea', color: '#c0392b', fontSize: '0.8rem', fontWeight: 600,
              padding: '10px 12px', borderRadius: '6px',
            }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', background: 'var(--red)', color: '#fff', border: 'none',
            padding: '12px 20px', borderRadius: '6px', fontWeight: 700, fontSize: '0.88rem',
            fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            marginTop: '4px',
          }}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </main>
  );
}
