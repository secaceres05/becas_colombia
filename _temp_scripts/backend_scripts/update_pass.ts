import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hash = await argon2.hash('admin123');
  console.log('Hash generated:', hash.substring(0, 30) + '...');
  
  await prisma.adminUser.update({
    where: { email: 'admin@local.test' },
    data: { passwordHash: hash }
  });
  
  console.log('Password updated successfully');
  await prisma.$disconnect();
}

main().catch(console.error);