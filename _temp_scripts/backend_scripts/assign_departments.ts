// @ts-nocheck
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

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

  // Verify filters work - count by region
  const caribe = await prisma.scholarship.count({
    where: { departments: { some: { daneCode: { in: ['11', '76', '5'] } } } }
  });
  console.log('Caribe:', caribe);

  const andina = await prisma.scholarship.count({
    where: { departments: { some: { daneCode: { in: ['11', '76', '5', '13', '15', '17', '18', '19', '20', '23', '25', '27', '41', '44', '47', '50', '52', '54', '57', '63', '66', '68'] } } } }
  });
  console.log('Andina:', andina);

  const pacifica = await prisma.scholarship.count({
    where: { departments: { some: { daneCode: { in: ['76', '5', '11', '13', '17', '19', '27', '44', '47', '52', '68', '70'] } } } }
  });
  console.log('Pacífica:', pacifica);

  const orinoquia = await prisma.scholarship.count({
    where: { departments: { some: { daneCode: { in: ['13', '17', '19', '20', '23', '25', '27', '29', '33', '41', '44', '47', '50', '52', '54', '57', '63', '66', '68', '70', '81', '85', '86', '88', '91', '94', '95', '97', '99'] } } } }
  });
  console.log('Orinoquía:', orinoquia);

  const amazonia = await prisma.scholarship.count({
    where: { departments: { some: { daneCode: { in: ['18', '18', '81', '86', '91', '91', '94'] } } } }
  });
  console.log('Amazonía:', amazonia);

  const totalWithDept = await prisma.scholarship.count({
    where: { departments: { some: {} } }
  });
  console.log('Total con departamento:', totalWithDept);
}

main().catch(console.error).finally(() => prisma.$disconnect());