import Link from 'next/link';

export const metadata = {
  title: 'Fechas de Admisión 2025 | Becas Colombia',
  description: 'Calendarios de admisión de las principales universidades colombianas. Consulta fechas de inscripción, exámenes y resultados.',
};

const PASOS = [
  { numero: '01', titulo: 'Consulta las fechas de inscripción', desc: 'Revisa el calendario oficial de la universidad de tu interés para no perder la fecha límite.' },
  { numero: '02', titulo: 'Reúne los documentos requeridos', desc: 'Diploma de bachiller, resultados de pruebas Saber 11, documento de identidad y demás soportes.' },
  { numero: '03', titulo: 'Presenta el examen de admisión', desc: 'Algunas universidades exigen un examen propio de admisión; otras solo piden el puntaje Saber 11.' },
  { numero: '04', titulo: 'Espera resultados y formaliza tu matrícula', desc: 'Consulta los resultados en las fechas indicadas y completa el proceso de matrícula financiera y académica.' },
];

const UNIVERSIDADES = [
  { nombre: 'Universidad Nacional de Colombia', tipo: 'Pública', ciudad: 'Bogotá, Bogotá D.C.' },
  { nombre: 'Universidad de los Andes', tipo: 'Privada', ciudad: 'Bogotá, Bogotá D.C.' },
  { nombre: 'Pontificia Universidad Javeriana', tipo: 'Privada', ciudad: 'Bogotá, Bogotá D.C.' },
  { nombre: 'Universidad de Antioquia', tipo: 'Pública', ciudad: 'Medellín, Antioquia' },
  { nombre: 'Universidad del Valle', tipo: 'Pública', ciudad: 'Cali, Valle del Cauca' },
  { nombre: 'Universidad del Norte', tipo: 'Privada', ciudad: 'Barranquilla, Atlántico' },
];

export default function AdmisionesPage() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: 'calc(100vh - 56px)' }}>
      {/* HERO */}
      <section style={{ background: 'var(--red)', padding: '38px 6% 32px' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--yellow)', marginBottom: '10px' }}>
          Calendarios de admisión
        </div>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>
          Fechas de Admisión 2025-II / 2026-I
        </h1>
      </section>

      {/* AVISO */}
      <div style={{ padding: '26px 6% 0' }}>
        <div style={{
          maxWidth: '980px', margin: '0 auto', background: 'var(--bg-light)',
          border: '1px solid var(--border)', borderLeft: '4px solid var(--yellow)',
          borderRadius: '8px', padding: '18px 22px', display: 'flex', gap: '12px', alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: '1.2rem' }} aria-hidden>📋</span>
          <p style={{ fontSize: '0.86rem', color: 'var(--text)', lineHeight: 1.65 }}>
            Estamos consolidando los calendarios oficiales de las principales universidades colombianas.
            La información se actualizará progresivamente.
          </p>
        </div>
      </div>

      {/* CÓMO FUNCIONA */}
      <div style={{ padding: '40px 6% 10px' }}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.6rem', fontWeight: 700, color: 'var(--red)',
          textTransform: 'uppercase', textAlign: 'center', marginBottom: '26px',
        }}>
          ¿Cómo funciona el proceso?
        </h2>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '16px',
          maxWidth: '1080px', margin: '0 auto',
        }}>
          {PASOS.map(paso => (
            <div key={paso.numero} style={{
              background: 'var(--white)', border: '1px solid var(--border)', borderTop: '4px solid var(--red)',
              borderRadius: '8px', padding: '22px 20px',
            }}>
              <span style={{
                fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2rem', fontWeight: 700,
                color: 'var(--yellow)', lineHeight: 1, display: 'block', marginBottom: '10px',
              }}>
                {paso.numero}
              </span>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.35, marginBottom: '8px' }}>
                {paso.titulo}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.6 }}>
                {paso.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* UNIVERSIDADES CON ADMISIÓN PRÓXIMA */}
      <div style={{ padding: '46px 6% 10px' }}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.6rem', fontWeight: 700, color: 'var(--red)',
          textTransform: 'uppercase', textAlign: 'center', marginBottom: '26px',
        }}>
          Universidades con admisión abierta próximamente
        </h2>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '16px',
          maxWidth: '1080px', margin: '0 auto',
        }}>
          {UNIVERSIDADES.map(u => {
            const isPublica = u.tipo === 'Pública';
            return (
              <Link key={u.nombre} href="/universidades" style={{
                display: 'block', background: 'var(--white)', border: '1px solid var(--border)',
                borderTop: `4px solid ${isPublica ? 'var(--red)' : 'var(--yellow)'}`,
                borderRadius: '8px', padding: '22px 24px',
              }}>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <span style={{
                    padding: '2px 9px', borderRadius: '20px', fontSize: '0.66rem', fontWeight: 700,
                    background: isPublica ? 'var(--bg-light)' : '#fff3d6', color: isPublica ? 'var(--red)' : '#a97400',
                  }}>
                    {u.tipo}
                  </span>
                  <span style={{
                    padding: '2px 9px', borderRadius: '20px', fontSize: '0.66rem', fontWeight: 700,
                    background: 'var(--yellow)', color: 'var(--red-dark)',
                  }}>
                    Fechas próximamente
                  </span>
                </div>
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2, marginBottom: '6px' }}>
                  {u.nombre}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>📍 {u.ciudad}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* CTA FINAL */}
      <div style={{ padding: '50px 6% 60px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)', marginBottom: '18px' }}>
          ¿Buscas una beca para financiar tu admisión?
        </h2>
        <Link href="/becas" style={{
          display: 'inline-block', background: 'var(--red)', color: '#fff',
          padding: '13px 30px', borderRadius: '6px', fontWeight: 700, fontSize: '0.9rem',
        }}>
          Explorar becas →
        </Link>
      </div>
    </main>
  );
}
