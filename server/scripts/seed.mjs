// Use root-level generated client to avoid initialization issues when running from server cwd
import { PrismaClient } from '../../node_modules/@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { id: 'demo-user' },
    create: {
      id: 'demo-user',
      username: 'demo',
      email: 'demo@example.com',
      passwordHash: 'demo',
      salt: 'demo',
    },
    update: {},
  });
  console.log('Seeded user:', user.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
