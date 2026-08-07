'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Inicio' },
  { href: '/universidades', label: 'Directorio' },
  { href: '/becas', label: 'Becas nacionales' },
  { href: '/internacionales', label: 'Becas internacionales' },
  { href: '/admisiones', label: 'Admisiones' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header style={{
      background: 'var(--red)',
      borderBottom: '4px solid var(--yellow)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 4%',
    }}>
      <Link href="/" style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 700,
        fontSize: '1.15rem',
        color: '#fff',
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
      }}>
        Becas <span style={{ fontWeight: 400, opacity: 0.8 }}>Colombia</span>
      </Link>

      <nav style={{ display: 'flex' }}>
        {links.map(({ href, label }) => (
          <Link key={href} href={href} style={{
            color: pathname === href ? 'var(--yellow)' : '#ffffff',
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '0 14px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            borderBottom: pathname === href ? '3px solid var(--yellow)' : '3px solid transparent',
            marginBottom: '-4px',
            transition: '0.15s',
          }}>
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
