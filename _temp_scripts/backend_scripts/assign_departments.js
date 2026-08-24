#!/usr/bin/env node
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { Prisma } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new (require('@prisma/adapter-pg').PrismaPg)({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new (require('@prisma/adapter-pg').PrismaPg)({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const departments = await prisma.department.findMany({
    select: { id: true, daneCode: true, name: true }
  });
  console.log('Total departments:', departments.length);

  const nationalsWithoutDept = await prisma.scholarship.findMany({
    where: {
      type: 'NACIONAL',
      departments: { none: {} }
    },
    select: { id: true }
  });
  console.log('NACIONAL sin departamentos:', nationalsWithoutDept.length);

  if (nationalsWithoutDept.length > 0) {
    const scholarshipIds = nationalsWithoutDept.map(s => s.id);
    const batchSize = 100;
    let affected = 0;
    for (let i = 0; i < scholarshipIds.length; i += batchSize) {
      const batch = scholarshipIds.slice(i, i + batchSize);
      const result = await prisma.scholarshipDepartment.createMany({
        data: scholarshipIds.flatMap(sid => departments.map(d => ({
          scholarshipId: sid,
          departmentId: d.id
        }))),
        skipDuplicates: true
      });
      affected += result.count;
    }
    console.log('Filas insertadas en scholarship_department:', affected);
  }

  const caribe = await prisma.$queryRaw`
    SELECT COUNT(DISTINCT s.id)
    FROM scholarships s
    JOIN scholarship_departments sd ON s.id = sd.scholarship_id
    JOIN departments d ON sd.department_id = d.id
    WHERE d.dane_code IN ('11', '76', '5')
    AND s.type = 'NACIONAL'
  `;
  console.log('Caribe:', caribe);

  const andinaCodes = ['11', '76', '5', '13', '15', '17', '18', '19', '20', '23', '25', '27', '41', '44', '47', '50', '52', '54', '57', '63', '66', '68'];
  const andina = await prisma.$queryRaw`
    SELECT COUNT(DISTINCT s.id)
    FROM scholarships s
    JOIN scholarship_departments sd ON s.id = sd.scholarship_id
    JOIN departments d ON sd.department_id = d.id
    WHERE d.dane_code IN (${Prisma.join(['11', '76', '5', '13', '15', '17', '18', '19', '20', '23', '25', '27', '41', '44', '47', '50', '52', '54', '57', '63', '66', '68'])})
    AND s.type = 'NACIONAL'
  `;
  console.log('Andina:', andina);

  const pacificaCodes = ['76', '5', '11', '13', '17', '19', '27', '44', '47', '52', '68', '70'];
  const pacifica = await prisma.$queryRaw`
    SELECT COUNT(DISTINCT s.id)
    FROM scholarships s
    JOIN scholarship_departments sd ON s.id = sd.scholarship_id
    JOIN departments d ON sd.department_id = d.id
    WHERE d.dane_code IN (${Prisma.join(['76', '5', '11', '13', '17', '19', '27', '44', '47', '52', '68', '70'])})
    AND s.type = 'NACIONAL'
  `;
  console.log('Pacífica:', pacifica);

  const orinoquiaCodes = ['13', '17', '19', '20', '23', '25', '27', '29', '33', '41', '44', '47', '50', '52', '54', '57', '63', '66', '68', '70', '81', '85', '86', '88', '91', '94', '95', '97', '99'];
  const orinoquia = await prisma.$queryRaw`
    SELECT COUNT(DISTINCT s.id)
    FROM scholarships s
    JOIN scholarship_departments sd ON s.id = sd.scholarship_id
    JOIN departments d ON sd.department_id = d.id
    WHERE d.dane_code IN (${Prisma.join(['13', '17', '19', '20', '23', '25', '27', '29', '33', '41', '44', '47', '50', '52', '54', '57', '63', '66', '68', '70', '81', '85', '86', '88', '91', '94', '95', '97', '99'])})
    AND s.type = 'NACIONAL'
  `;
  console.log('Orinoquía:', orinoquia);

  const amazoniaCodes = ['18', '81', '86', '91', '94'];
  const amazonia = await prisma.$queryRaw`
    SELECT COUNT(DISTINCT s.id)
    FROM scholarships s
    JOIN scholarship_departments sd ON s.id = sd.scholarship_id
    JOIN departments d ON sd.department_id = d.id
    WHERE d.dane_code IN (${Prisma.join(['18', '81', '86', '91', '94'])})
    AND s.type = 'NACIONAL'
  `;
  console.log('Amazonía:', amazonia);

  const totalWithDept = await prisma.$queryRaw`
    SELECT COUNT(DISTINCT s.id)
    FROM scholarships s
    JOIN scholarship_departments sd ON s.id = sd.scholarship_id
    JOIN departments d ON sd.department_id = d.id
    WHERE s.type = 'NACIONAL'
  `;
  console.log('Total con departamento:', totalWithDept);
}

main().catch(console.error).finally(() => prisma.$disconnect());