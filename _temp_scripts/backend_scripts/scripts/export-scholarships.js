require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
  const scholarships = await prisma.scholarship.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      officialUrl: true,
      needsReview: true,
      source: { select: { name: true } },
    },
  });
  const rows = scholarships.map(s => ({
    id: s.id,
    title: s.title,
    slug: s.slug,
    officialUrl: s.officialUrl,
    needsReview: s.needsReview,
    source: s.source ? s.source.name : null,
  }));
  fs.writeFileSync('C:/Users/JUAN/AppData/Local/Temp/opencode/scholarships.json', JSON.stringify(rows, null, 2), 'utf8');
  console.log('OK', rows.length);
}

main().finally(() => prisma.$disconnect());