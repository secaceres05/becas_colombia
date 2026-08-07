import Link from 'next/link';
import LogoutButton from './LogoutButton';

const LINKS = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/becas', label: 'Becas', icon: '🎓', badgeKey: 'pending' as const },
  { href: '/admin/revision', label: 'Cola de revisión', icon: '🕓' },
  { href: '/admin/universidades', label: 'Universidades', icon: '🏛️' },
  { href: '/admin/admisiones', label: 'Admisiones', icon: '📅' },
];

export default function Sidebar({ pendingCount }: { pendingCount: number }) {
  return (
    <aside style={{
      width: '240px', flexShrink: 0, minHeight: 'calc(100vh - 56px)',
      background: '#1a0a0a', display: 'flex', flexDirection: 'column',
      padding: '22px 16px', position: 'sticky', top: '56px',
    }}>
      <div style={{
        fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.15rem', fontWeight: 700,
        color: '#fff', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '4px', padding: '0 4px',
      }}>
        Becas <span style={{ color: 'var(--yellow)' }}>Colombia</span>
      </div>
      <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', marginBottom: '26px', padding: '0 4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Panel de administración
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {LINKS.map(link => (
          <Link key={link.href} href={link.href} style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px',
            borderRadius: '6px', color: 'rgba(255,255,255,0.85)', fontSize: '0.86rem', fontWeight: 600,
          }}>
            <span aria-hidden>{link.icon}</span>
            <span style={{ flex: 1 }}>{link.label}</span>
            {link.badgeKey === 'pending' && pendingCount > 0 && (
              <span style={{
                background: 'var(--red)', color: '#fff', fontSize: '0.68rem', fontWeight: 700,
                borderRadius: '20px', padding: '1px 8px', minWidth: '20px', textAlign: 'center',
              }}>
                {pendingCount}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <LogoutButton />
    </aside>
  );
}
