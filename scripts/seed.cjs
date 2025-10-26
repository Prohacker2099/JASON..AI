const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  try {
    await prisma.user.upsert({
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
    console.log('Seeded demo-user');
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
