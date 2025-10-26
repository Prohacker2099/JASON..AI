import { prisma } from '../server/utils/prisma';

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
