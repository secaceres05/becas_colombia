import 'dotenv/config';
import { PrismaClient, AdminRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';
import { UNIVERSITIES_SEED } from './universitiesData';

process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://becas:becas123@localhost:5433/becas';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // ---- Departamentos (32 + Bogotá D.C.) ----
  const departments = [
    { name: 'Amazonas', daneCode: '91' },
    { name: 'Antioquia', daneCode: '05' },
    { name: 'Arauca', daneCode: '81' },
    { name: 'Atlántico', daneCode: '08' },
    { name: 'Bogotá D.C.', daneCode: '11' },
    { name: 'Bolívar', daneCode: '13' },
    { name: 'Boyacá', daneCode: '15' },
    { name: 'Caldas', daneCode: '17' },
    { name: 'Caquetá', daneCode: '18' },
    { name: 'Casanare', daneCode: '85' },
    { name: 'Cauca', daneCode: '19' },
    { name: 'Cesar', daneCode: '20' },
    { name: 'Chocó', daneCode: '27' },
    { name: 'Córdoba', daneCode: '23' },
    { name: 'Cundinamarca', daneCode: '25' },
    { name: 'Guainía', daneCode: '94' },
    { name: 'Guaviare', daneCode: '95' },
    { name: 'Huila', daneCode: '41' },
    { name: 'La Guajira', daneCode: '44' },
    { name: 'Magdalena', daneCode: '47' },
    { name: 'Meta', daneCode: '50' },
    { name: 'Nariño', daneCode: '52' },
    { name: 'Norte de Santander', daneCode: '54' },
    { name: 'Putumayo', daneCode: '86' },
    { name: 'Quindío', daneCode: '63' },
    { name: 'Risaralda', daneCode: '66' },
    { name: 'San Andrés y Providencia', daneCode: '88' },
    { name: 'Santander', daneCode: '68' },
    { name: 'Sucre', daneCode: '70' },
    { name: 'Tolima', daneCode: '73' },
    { name: 'Valle del Cauca', daneCode: '76' },
    { name: 'Vaupés', daneCode: '97' },
    { name: 'Vichada', daneCode: '99' },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { daneCode: dept.daneCode },
      update: {},
      create: dept,
    });
  }
  console.log(`✔ ${departments.length} departamentos cargados`);

  // ---- Admin SUPERADMIN ----
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!email || !password) {
    throw new Error('ADMIN_SEED_EMAIL y ADMIN_SEED_PASSWORD son requeridos en .env');
  }

  const passwordHash = await argon2.hash(password);

  await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      role: AdminRole.SUPERADMIN,
    },
  });
  console.log(`✔ Admin creado: ${email}`);

  // ---- Universidades (top 40) ----
  let created = 0;
  let updated = 0;

  for (const u of UNIVERSITIES_SEED) {
    const department = await prisma.department.findUnique({
      where: { name: u.departmentName },
    });

    if (!department) {
      console.warn(`⚠ Departamento no encontrado para "${u.name}": ${u.departmentName}`);
      continue;
    }

    const data = {
      name: u.name,
      type: u.type,
      departmentId: department.id,
      city: u.city,
      accreditation: u.accreditation,
      accreditationDetail: u.accreditationDetail,
      website: u.website,
      rankingQsWorld: u.rankingQsWorld,
      rankingQsLatam: u.rankingQsLatam,
      foundedYear: u.foundedYear,
      description: u.description,
      featuredPrograms: u.featuredPrograms,
      enrollmentUrl: u.enrollmentUrl,
      notes: u.notes,
    };

    const existing = await prisma.university.findFirst({ where: { name: u.name } });

    if (existing) {
      await prisma.university.update({ where: { id: existing.id }, data });
      updated++;
    } else {
      await prisma.university.create({ data });
      created++;
    }
  }

  console.log(`✔ Universidades: ${created} creadas, ${updated} actualizadas`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });