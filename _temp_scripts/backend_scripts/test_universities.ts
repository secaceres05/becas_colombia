import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const result = await prisma.university.findMany({
      take: 5,
      select: { id: true, name: true, type: true },
    });
    console.log('Success:', JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('Error:', e);
  }
  await prisma.$disconnect();
}

main().catch(console.error);