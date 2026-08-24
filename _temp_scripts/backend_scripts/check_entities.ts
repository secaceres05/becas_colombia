import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const entities = await prisma.entity.findMany({ select: { id: true, name: true } });
  console.log('Entities in current DB:', entities.length);
  entities.forEach(e => console.log(e.id, e.name));
  await prisma.$disconnect();
}

main().catch(console.error);