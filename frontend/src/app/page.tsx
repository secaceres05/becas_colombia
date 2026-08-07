import Link from 'next/link';
import { getScholarships } from '@/lib/api';

export const metadata = {
  title: 'Becas Colombia | Becas, Universidades y Admisiones',
  description: 'El directorio más completo de becas nacionales e internacionales, universidades y procesos de admisión para jóvenes colombianos.',
  openGraph: {
    title: 'Becas Colombia',
    description: 'Centraliza becas, universidades y calendarios de admisión para jóvenes colombianos.',
    url: 'https://becascolombia.com',
    siteName: 'Becas Colombia',
    locale: 'es_CO',
    type: 'website',
  },
};

export default async function Home() {
  const { data: becas } = await getScholarships({ limit: '3', status: 'VIGENTE' }).catch(() => ({ data: [] }));

  return (
    <main>
      {/* HERO */}
      <section style={{
        background: 'var(--red)',
        padding: '70px 6% 58px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px)',
          backgroundSize: '48px 48px',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '820px' }}>
          <div style={{
            fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'var(--yellow)',
            marginBottom: '26px', display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <span style={{ display: 'inline-block', width: '28px', height: '2px', background: 'var(--yellow)' }} />
            Becas Colombia · 2027
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', marginBottom: '18px', flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 'clamp(5.5rem,12vw,9.5rem)',
              fontWeight: 900, color: 'var(--yellow)', lineHeight: 0.85,
            }}>127</span>
            <span style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 'clamp(2rem,4vw,3.1rem)',
              fontWeight: 700, color: '#fff', lineHeight: 1, paddingBottom: '14px',
              textTransform: 'uppercase',
            }}>becas<br />disponibles</span>
          </div>

          <p style={{
            fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)',
            maxWidth: '480px', lineHeight: 1.75, marginBottom: '30px',
          }}>
            El directorio más completo de becas, universidades y calendarios de admisión para jóvenes colombianos.
          </p>

          <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
            {['48 internacionales', '32 departamentos', '18 entidades aliadas', 'Datos 2027 verificados'].map(chip => (
              <span key={chip} style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#ffffff',
                padding: '4px 12px', borderRadius: '20px',
                fontSize: '0.72rem', fontWeight: 600,
              }}>{chip}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ACCESS TILES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
        {[
          { href: '/universidades', icon: '🏛️', title: 'Directorio de Universidades', desc: '62 instituciones acreditadas en todo el territorio', color: 'var(--red)' },
          { href: '/becas', icon: '🎓', title: 'Becas Nacionales', desc: '79 convocatorias abiertas por región y entidad', color: 'var(--yellow)' },
          { href: '/internacionales', icon: '🌍', title: 'Becas Internacionales', desc: '48 oportunidades en América, Europa, Asia y Oceanía', color: 'var(--red)' },
          { href: '/admisiones', icon: '📅', title: 'Fechas de Admisión', desc: 'Calendarios 2027-I con semáforo de urgencia', color: 'var(--yellow)' },
        ].map(tile => (
          <Link key={tile.href} href={tile.href} style={{
            background: 'var(--white)', padding: '34px 26px',
            borderRight: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            position: 'relative', display: 'block',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              height: '4px', background: tile.color,
            }} />
            <div style={{ fontSize: '1.9rem', marginBottom: '14px' }}>{tile.icon}</div>
            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.15rem', fontWeight: 700, marginBottom: '7px', lineHeight: 1.2, textTransform: 'uppercase' }}>{tile.title}</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '18px', lineHeight: 1.55 }}>{tile.desc}</p>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: tile.color === 'var(--yellow)' ? '#a97400' : tile.color }}>Explorar →</span>
          </Link>
        ))}
      </div>

      {/* BECAS DESTACADAS */}
      {becas.length > 0 && (
        <section style={{ padding: '48px 6%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '24px' }}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.6rem', fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase' }}>
              Becas vigentes destacadas
            </h2>
            <Link href="/becas" style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>Ver todas →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>
            {becas.map((b: any) => (
              <Link key={b.id} href={`/becas/${b.slug}`} style={{
                background: 'var(--white)', padding: '20px 22px',
                borderRadius: '6px', border: '1px solid var(--border)',
                borderTop: '4px solid var(--red)', display: 'block',
              }}>
                <div style={{ display: 'flex', gap: '5px', marginBottom: '9px' }}>
                  <span style={{ padding: '2px 9px', borderRadius: '20px', fontSize: '0.66rem', fontWeight: 700, background: 'var(--bg-light)', color: 'var(--red)' }}>
                    {b.type === 'NACIONAL' ? 'Nacional' : 'Internacional'}
                  </span>
                  <span style={{ padding: '2px 9px', borderRadius: '20px', fontSize: '0.66rem', fontWeight: 700, background: '#fff3d6', color: '#a97400' }}>
                    Vigente
                  </span>
                </div>
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px', lineHeight: 1.2 }}>{b.title}</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.55 }}>
                  {b.description?.slice(0, 80)}...
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* PURPOSE */}
      <section style={{
        background: 'var(--red)', padding: '72px 6%',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '56px', alignItems: 'center',
      }}>
        <div style={{ color: '#fff' }}>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2.4rem', fontWeight: 700, color: 'var(--yellow)', marginBottom: '16px', textTransform: 'uppercase' }}>
            ¿Por qué nace este portal?
          </h2>
          <p style={{ fontSize: '0.92rem', opacity: 0.92, lineHeight: 1.75, marginBottom: '12px' }}>
            La educación de calidad no debe ser un laberinto. En Colombia, miles de oportunidades se pierden cada año porque la información está dispersa.
          </p>
          <p style={{ fontSize: '0.92rem', opacity: 0.92, lineHeight: 1.75 }}>
            Este Portal Único nace para centralizar, simplificar y democratizar el acceso a la educación superior.
          </p>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.1)', borderLeft: '5px solid var(--yellow)',
          padding: '30px', borderRadius: '0 10px 10px 0',
        }}>
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '14px', textTransform: 'uppercase' }}>Nuestros Pilares</h3>
          <ul style={{ padding: 0, listStyle: 'none' }}>
            {[
              ['Transparencia', 'Datos oficiales y verificados'],
              ['Inclusión', 'Oportunidades para todas las regiones'],
              ['Agilidad', 'Links directos a procesos oficiales'],
            ].map(([title, desc]) => (
              <li key={title} style={{ color: 'rgba(255,255,255,0.92)', fontSize: '0.88rem', marginBottom: '11px', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--yellow)' }}>{title}:</strong> {desc}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FUNDADOR */}
      <section style={{
        padding: '72px 6%',
        display: 'grid', gridTemplateColumns: '220px 1fr', gap: '44px', alignItems: 'center',
      }}>
        <img
          src="https://res.cloudinary.com/ddh6giatn/image/upload/v1784236581/WhatsApp_Image_2026-07-15_at_2.07.22_PM_aoibxz.jpg"
          alt="Nicolás Córdoba,  co-fundador de Becas Colombia"
          style={{
            width: '220px', height: '220px', objectFit: 'cover',
            borderRadius: '10px', border: '4px solid var(--yellow)',
          }}
        />
        <div>
          <div style={{
            fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'var(--red)',
            marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <span style={{ display: 'inline-block', width: '28px', height: '2px', background: 'var(--red)' }} />
            Co-fundador
          </div>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2rem', fontWeight: 700, marginBottom: '14px', textTransform: 'uppercase' }}>
            Nicolás Córdoba
          </h2>
          <p style={{ fontSize: '0.92rem', color: 'var(--muted)', lineHeight: 1.75 }}>
            Soy Nicolás Córdoba, consejero de juventudes de la localidad de Ciudad Bolívar. Actualmente estudio Derecho y Economía en la Universidad de los Andes, donde busco complementar mi interés por los asuntos públicos, las políticas públicas y el desarrollo social con una formación interdisciplinaria. Me apasiona el baloncesto, un deporte que me ha enseñado el valor del trabajo en equipo, la disciplina y la constancia. También disfruto del rap, un género que considero una forma de expresión artística y social que refleja realidades, ideas y experiencias desde diferentes perspectivas.
          </p>
        </div>
      </section>

      {/* COFUNDADOR */}
      <section style={{
        padding: '72px 6%',
        display: 'grid', gridTemplateColumns: '1fr 220px', gap: '44px', alignItems: 'center',
      }}>
        <div>
          <div style={{
            fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'var(--red)',
            marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <span style={{ display: 'inline-block', width: '28px', height: '2px', background: 'var(--red)' }} />
            Co-fundador
          </div>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2rem', fontWeight: 700, marginBottom: '14px', textTransform: 'uppercase' }}>
            Sebastián Cáceres
          </h2>
          <p style={{ fontSize: '0.92rem', color: 'var(--muted)', lineHeight: 1.75 }}>
            Soy Sebastián Cáceres, actualmente estudiante de Ingeniería Mecánica en la Universidad de los Andes gracias a que soy beneficiario de la Beca de Bachilleres Ecopetrol Mario Galán Gómez. Al egresar de un colegio público, sé lo complejo que es tener que buscar becas y universidades a la hora de acceder a la educación superior. Por esto, me encuentro muy contento de desarrollar esta página para todos ustedes.
          </p>
        </div>
        <img
          src="https://res.cloudinary.com/ddh6giatn/image/upload/v1785120042/WhatsApp_Image_2026-06-01_at_5.05.42_PM_atyb6n.jpg"
          alt="Sebastián Cáceres, cofundador de Becas Colombia"
          style={{
            width: '220px', height: '220px', objectFit: 'cover',
            borderRadius: '10px', border: '4px solid var(--yellow)',
          }}
        />
      </section>

      {/* CTA */}
      <section style={{
        background: 'var(--yellow)', padding: '56px 6%',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '40px', flexWrap: 'wrap',
      }}>
        <div>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2rem', fontWeight: 700, color: 'var(--red-dark)', marginBottom: '7px', textTransform: 'uppercase' }}>
            ¿No sabes por dónde empezar?
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'rgba(156,2,32,0.75)' }}>
            Explora el directorio para ver qué carreras conectan con lo que te apasiona.
          </p>
        </div>
        <Link href="/universidades" style={{
          background: 'var(--red-dark)', color: '#fff',
          padding: '13px 28px', borderRadius: '6px',
          fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap',
        }}>
          Empezar a explorar ahora
        </Link>
      </section>

      <footer style={{ background: '#111111', color: '#fff', padding: '44px 6%', textAlign: 'center' }}>
        <p style={{ opacity: 0.55, fontSize: '0.8rem', marginBottom: '5px' }}>© 2027 Becas Colombia</p>
        <p style={{ opacity: 0.4, fontSize: '0.75rem' }}>Diseñado para que ningún joven se quede sin oportunidades.</p>
      </footer>
    </main>
  );
}
