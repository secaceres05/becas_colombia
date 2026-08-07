import { PrismaClient, ProgramLevel } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';
import path from 'node:path';

config({ path: path.join(__dirname, '..', '.env') });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// BLOQUE 1 — Programas verificados en sitios oficiales - Julio 2026
// Fuentes: uniandes.edu.co, icesi.edu.co, uninorte.edu.co, eafit.edu.co

async function main() {
  console.log('Importando programas bloque 1 (4 universidades, verificados)...');

  const batch = [
    {
      nombre: 'Universidad de los Andes, Colombia',
      // 44 pregrados — fuente: uniandes.edu.co/es/oferta-academica/pregrados
      programas: [
        { nombre: 'Administración de Empresas', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Económicas', acreditado: true, snies: '' },
        { nombre: 'Economía', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Económicas', acreditado: true, snies: '' },
        { nombre: 'Biología', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Naturales', acreditado: true, snies: '' },
        { nombre: 'Física', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Exactas', acreditado: true, snies: '' },
        { nombre: 'Geociencias', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Naturales', acreditado: true, snies: '' },
        { nombre: 'Matemáticas', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Exactas', acreditado: true, snies: '' },
        { nombre: 'Microbiología', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Naturales', acreditado: true, snies: '' },
        { nombre: 'Química', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Exactas', acreditado: true, snies: '' },
        { nombre: 'Medicina', nivel: ProgramLevel.PREGRADO, area: 'Salud', acreditado: true, snies: '' },
        { nombre: 'Arquitectura', nivel: ProgramLevel.PREGRADO, area: 'Artes y Humanidades', acreditado: true, snies: '' },
        { nombre: 'Arte', nivel: ProgramLevel.PREGRADO, area: 'Artes y Humanidades', acreditado: true, snies: '' },
        { nombre: 'Diseño', nivel: ProgramLevel.PREGRADO, area: 'Artes y Humanidades', acreditado: true, snies: '' },
        { nombre: 'Historia del Arte', nivel: ProgramLevel.PREGRADO, area: 'Artes y Humanidades', acreditado: true, snies: '' },
        { nombre: 'Literatura', nivel: ProgramLevel.PREGRADO, area: 'Artes y Humanidades', acreditado: true, snies: '' },
        { nombre: 'Música', nivel: ProgramLevel.PREGRADO, area: 'Artes y Humanidades', acreditado: true, snies: '' },
        { nombre: 'Narrativas Digitales', nivel: ProgramLevel.PREGRADO, area: 'Artes y Humanidades', acreditado: true, snies: '' },
        { nombre: 'Ingeniería Ambiental', nivel: ProgramLevel.PREGRADO, area: 'Ingeniería', acreditado: true, snies: '' },
        { nombre: 'Ingeniería Biomédica', nivel: ProgramLevel.PREGRADO, area: 'Ingeniería', acreditado: true, snies: '' },
        { nombre: 'Ingeniería Civil', nivel: ProgramLevel.PREGRADO, area: 'Ingeniería', acreditado: true, snies: '' },
        { nombre: 'Ingeniería Eléctrica', nivel: ProgramLevel.PREGRADO, area: 'Ingeniería', acreditado: true, snies: '' },
        { nombre: 'Ingeniería Electrónica', nivel: ProgramLevel.PREGRADO, area: 'Ingeniería', acreditado: true, snies: '' },
        { nombre: 'Ingeniería Industrial', nivel: ProgramLevel.PREGRADO, area: 'Ingeniería', acreditado: true, snies: '' },
        { nombre: 'Ingeniería Mecánica', nivel: ProgramLevel.PREGRADO, area: 'Ingeniería', acreditado: true, snies: '' },
        { nombre: 'Ingeniería Química', nivel: ProgramLevel.PREGRADO, area: 'Ingeniería', acreditado: true, snies: '' },
        { nombre: 'Ingeniería de Sistemas y Computación', nivel: ProgramLevel.PREGRADO, area: 'Ingeniería', acreditado: true, snies: '' },
        { nombre: 'Ciencia de Datos', nivel: ProgramLevel.PREGRADO, area: 'Ingeniería', acreditado: true, snies: '' },
        { nombre: 'Derecho', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Sociales', acreditado: true, snies: '' },
        { nombre: 'Antropología', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Sociales', acreditado: true, snies: '' },
        { nombre: 'Ciencia Política', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Sociales', acreditado: true, snies: '' },
        { nombre: 'Estudios Globales', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Sociales', acreditado: true, snies: '' },
        { nombre: 'Filosofía', nivel: ProgramLevel.PREGRADO, area: 'Artes y Humanidades', acreditado: true, snies: '' },
        { nombre: 'Historia', nivel: ProgramLevel.PREGRADO, area: 'Artes y Humanidades', acreditado: true, snies: '' },
        { nombre: 'Lenguas y Cultura', nivel: ProgramLevel.PREGRADO, area: 'Artes y Humanidades', acreditado: true, snies: '' },
        { nombre: 'Psicología', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Sociales', acreditado: true, snies: '' },
        { nombre: 'Licenciatura en Artes', nivel: ProgramLevel.PREGRADO, area: 'Educación', acreditado: true, snies: '' },
        { nombre: 'Licenciatura en Biología', nivel: ProgramLevel.PREGRADO, area: 'Educación', acreditado: true, snies: '' },
        { nombre: 'Licenciatura en Educación Infantil', nivel: ProgramLevel.PREGRADO, area: 'Educación', acreditado: true, snies: '' },
        { nombre: 'Licenciatura en Español y Filología', nivel: ProgramLevel.PREGRADO, area: 'Educación', acreditado: true, snies: '' },
        { nombre: 'Licenciatura en Filosofía', nivel: ProgramLevel.PREGRADO, area: 'Educación', acreditado: true, snies: '' },
        { nombre: 'Licenciatura en Física', nivel: ProgramLevel.PREGRADO, area: 'Educación', acreditado: true, snies: '' },
        { nombre: 'Licenciatura en Historia', nivel: ProgramLevel.PREGRADO, area: 'Educación', acreditado: true, snies: '' },
        { nombre: 'Licenciatura en Matemáticas', nivel: ProgramLevel.PREGRADO, area: 'Educación', acreditado: true, snies: '' },
        { nombre: 'Licenciatura en Química', nivel: ProgramLevel.PREGRADO, area: 'Educación', acreditado: true, snies: '' },
        { nombre: 'Cambio Ambiental Global', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Naturales', acreditado: true, snies: '' },
      ],
    },
    {
      nombre: 'Universidad ICESI',
      // 25 pregrados — fuente: icesi.edu.co/icesi-pregrados
      programas: [
        { nombre: 'Administración de Empresas', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Económicas', acreditado: true, snies: '' },
        { nombre: 'Antropología', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Sociales', acreditado: false, snies: '' },
        { nombre: 'Bacteriología y Laboratorio Clínico', nivel: ProgramLevel.PREGRADO, area: 'Salud', acreditado: false, snies: '' },
        { nombre: 'Biología', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Naturales', acreditado: false, snies: '' },
        { nombre: 'Ciencia Política', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Sociales', acreditado: true, snies: '' },
        { nombre: 'Comunicación', nivel: ProgramLevel.PREGRADO, area: 'Comunicación', acreditado: false, snies: '' },
        { nombre: 'Derecho', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Sociales', acreditado: true, snies: '' },
        { nombre: 'Diseño de Medios Interactivos', nivel: ProgramLevel.PREGRADO, area: 'Artes y Humanidades', acreditado: true, snies: '' },
        { nombre: 'Diseño e Innovación', nivel: ProgramLevel.PREGRADO, area: 'Artes y Humanidades', acreditado: false, snies: '' },
        { nombre: 'Economía y Negocios Internacionales', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Económicas', acreditado: true, snies: '' },
        { nombre: 'Finanzas', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Económicas', acreditado: false, snies: '' },
        { nombre: 'Ingeniería Bioquímica', nivel: ProgramLevel.PREGRADO, area: 'Ingeniería', acreditado: false, snies: '' },
        { nombre: 'Ingeniería de Sistemas', nivel: ProgramLevel.PREGRADO, area: 'Ingeniería', acreditado: true, snies: '' },
        { nombre: 'Ingeniería en Energía Inteligente', nivel: ProgramLevel.PREGRADO, area: 'Ingeniería', acreditado: false, snies: '' },
        { nombre: 'Ingeniería Industrial', nivel: ProgramLevel.PREGRADO, area: 'Ingeniería', acreditado: true, snies: '' },
        { nombre: 'Licenciatura en Ciencias Sociales', nivel: ProgramLevel.PREGRADO, area: 'Educación', acreditado: false, snies: '' },
        { nombre: 'Licenciatura en Lenguas Extranjeras con Énfasis en Inglés', nivel: ProgramLevel.PREGRADO, area: 'Educación', acreditado: false, snies: '' },
        { nombre: 'Medicina', nivel: ProgramLevel.PREGRADO, area: 'Salud', acreditado: true, snies: '' },
        { nombre: 'Medicina Veterinaria y Zootecnia', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Agropecuarias', acreditado: false, snies: '' },
        { nombre: 'Mercadeo Internacional y Publicidad', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Económicas', acreditado: true, snies: '' },
        { nombre: 'Música', nivel: ProgramLevel.PREGRADO, area: 'Artes y Humanidades', acreditado: false, snies: '' },
        { nombre: 'Negocios, Estrategia y Tecnología', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Económicas', acreditado: false, snies: '' },
        { nombre: 'Psicología', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Sociales', acreditado: true, snies: '' },
        { nombre: 'Química', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Exactas', acreditado: false, snies: '' },
        { nombre: 'Química Farmacéutica', nivel: ProgramLevel.PREGRADO, area: 'Salud', acreditado: true, snies: '' },
      ],
    },
    {
      nombre: 'Universidad del Norte',
      // 29 pregrados — fuente: uninorte.edu.co/carreras
      programas: [
        { nombre: 'Administración de Empresas', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Económicas', acreditado: true, snies: '1272' },
        { nombre: 'Arquitectura', nivel: ProgramLevel.PREGRADO, area: 'Artes y Humanidades', acreditado: true, snies: '90329' },
        { nombre: 'Ciencia de Datos', nivel: ProgramLevel.PREGRADO, area: 'Ingeniería', acreditado: false, snies: '110172' },
        { nombre: 'Ciencia Política y Gobierno', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Sociales', acreditado: false, snies: '53075' },
        { nombre: 'Comunicación Social y Periodismo', nivel: ProgramLevel.PREGRADO, area: 'Comunicación', acreditado: true, snies: '2519' },
        { nombre: 'Contaduría Pública', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Económicas', acreditado: false, snies: '102003' },
        { nombre: 'Licenciatura en Educación Infantil', nivel: ProgramLevel.PREGRADO, area: 'Educación', acreditado: false, snies: '110832' },
        { nombre: 'Lenguas Modernas y Cultura', nivel: ProgramLevel.PREGRADO, area: 'Artes y Humanidades', acreditado: false, snies: '106856' },
        { nombre: 'Ingeniería Biomédica', nivel: ProgramLevel.PREGRADO, area: 'Ingeniería', acreditado: false, snies: '117940' },
        { nombre: 'Ingeniería Civil', nivel: ProgramLevel.PREGRADO, area: 'Ingeniería', acreditado: true, snies: '1273' },
        { nombre: 'Ingeniería Eléctrica', nivel: ProgramLevel.PREGRADO, area: 'Ingeniería', acreditado: true, snies: '1275' },
        { nombre: 'Ingeniería Electrónica', nivel: ProgramLevel.PREGRADO, area: 'Ingeniería', acreditado: true, snies: '3269' },
        { nombre: 'Ingeniería Industrial', nivel: ProgramLevel.PREGRADO, area: 'Ingeniería', acreditado: true, snies: '1276' },
        { nombre: 'Ingeniería Mecánica', nivel: ProgramLevel.PREGRADO, area: 'Ingeniería', acreditado: true, snies: '1277' },
        { nombre: 'Ingeniería de Sistemas y Computación', nivel: ProgramLevel.PREGRADO, area: 'Ingeniería', acreditado: true, snies: '103821' },
        { nombre: 'Geología', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Naturales', acreditado: false, snies: '104980' },
        { nombre: 'Filosofía y Humanidades', nivel: ProgramLevel.PREGRADO, area: 'Artes y Humanidades', acreditado: false, snies: '103785' },
        { nombre: 'Enfermería', nivel: ProgramLevel.PREGRADO, area: 'Salud', acreditado: true, snies: '1268' },
        { nombre: 'Economía', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Económicas', acreditado: true, snies: '9882' },
        { nombre: 'Diseño Industrial', nivel: ProgramLevel.PREGRADO, area: 'Artes y Humanidades', acreditado: false, snies: '20477' },
        { nombre: 'Diseño Gráfico', nivel: ProgramLevel.PREGRADO, area: 'Artes y Humanidades', acreditado: false, snies: '52362' },
        { nombre: 'Derecho', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Sociales', acreditado: true, snies: '1271' },
        { nombre: 'Matemáticas', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Exactas', acreditado: false, snies: '51825' },
        { nombre: 'Medicina', nivel: ProgramLevel.PREGRADO, area: 'Salud', acreditado: true, snies: '1269' },
        { nombre: 'Música', nivel: ProgramLevel.PREGRADO, area: 'Artes y Humanidades', acreditado: false, snies: '54795' },
        { nombre: 'Negocios Internacionales', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Económicas', acreditado: false, snies: '20523' },
        { nombre: 'Odontología', nivel: ProgramLevel.PREGRADO, area: 'Salud', acreditado: true, snies: '104542' },
        { nombre: 'Psicología', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Sociales', acreditado: true, snies: '1270' },
        { nombre: 'Relaciones Internacionales', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Sociales', acreditado: true, snies: '12075' },
      ],
    },
    {
      nombre: 'Universidad EAFIT',
      // 26 pregrados — fuente: eafit.edu.co/pregrados
      programas: [
        { nombre: 'Administración de Negocios', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Económicas', acreditado: true, snies: '' },
        { nombre: 'Contaduría Pública', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Económicas', acreditado: true, snies: '' },
        { nombre: 'Mercadeo', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Económicas', acreditado: true, snies: '' },
        { nombre: 'Negocios Internacionales', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Económicas', acreditado: true, snies: '' },
        { nombre: 'Economía', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Económicas', acreditado: true, snies: '' },
        { nombre: 'Finanzas', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Económicas', acreditado: true, snies: '' },
        { nombre: 'Gobierno y Relaciones Internacionales', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Sociales', acreditado: true, snies: '' },
        { nombre: 'Derecho', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Sociales', acreditado: true, snies: '' },
        { nombre: 'Ingeniería Civil', nivel: ProgramLevel.PREGRADO, area: 'Ingeniería', acreditado: true, snies: '' },
        { nombre: 'Ingeniería de Construcción', nivel: ProgramLevel.PREGRADO, area: 'Ingeniería', acreditado: true, snies: '' },
        { nombre: 'Ingeniería Industrial', nivel: ProgramLevel.PREGRADO, area: 'Ingeniería', acreditado: true, snies: '117373' },
        { nombre: 'Ingeniería de Sistemas', nivel: ProgramLevel.PREGRADO, area: 'Ingeniería', acreditado: true, snies: '1248' },
        { nombre: 'Ingeniería Mecánica', nivel: ProgramLevel.PREGRADO, area: 'Ingeniería', acreditado: true, snies: '' },
        { nombre: 'Ingeniería de Producción', nivel: ProgramLevel.PREGRADO, area: 'Ingeniería', acreditado: true, snies: '' },
        { nombre: 'Ingeniería Agronómica', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Agropecuarias', acreditado: true, snies: '107709' },
        { nombre: 'Biología', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Naturales', acreditado: true, snies: '101947' },
        { nombre: 'Geología', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Naturales', acreditado: true, snies: '' },
        { nombre: 'Física', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Exactas', acreditado: true, snies: '' },
        { nombre: 'Matemáticas', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Exactas', acreditado: true, snies: '' },
        { nombre: 'Psicología', nivel: ProgramLevel.PREGRADO, area: 'Ciencias Sociales', acreditado: true, snies: '90978' },
        { nombre: 'Música', nivel: ProgramLevel.PREGRADO, area: 'Artes y Humanidades', acreditado: true, snies: '' },
        { nombre: 'Comunicación Social', nivel: ProgramLevel.PREGRADO, area: 'Comunicación', acreditado: true, snies: '' },
        { nombre: 'Ingeniería Física', nivel: ProgramLevel.PREGRADO, area: 'Ingeniería', acreditado: true, snies: '' },
        { nombre: 'Ciencia de Datos', nivel: ProgramLevel.PREGRADO, area: 'Ingeniería', acreditado: true, snies: '' },
        { nombre: 'Diseño de Ingeniería', nivel: ProgramLevel.PREGRADO, area: 'Ingeniería', acreditado: true, snies: '' },
        { nombre: 'Ingeniería Química', nivel: ProgramLevel.PREGRADO, area: 'Ingeniería', acreditado: true, snies: '' },
      ],
    },
  ];

  let created = 0, skipped = 0, errors = 0;

  for (const entry of batch) {
    const uni = await prisma.university.findFirst({
      where: { name: { contains: entry.nombre.split(',')[0].trim(), mode: 'insensitive' } },
    });

    if (!uni) {
      console.warn(`⚠ Universidad no encontrada: ${entry.nombre}`);
      skipped++;
      continue;
    }

    // Borrar programas existentes para evitar duplicados
    await prisma.program.deleteMany({ where: { universityId: uni.id } });

    for (const prog of entry.programas) {
      try {
        await prisma.program.create({
          data: {
            universityId: uni.id,
            name: prog.nombre,
            level: prog.nivel,
            areaKnowledge: prog.area,
            accredited: prog.acreditado,
            sniesCode: prog.snies || null,
          },
        });
        created++;
      } catch (e: any) {
        console.error(`  ✗ Error en ${prog.nombre}: ${e.message}`);
        errors++;
      }
    }
    console.log(`  ✔ ${entry.nombre}: ${entry.programas.length} programas`);
  }

  console.log(`\nResumen: ${created} creados, ${skipped} universidades no encontradas, ${errors} errores`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());