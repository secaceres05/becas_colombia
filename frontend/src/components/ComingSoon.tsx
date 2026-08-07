import Link from 'next/link';

export default function ComingSoon({
  eyebrow,
  title,
  description,
  icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <main style={{
      background: 'var(--red)',
      minHeight: 'calc(100vh - 56px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '60px 6%', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px)',
        backgroundSize: '48px 48px', pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '560px' }}>
        <div style={{ fontSize: '3.4rem', marginBottom: '20px' }}>{icon}</div>
        <div style={{
          fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: 'var(--yellow)', marginBottom: '18px',
        }}>
          {eyebrow}
        </div>
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 'clamp(2.8rem,8vw,5rem)', fontWeight: 700,
          color: '#fff', lineHeight: 1, marginBottom: '18px', textTransform: 'uppercase',
        }}>
          {title}
        </h1>
        <div style={{
          display: 'inline-block', background: 'var(--yellow)', color: 'var(--red-dark)',
          padding: '6px 18px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700,
          letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '26px',
        }}>
          Próximamente
        </div>
        <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.75, marginBottom: '34px' }}>
          {description}
        </p>
        <Link href="/" style={{
          display: 'inline-block', background: 'var(--white)', color: 'var(--red)',
          padding: '13px 28px', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem',
        }}>
          ← Volver al inicio
        </Link>
      </div>
    </main>
  );
}
