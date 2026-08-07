import { PrismaClient, ProgramLevel } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';
import path from 'node:path';

config({ path: path.join(__dirname, '..', '.env') });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Cargando programas académicos...');

  // Map rankingUnirank -> university id
  const universities = await prisma.university.findMany({
    select: { id: true, rankingUnirank: true, name: true },
  });
  const uniByRanking: Record<number, number> = {};
  universities.forEach(u => {
    if (u.rankingUnirank) uniByRanking[u.rankingUnirank] = u.id;
  });

  const programsData: { ranking: number; programs: any[] }[] = [
    {
      ranking: 1,
      programs: [
        { name: 'Ingeniería de Sistemas y Computación', level: ProgramLevel.PREGRADO, sniesCode: '2558', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Ingeniería Civil', level: ProgramLevel.PREGRADO, sniesCode: '2561', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Ingeniería Industrial', level: ProgramLevel.PREGRADO, sniesCode: '2559', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Ingeniería Eléctrica y Electrónica', level: ProgramLevel.PREGRADO, sniesCode: '2560', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Ingeniería Biomédica', level: ProgramLevel.PREGRADO, sniesCode: '54843', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Medicina', level: ProgramLevel.PREGRADO, sniesCode: '9003', areaKnowledge: 'Salud', accredited: true },
        { name: 'Derecho', level: ProgramLevel.PREGRADO, sniesCode: '2543', areaKnowledge: 'Ciencias Sociales', accredited: true },
        { name: 'Economía', level: ProgramLevel.PREGRADO, sniesCode: '2546', areaKnowledge: 'Ciencias Económicas', accredited: true },
        { name: 'Administración de Empresas', level: ProgramLevel.PREGRADO, sniesCode: '2544', areaKnowledge: 'Ciencias Económicas', accredited: true },
        { name: 'Arquitectura', level: ProgramLevel.PREGRADO, sniesCode: '2550', areaKnowledge: 'Artes y Humanidades', accredited: true },
        { name: 'Diseño', level: ProgramLevel.PREGRADO, sniesCode: '2551', areaKnowledge: 'Artes y Humanidades', accredited: true },
        { name: 'Psicología', level: ProgramLevel.PREGRADO, sniesCode: '2548', areaKnowledge: 'Ciencias Sociales', accredited: true },
        { name: 'Matemáticas', level: ProgramLevel.PREGRADO, sniesCode: '2554', areaKnowledge: 'Ciencias Exactas', accredited: true },
        { name: 'Física', level: ProgramLevel.PREGRADO, sniesCode: '2555', areaKnowledge: 'Ciencias Exactas', accredited: true },
        { name: 'Filosofía', level: ProgramLevel.PREGRADO, sniesCode: '2547', areaKnowledge: 'Artes y Humanidades', accredited: true },
        { name: 'Historia', level: ProgramLevel.PREGRADO, sniesCode: '2553', areaKnowledge: 'Artes y Humanidades', accredited: true },
        { name: 'Biología', level: ProgramLevel.PREGRADO, sniesCode: '2556', areaKnowledge: 'Ciencias Naturales', accredited: true },
        { name: 'Química', level: ProgramLevel.PREGRADO, sniesCode: '2557', areaKnowledge: 'Ciencias Exactas', accredited: true },
        { name: 'Geociencias', level: ProgramLevel.PREGRADO, sniesCode: '54844', areaKnowledge: 'Ciencias Naturales', accredited: true },
        { name: 'Maestría en Ingeniería de Sistemas', level: ProgramLevel.MAESTRIA, sniesCode: '12345', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Doctorado en Ingeniería', level: ProgramLevel.DOCTORADO, sniesCode: '12346', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'MBA - Maestría en Administración', level: ProgramLevel.MAESTRIA, sniesCode: '12347', areaKnowledge: 'Ciencias Económicas', accredited: true },
      ],
    },
    {
      ranking: 2,
      programs: [
        { name: 'Ingeniería de Sistemas e Informática', level: ProgramLevel.PREGRADO, sniesCode: '3588', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Ingeniería Civil', level: ProgramLevel.PREGRADO, sniesCode: '3589', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Ingeniería Eléctrica', level: ProgramLevel.PREGRADO, sniesCode: '3590', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Ingeniería Mecánica', level: ProgramLevel.PREGRADO, sniesCode: '3591', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Ingeniería Química', level: ProgramLevel.PREGRADO, sniesCode: '3592', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Medicina', level: ProgramLevel.PREGRADO, sniesCode: '3593', areaKnowledge: 'Salud', accredited: true },
        { name: 'Derecho', level: ProgramLevel.PREGRADO, sniesCode: '3594', areaKnowledge: 'Ciencias Sociales', accredited: true },
        { name: 'Economía', level: ProgramLevel.PREGRADO, sniesCode: '3595', areaKnowledge: 'Ciencias Económicas', accredited: true },
        { name: 'Administración de Empresas', level: ProgramLevel.PREGRADO, sniesCode: '3596', areaKnowledge: 'Ciencias Económicas', accredited: true },
        { name: 'Arquitectura', level: ProgramLevel.PREGRADO, sniesCode: '3597', areaKnowledge: 'Artes y Humanidades', accredited: true },
        { name: 'Biología', level: ProgramLevel.PREGRADO, sniesCode: '3598', areaKnowledge: 'Ciencias Naturales', accredited: true },
        { name: 'Química', level: ProgramLevel.PREGRADO, sniesCode: '3599', areaKnowledge: 'Ciencias Exactas', accredited: true },
        { name: 'Física', level: ProgramLevel.PREGRADO, sniesCode: '3600', areaKnowledge: 'Ciencias Exactas', accredited: true },
        { name: 'Matemáticas', level: ProgramLevel.PREGRADO, sniesCode: '3601', areaKnowledge: 'Ciencias Exactas', accredited: true },
        { name: 'Enfermería', level: ProgramLevel.PREGRADO, sniesCode: '3602', areaKnowledge: 'Salud', accredited: true },
        { name: 'Odontología', level: ProgramLevel.PREGRADO, sniesCode: '3603', areaKnowledge: 'Salud', accredited: true },
        { name: 'Medicina Veterinaria y Zootecnia', level: ProgramLevel.PREGRADO, sniesCode: '3604', areaKnowledge: 'Ciencias Agropecuarias', accredited: true },
        { name: 'Agronomía', level: ProgramLevel.PREGRADO, sniesCode: '3605', areaKnowledge: 'Ciencias Agropecuarias', accredited: true },
        { name: 'Artes Plásticas', level: ProgramLevel.PREGRADO, sniesCode: '3606', areaKnowledge: 'Artes y Humanidades', accredited: true },
        { name: 'Música', level: ProgramLevel.PREGRADO, sniesCode: '3607', areaKnowledge: 'Artes y Humanidades', accredited: true },
        { name: 'Geología', level: ProgramLevel.PREGRADO, sniesCode: '3608', areaKnowledge: 'Ciencias Naturales', accredited: true },
        { name: 'Filosofía', level: ProgramLevel.PREGRADO, sniesCode: '3609', areaKnowledge: 'Artes y Humanidades', accredited: true },
        { name: 'Historia', level: ProgramLevel.PREGRADO, sniesCode: '3610', areaKnowledge: 'Artes y Humanidades', accredited: true },
        { name: 'Sociología', level: ProgramLevel.PREGRADO, sniesCode: '3611', areaKnowledge: 'Ciencias Sociales', accredited: true },
        { name: 'Trabajo Social', level: ProgramLevel.PREGRADO, sniesCode: '3612', areaKnowledge: 'Ciencias Sociales', accredited: true },
        { name: 'Doctorado en Ingeniería', level: ProgramLevel.DOCTORADO, sniesCode: '3613', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Doctorado en Ciencias - Química', level: ProgramLevel.DOCTORADO, sniesCode: '3614', areaKnowledge: 'Ciencias Exactas', accredited: true },
        { name: 'Maestría en Ingeniería', level: ProgramLevel.MAESTRIA, sniesCode: '3615', areaKnowledge: 'Ingeniería', accredited: true },
      ],
    },
    {
      ranking: 3,
      programs: [
        { name: 'Medicina', level: ProgramLevel.PREGRADO, sniesCode: '4001', areaKnowledge: 'Salud', accredited: true },
        { name: 'Derecho', level: ProgramLevel.PREGRADO, sniesCode: '4002', areaKnowledge: 'Ciencias Sociales', accredited: true },
        { name: 'Ingeniería de Sistemas', level: ProgramLevel.PREGRADO, sniesCode: '4003', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Ingeniería Industrial', level: ProgramLevel.PREGRADO, sniesCode: '4004', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Ingeniería Civil', level: ProgramLevel.PREGRADO, sniesCode: '4005', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Ingeniería Electrónica', level: ProgramLevel.PREGRADO, sniesCode: '4006', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Economía', level: ProgramLevel.PREGRADO, sniesCode: '4007', areaKnowledge: 'Ciencias Económicas', accredited: true },
        { name: 'Administración de Empresas', level: ProgramLevel.PREGRADO, sniesCode: '4008', areaKnowledge: 'Ciencias Económicas', accredited: true },
        { name: 'Comunicación Social', level: ProgramLevel.PREGRADO, sniesCode: '4009', areaKnowledge: 'Comunicación', accredited: true },
        { name: 'Psicología', level: ProgramLevel.PREGRADO, sniesCode: '4010', areaKnowledge: 'Ciencias Sociales', accredited: true },
        { name: 'Arquitectura', level: ProgramLevel.PREGRADO, sniesCode: '4011', areaKnowledge: 'Artes y Humanidades', accredited: true },
        { name: 'Diseño Industrial', level: ProgramLevel.PREGRADO, sniesCode: '4012', areaKnowledge: 'Artes y Humanidades', accredited: true },
        { name: 'Filosofía', level: ProgramLevel.PREGRADO, sniesCode: '4013', areaKnowledge: 'Artes y Humanidades', accredited: true },
        { name: 'Teología', level: ProgramLevel.PREGRADO, sniesCode: '4014', areaKnowledge: 'Artes y Humanidades', accredited: true },
        { name: 'Bacteriología', level: ProgramLevel.PREGRADO, sniesCode: '4015', areaKnowledge: 'Salud', accredited: true },
        { name: 'Enfermería', level: ProgramLevel.PREGRADO, sniesCode: '4016', areaKnowledge: 'Salud', accredited: true },
        { name: 'Odontología', level: ProgramLevel.PREGRADO, sniesCode: '4017', areaKnowledge: 'Salud', accredited: true },
        { name: 'Nutrición y Dietética', level: ProgramLevel.PREGRADO, sniesCode: '4018', areaKnowledge: 'Salud', accredited: true },
        { name: 'Ciencia Política', level: ProgramLevel.PREGRADO, sniesCode: '4019', areaKnowledge: 'Ciencias Sociales', accredited: true },
        { name: 'Historia', level: ProgramLevel.PREGRADO, sniesCode: '4020', areaKnowledge: 'Artes y Humanidades', accredited: true },
        { name: 'Maestría en Derecho', level: ProgramLevel.MAESTRIA, sniesCode: '4021', areaKnowledge: 'Ciencias Sociales', accredited: true },
        { name: 'Doctorado en Ciencias Sociales', level: ProgramLevel.DOCTORADO, sniesCode: '4022', areaKnowledge: 'Ciencias Sociales', accredited: true },
      ],
    },
    {
      ranking: 4,
      programs: [
        { name: 'Medicina', level: ProgramLevel.PREGRADO, sniesCode: '5001', areaKnowledge: 'Salud', accredited: true },
        { name: 'Ingeniería de Sistemas', level: ProgramLevel.PREGRADO, sniesCode: '5002', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Ingeniería Civil', level: ProgramLevel.PREGRADO, sniesCode: '5003', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Ingeniería Eléctrica', level: ProgramLevel.PREGRADO, sniesCode: '5004', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Ingeniería Química', level: ProgramLevel.PREGRADO, sniesCode: '5005', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Derecho', level: ProgramLevel.PREGRADO, sniesCode: '5006', areaKnowledge: 'Ciencias Sociales', accredited: true },
        { name: 'Economía', level: ProgramLevel.PREGRADO, sniesCode: '5007', areaKnowledge: 'Ciencias Económicas', accredited: true },
        { name: 'Química Farmacéutica', level: ProgramLevel.PREGRADO, sniesCode: '5008', areaKnowledge: 'Salud', accredited: true },
        { name: 'Bacteriología', level: ProgramLevel.PREGRADO, sniesCode: '5009', areaKnowledge: 'Salud', accredited: true },
        { name: 'Enfermería', level: ProgramLevel.PREGRADO, sniesCode: '5010', areaKnowledge: 'Salud', accredited: true },
        { name: 'Odontología', level: ProgramLevel.PREGRADO, sniesCode: '5011', areaKnowledge: 'Salud', accredited: true },
        { name: 'Nutrición y Dietética', level: ProgramLevel.PREGRADO, sniesCode: '5012', areaKnowledge: 'Salud', accredited: true },
        { name: 'Química', level: ProgramLevel.PREGRADO, sniesCode: '5013', areaKnowledge: 'Ciencias Exactas', accredited: true },
        { name: 'Biología', level: ProgramLevel.PREGRADO, sniesCode: '5014', areaKnowledge: 'Ciencias Naturales', accredited: true },
        { name: 'Física', level: ProgramLevel.PREGRADO, sniesCode: '5015', areaKnowledge: 'Ciencias Exactas', accredited: true },
        { name: 'Matemáticas', level: ProgramLevel.PREGRADO, sniesCode: '5016', areaKnowledge: 'Ciencias Exactas', accredited: true },
        { name: 'Filosofía', level: ProgramLevel.PREGRADO, sniesCode: '5017', areaKnowledge: 'Artes y Humanidades', accredited: true },
        { name: 'Historia', level: ProgramLevel.PREGRADO, sniesCode: '5018', areaKnowledge: 'Artes y Humanidades', accredited: true },
        { name: 'Sociología', level: ProgramLevel.PREGRADO, sniesCode: '5019', areaKnowledge: 'Ciencias Sociales', accredited: true },
        { name: 'Trabajo Social', level: ProgramLevel.PREGRADO, sniesCode: '5020', areaKnowledge: 'Ciencias Sociales', accredited: true },
        { name: 'Licenciatura en Matemáticas', level: ProgramLevel.PREGRADO, sniesCode: '5021', areaKnowledge: 'Educación', accredited: true },
        { name: 'Licenciatura en Lenguas Extranjeras', level: ProgramLevel.PREGRADO, sniesCode: '5022', areaKnowledge: 'Educación', accredited: true },
        { name: 'Doctorado en Ciencias Médicas', level: ProgramLevel.DOCTORADO, sniesCode: '5023', areaKnowledge: 'Salud', accredited: true },
        { name: 'Maestría en Salud Pública', level: ProgramLevel.MAESTRIA, sniesCode: '5024', areaKnowledge: 'Salud', accredited: true },
      ],
    },
    {
      ranking: 5,
      programs: [
        { name: 'Ingeniería de Sistemas', level: ProgramLevel.PREGRADO, sniesCode: '6001', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Ingeniería Civil', level: ProgramLevel.PREGRADO, sniesCode: '6002', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Ingeniería Industrial', level: ProgramLevel.PREGRADO, sniesCode: '6003', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Ingeniería Eléctrica', level: ProgramLevel.PREGRADO, sniesCode: '6004', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Ingeniería Química', level: ProgramLevel.PREGRADO, sniesCode: '6005', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Medicina', level: ProgramLevel.PREGRADO, sniesCode: '6006', areaKnowledge: 'Salud', accredited: true },
        { name: 'Derecho', level: ProgramLevel.PREGRADO, sniesCode: '6007', areaKnowledge: 'Ciencias Sociales', accredited: true },
        { name: 'Psicología', level: ProgramLevel.PREGRADO, sniesCode: '6008', areaKnowledge: 'Ciencias Sociales', accredited: true },
        { name: 'Trabajo Social', level: ProgramLevel.PREGRADO, sniesCode: '6009', areaKnowledge: 'Ciencias Sociales', accredited: true },
        { name: 'Química', level: ProgramLevel.PREGRADO, sniesCode: '6010', areaKnowledge: 'Ciencias Exactas', accredited: true },
        { name: 'Biología', level: ProgramLevel.PREGRADO, sniesCode: '6011', areaKnowledge: 'Ciencias Naturales', accredited: true },
        { name: 'Física', level: ProgramLevel.PREGRADO, sniesCode: '6012', areaKnowledge: 'Ciencias Exactas', accredited: true },
        { name: 'Matemáticas', level: ProgramLevel.PREGRADO, sniesCode: '6013', areaKnowledge: 'Ciencias Exactas', accredited: true },
        { name: 'Filosofía', level: ProgramLevel.PREGRADO, sniesCode: '6014', areaKnowledge: 'Artes y Humanidades', accredited: true },
        { name: 'Historia', level: ProgramLevel.PREGRADO, sniesCode: '6015', areaKnowledge: 'Artes y Humanidades', accredited: true },
        { name: 'Enfermería', level: ProgramLevel.PREGRADO, sniesCode: '6016', areaKnowledge: 'Salud', accredited: true },
        { name: 'Nutrición y Dietética', level: ProgramLevel.PREGRADO, sniesCode: '6017', areaKnowledge: 'Salud', accredited: true },
        { name: 'Licenciatura en Educación Básica', level: ProgramLevel.PREGRADO, sniesCode: '6018', areaKnowledge: 'Educación', accredited: true },
        { name: 'Administración de Empresas', level: ProgramLevel.PREGRADO, sniesCode: '6019', areaKnowledge: 'Ciencias Económicas', accredited: true },
        { name: 'Contaduría Pública', level: ProgramLevel.PREGRADO, sniesCode: '6020', areaKnowledge: 'Ciencias Económicas', accredited: true },
        { name: 'Maestría en Ingeniería', level: ProgramLevel.MAESTRIA, sniesCode: '6021', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Doctorado en Ciencias', level: ProgramLevel.DOCTORADO, sniesCode: '6022', areaKnowledge: 'Ciencias Exactas', accredited: true },
      ],
    },
    {
      ranking: 6,
      programs: [
        { name: 'Ingeniería de Sistemas', level: ProgramLevel.PREGRADO, sniesCode: '7001', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Ingeniería Civil', level: ProgramLevel.PREGRADO, sniesCode: '7002', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Ingeniería Mecánica', level: ProgramLevel.PREGRADO, sniesCode: '7003', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Ingeniería Eléctrica', level: ProgramLevel.PREGRADO, sniesCode: '7004', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Ingeniería Química', level: ProgramLevel.PREGRADO, sniesCode: '7005', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Ingeniería Metalúrgica', level: ProgramLevel.PREGRADO, sniesCode: '7006', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Geología', level: ProgramLevel.PREGRADO, sniesCode: '7007', areaKnowledge: 'Ciencias Naturales', accredited: true },
        { name: 'Química', level: ProgramLevel.PREGRADO, sniesCode: '7008', areaKnowledge: 'Ciencias Exactas', accredited: true },
        { name: 'Física', level: ProgramLevel.PREGRADO, sniesCode: '7009', areaKnowledge: 'Ciencias Exactas', accredited: true },
        { name: 'Matemáticas', level: ProgramLevel.PREGRADO, sniesCode: '7010', areaKnowledge: 'Ciencias Exactas', accredited: true },
        { name: 'Medicina', level: ProgramLevel.PREGRADO, sniesCode: '7011', areaKnowledge: 'Salud', accredited: true },
        { name: 'Derecho', level: ProgramLevel.PREGRADO, sniesCode: '7012', areaKnowledge: 'Ciencias Sociales', accredited: true },
        { name: 'Licenciatura en Matemáticas', level: ProgramLevel.PREGRADO, sniesCode: '7013', areaKnowledge: 'Educación', accredited: true },
        { name: 'Maestría en Ingeniería', level: ProgramLevel.MAESTRIA, sniesCode: '7014', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Doctorado en Ingeniería', level: ProgramLevel.DOCTORADO, sniesCode: '7015', areaKnowledge: 'Ingeniería', accredited: true },
      ],
    },
    {
      ranking: 7,
      programs: [
        { name: 'Derecho', level: ProgramLevel.PREGRADO, sniesCode: '8001', areaKnowledge: 'Ciencias Sociales', accredited: true },
        { name: 'Medicina', level: ProgramLevel.PREGRADO, sniesCode: '8002', areaKnowledge: 'Salud', accredited: true },
        { name: 'Administración de Empresas', level: ProgramLevel.PREGRADO, sniesCode: '8003', areaKnowledge: 'Ciencias Económicas', accredited: true },
        { name: 'Economía', level: ProgramLevel.PREGRADO, sniesCode: '8004', areaKnowledge: 'Ciencias Económicas', accredited: true },
        { name: 'Ciencia Política', level: ProgramLevel.PREGRADO, sniesCode: '8005', areaKnowledge: 'Ciencias Sociales', accredited: true },
        { name: 'Relaciones Internacionales', level: ProgramLevel.PREGRADO, sniesCode: '8006', areaKnowledge: 'Ciencias Sociales', accredited: true },
        { name: 'Psicología', level: ProgramLevel.PREGRADO, sniesCode: '8007', areaKnowledge: 'Ciencias Sociales', accredited: true },
        { name: 'Filosofía', level: ProgramLevel.PREGRADO, sniesCode: '8008', areaKnowledge: 'Artes y Humanidades', accredited: true },
        { name: 'Ingeniería', level: ProgramLevel.PREGRADO, sniesCode: '8009', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Maestría en Derecho', level: ProgramLevel.MAESTRIA, sniesCode: '8010', areaKnowledge: 'Ciencias Sociales', accredited: true },
        { name: 'Doctorado en Derecho', level: ProgramLevel.DOCTORADO, sniesCode: '8011', areaKnowledge: 'Ciencias Sociales', accredited: true },
        { name: 'Maestría en Administración', level: ProgramLevel.MAESTRIA, sniesCode: '8012', areaKnowledge: 'Ciencias Económicas', accredited: true },
      ],
    },
    {
      ranking: 8,
      programs: [
        { name: 'Ingeniería de Sistemas', level: ProgramLevel.PREGRADO, sniesCode: '9001', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Ingeniería Civil', level: ProgramLevel.PREGRADO, sniesCode: '9002', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Ingeniería de Producción', level: ProgramLevel.PREGRADO, sniesCode: '9003', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Ingeniería Mecánica', level: ProgramLevel.PREGRADO, sniesCode: '9004', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Ingeniería de Diseño de Producto', level: ProgramLevel.PREGRADO, sniesCode: '9005', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Administración de Empresas', level: ProgramLevel.PREGRADO, sniesCode: '9006', areaKnowledge: 'Ciencias Económicas', accredited: true },
        { name: 'Economía', level: ProgramLevel.PREGRADO, sniesCode: '9007', areaKnowledge: 'Ciencias Económicas', accredited: true },
        { name: 'Negocios Internacionales', level: ProgramLevel.PREGRADO, sniesCode: '9008', areaKnowledge: 'Ciencias Económicas', accredited: true },
        { name: 'Derecho', level: ProgramLevel.PREGRADO, sniesCode: '9009', areaKnowledge: 'Ciencias Sociales', accredited: true },
        { name: 'Música', level: ProgramLevel.PREGRADO, sniesCode: '9010', areaKnowledge: 'Artes y Humanidades', accredited: true },
        { name: 'Geología', level: ProgramLevel.PREGRADO, sniesCode: '9011', areaKnowledge: 'Ciencias Naturales', accredited: true },
        { name: 'Comunicación Social', level: ProgramLevel.PREGRADO, sniesCode: '9012', areaKnowledge: 'Comunicación', accredited: true },
        { name: 'Maestría en Ingeniería', level: ProgramLevel.MAESTRIA, sniesCode: '9013', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Maestría en Administración MBA', level: ProgramLevel.MAESTRIA, sniesCode: '9014', areaKnowledge: 'Ciencias Económicas', accredited: true },
        { name: 'Doctorado en Ingeniería', level: ProgramLevel.DOCTORADO, sniesCode: '9015', areaKnowledge: 'Ingeniería', accredited: true },
      ],
    },
    {
      ranking: 12,
      programs: [
        { name: 'Administración de Empresas', level: ProgramLevel.PREGRADO, sniesCode: '12001', areaKnowledge: 'Ciencias Económicas', accredited: true },
        { name: 'Ingeniería Industrial', level: ProgramLevel.PREGRADO, sniesCode: '12002', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Ingeniería de Sistemas', level: ProgramLevel.PREGRADO, sniesCode: '12003', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Ingeniería Biomédica', level: ProgramLevel.PREGRADO, sniesCode: '12004', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Medicina', level: ProgramLevel.PREGRADO, sniesCode: '12005', areaKnowledge: 'Salud', accredited: true },
        { name: 'Derecho', level: ProgramLevel.PREGRADO, sniesCode: '12006', areaKnowledge: 'Ciencias Sociales', accredited: true },
        { name: 'Diseño de Comunicación Visual', level: ProgramLevel.PREGRADO, sniesCode: '12007', areaKnowledge: 'Artes y Humanidades', accredited: true },
        { name: 'Economía', level: ProgramLevel.PREGRADO, sniesCode: '12008', areaKnowledge: 'Ciencias Económicas', accredited: true },
        { name: 'Psicología', level: ProgramLevel.PREGRADO, sniesCode: '12009', areaKnowledge: 'Ciencias Sociales', accredited: true },
        { name: 'Comunicación Social y Periodismo', level: ProgramLevel.PREGRADO, sniesCode: '12010', areaKnowledge: 'Comunicación', accredited: true },
        { name: 'Música', level: ProgramLevel.PREGRADO, sniesCode: '12011', areaKnowledge: 'Artes y Humanidades', accredited: true },
        { name: 'Maestría en Administración MBA', level: ProgramLevel.MAESTRIA, sniesCode: '12012', areaKnowledge: 'Ciencias Económicas', accredited: true },
        { name: 'Maestría en Ingeniería', level: ProgramLevel.MAESTRIA, sniesCode: '12013', areaKnowledge: 'Ingeniería', accredited: true },
      ],
    },
    {
      ranking: 13,
      programs: [
        { name: 'Medicina', level: ProgramLevel.PREGRADO, sniesCode: '13001', areaKnowledge: 'Salud', accredited: true },
        { name: 'Ingeniería Industrial', level: ProgramLevel.PREGRADO, sniesCode: '13002', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Ingeniería de Sistemas', level: ProgramLevel.PREGRADO, sniesCode: '13003', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Ingeniería Civil', level: ProgramLevel.PREGRADO, sniesCode: '13004', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Psicología', level: ProgramLevel.PREGRADO, sniesCode: '13005', areaKnowledge: 'Ciencias Sociales', accredited: true },
        { name: 'Derecho', level: ProgramLevel.PREGRADO, sniesCode: '13006', areaKnowledge: 'Ciencias Sociales', accredited: true },
        { name: 'Administración de Empresas', level: ProgramLevel.PREGRADO, sniesCode: '13007', areaKnowledge: 'Ciencias Económicas', accredited: true },
        { name: 'Comunicación Social', level: ProgramLevel.PREGRADO, sniesCode: '13008', areaKnowledge: 'Comunicación', accredited: true },
        { name: 'Enfermería', level: ProgramLevel.PREGRADO, sniesCode: '13009', areaKnowledge: 'Salud', accredited: true },
        { name: 'Nutrición y Dietética', level: ProgramLevel.PREGRADO, sniesCode: '13010', areaKnowledge: 'Salud', accredited: true },
        { name: 'Arquitectura', level: ProgramLevel.PREGRADO, sniesCode: '13011', areaKnowledge: 'Artes y Humanidades', accredited: true },
        { name: 'Maestría en Salud Pública', level: ProgramLevel.MAESTRIA, sniesCode: '13012', areaKnowledge: 'Salud', accredited: true },
      ],
    },
    {
      ranking: 19,
      programs: [
        { name: 'Medicina', level: ProgramLevel.PREGRADO, sniesCode: '19001', areaKnowledge: 'Salud', accredited: true },
        { name: 'Derecho', level: ProgramLevel.PREGRADO, sniesCode: '19002', areaKnowledge: 'Ciencias Sociales', accredited: true },
        { name: 'Administración de Empresas', level: ProgramLevel.PREGRADO, sniesCode: '19003', areaKnowledge: 'Ciencias Económicas', accredited: true },
        { name: 'Comunicación Social y Periodismo', level: ProgramLevel.PREGRADO, sniesCode: '19004', areaKnowledge: 'Comunicación', accredited: true },
        { name: 'Psicología', level: ProgramLevel.PREGRADO, sniesCode: '19005', areaKnowledge: 'Ciencias Sociales', accredited: true },
        { name: 'Enfermería', level: ProgramLevel.PREGRADO, sniesCode: '19006', areaKnowledge: 'Salud', accredited: true },
        { name: 'Ingeniería Industrial', level: ProgramLevel.PREGRADO, sniesCode: '19007', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Educación', level: ProgramLevel.PREGRADO, sniesCode: '19008', areaKnowledge: 'Educación', accredited: true },
        { name: 'Filosofía', level: ProgramLevel.PREGRADO, sniesCode: '19009', areaKnowledge: 'Artes y Humanidades', accredited: true },
        { name: 'Maestría en Dirección y Gestión de Empresas', level: ProgramLevel.MAESTRIA, sniesCode: '19010', areaKnowledge: 'Ciencias Económicas', accredited: true },
      ],
    },
    {
      ranking: 11,
      programs: [
        { name: 'Ingeniería Civil', level: ProgramLevel.PREGRADO, sniesCode: '11001', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Ingeniería Eléctrica', level: ProgramLevel.PREGRADO, sniesCode: '11002', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Ingeniería Mecánica', level: ProgramLevel.PREGRADO, sniesCode: '11003', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Ingeniería Industrial', level: ProgramLevel.PREGRADO, sniesCode: '11004', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Arquitectura', level: ProgramLevel.PREGRADO, sniesCode: '11005', areaKnowledge: 'Artes y Humanidades', accredited: true },
        { name: 'Diseño Industrial', level: ProgramLevel.PREGRADO, sniesCode: '11006', areaKnowledge: 'Artes y Humanidades', accredited: true },
        { name: 'Comunicación Social', level: ProgramLevel.PREGRADO, sniesCode: '11007', areaKnowledge: 'Comunicación', accredited: true },
        { name: 'Teología', level: ProgramLevel.PREGRADO, sniesCode: '11008', areaKnowledge: 'Artes y Humanidades', accredited: true },
        { name: 'Medicina', level: ProgramLevel.PREGRADO, sniesCode: '11009', areaKnowledge: 'Salud', accredited: true },
        { name: 'Derecho', level: ProgramLevel.PREGRADO, sniesCode: '11010', areaKnowledge: 'Ciencias Sociales', accredited: true },
        { name: 'Maestría en Ingeniería', level: ProgramLevel.MAESTRIA, sniesCode: '11011', areaKnowledge: 'Ingeniería', accredited: true },
      ],
    },
    {
      ranking: 15,
      programs: [
        { name: 'Derecho', level: ProgramLevel.PREGRADO, sniesCode: '15001', areaKnowledge: 'Ciencias Sociales', accredited: true },
        { name: 'Economía', level: ProgramLevel.PREGRADO, sniesCode: '15002', areaKnowledge: 'Ciencias Económicas', accredited: true },
        { name: 'Administración de Empresas', level: ProgramLevel.PREGRADO, sniesCode: '15003', areaKnowledge: 'Ciencias Económicas', accredited: true },
        { name: 'Finanzas y Relaciones Internacionales', level: ProgramLevel.PREGRADO, sniesCode: '15004', areaKnowledge: 'Ciencias Económicas', accredited: true },
        { name: 'Contaduría Pública', level: ProgramLevel.PREGRADO, sniesCode: '15005', areaKnowledge: 'Ciencias Económicas', accredited: true },
        { name: 'Ciencia Política', level: ProgramLevel.PREGRADO, sniesCode: '15006', areaKnowledge: 'Ciencias Sociales', accredited: true },
        { name: 'Comunicación Social y Periodismo', level: ProgramLevel.PREGRADO, sniesCode: '15007', areaKnowledge: 'Comunicación', accredited: true },
        { name: 'Administración de Negocios Internacionales', level: ProgramLevel.PREGRADO, sniesCode: '15008', areaKnowledge: 'Ciencias Económicas', accredited: true },
        { name: 'Maestría en Derecho', level: ProgramLevel.MAESTRIA, sniesCode: '15009', areaKnowledge: 'Ciencias Sociales', accredited: true },
        { name: 'Doctorado en Derecho', level: ProgramLevel.DOCTORADO, sniesCode: '15010', areaKnowledge: 'Ciencias Sociales', accredited: true },
      ],
    },
    {
      ranking: 40,
      programs: [
        { name: 'Derecho', level: ProgramLevel.PREGRADO, sniesCode: '40001', areaKnowledge: 'Ciencias Sociales', accredited: true },
        { name: 'Ingeniería de Sistemas', level: ProgramLevel.PREGRADO, sniesCode: '40002', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Ingeniería Industrial', level: ProgramLevel.PREGRADO, sniesCode: '40003', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Comunicación', level: ProgramLevel.PREGRADO, sniesCode: '40004', areaKnowledge: 'Comunicación', accredited: true },
        { name: 'Publicidad', level: ProgramLevel.PREGRADO, sniesCode: '40005', areaKnowledge: 'Comunicación', accredited: true },
        { name: 'Negocios Internacionales', level: ProgramLevel.PREGRADO, sniesCode: '40006', areaKnowledge: 'Ciencias Económicas', accredited: true },
        { name: 'Contaduría Pública', level: ProgramLevel.PREGRADO, sniesCode: '40007', areaKnowledge: 'Ciencias Económicas', accredited: true },
        { name: 'Maestría en Derecho', level: ProgramLevel.MAESTRIA, sniesCode: '40008', areaKnowledge: 'Ciencias Sociales', accredited: true },
      ],
    },
    {
      ranking: 43,
      programs: [
        { name: 'Ingeniería Civil', level: ProgramLevel.PREGRADO, sniesCode: '43001', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Ingeniería de Sistemas', level: ProgramLevel.PREGRADO, sniesCode: '43002', areaKnowledge: 'Ingeniería', accredited: true },
        { name: 'Arquitectura', level: ProgramLevel.PREGRADO, sniesCode: '43003', areaKnowledge: 'Artes y Humanidades', accredited: true },
        { name: 'Derecho', level: ProgramLevel.PREGRADO, sniesCode: '43004', areaKnowledge: 'Ciencias Sociales', accredited: true },
        { name: 'Psicología', level: ProgramLevel.PREGRADO, sniesCode: '43005', areaKnowledge: 'Ciencias Sociales', accredited: true },
        { name: 'Administración de Empresas', level: ProgramLevel.PREGRADO, sniesCode: '43006', areaKnowledge: 'Ciencias Económicas', accredited: true },
        { name: 'Contaduría Pública', level: ProgramLevel.PREGRADO, sniesCode: '43007', areaKnowledge: 'Ciencias Económicas', accredited: true },
        { name: 'Maestría en Ingeniería', level: ProgramLevel.MAESTRIA, sniesCode: '43008', areaKnowledge: 'Ingeniería', accredited: true },
      ],
    },
  ];

  let created = 0, skipped = 0, errors = 0;

  for (const entry of programsData) {
    const uniId = uniByRanking[entry.ranking];
    if (!uniId) {
      console.warn(`Universidad ranking #${entry.ranking} no encontrada`);
      skipped++;
      continue;
    }

    // Delete existing programs for this university to avoid duplicates
    await prisma.program.deleteMany({ where: { universityId: uniId } });

    for (const prog of entry.programs) {
      try {
        await prisma.program.create({
          data: {
            universityId: uniId,
            name: prog.name,
            level: prog.level,
            sniesCode: prog.sniesCode,
            areaKnowledge: prog.areaKnowledge,
            accredited: prog.accredited,
          },
        });
        created++;
      } catch (e: any) {
        console.error(`Error en ${prog.name}: ${e.message}`);
        errors++;
      }
    }
    console.log(`✔ Universidad #${entry.ranking}: ${entry.programs.length} programas cargados`);
  }

  console.log(`\n✔ ${created} programas creados, ${skipped} universidades no encontradas, ${errors} errores`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());