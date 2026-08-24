import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const s = await prisma.scholarship.findMany({ select: { id: true, title: true, needsReview: true, status: true } });
  console.log('Total:', s.length);
  s.forEach(x => console.log(x.id, x.title, x.needsReview, x.status));
  await prisma.$disconnect();
}

main().catch(console.error);