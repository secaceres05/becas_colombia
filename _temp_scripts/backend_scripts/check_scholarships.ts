import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const count = await prisma.scholarship.count();
  console.log('Total scholarships:', count);
  if (count > 0) {
    const s = await prisma.scholarship.findFirst();
    if (s) console.log('First:', s.id, s.title, s.needsReview, s.status);
  }
  await prisma.$disconnect();
}

main().catch(console.error);