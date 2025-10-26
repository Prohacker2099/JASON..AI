import { PrismaClient } from '@prisma/client';

// Singleton Prisma client to avoid exhausting DB connections in dev
let globalPrisma: PrismaClient | undefined;

export const prisma: PrismaClient = globalPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalPrisma = prisma;
}
