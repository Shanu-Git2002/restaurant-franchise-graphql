import { PrismaClient } from '@prisma/client';
import { config } from './index';

declare global {
  var __prisma: PrismaClient | undefined;
}

const createPrismaClient = () =>
  new PrismaClient({
    log: config.isDev ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'minimal',
  });

export const prisma = globalThis.__prisma ?? createPrismaClient();

if (config.isDev) globalThis.__prisma = prisma;

export async function connectDatabase() {
  await prisma.$connect();
  console.log('PostgreSQL connected via Prisma');
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}
