import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['query', 'warn', 'error'],
  });
};

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
