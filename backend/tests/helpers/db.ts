import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

/**
 * Remove todos os registros das tabelas usadas nos testes.
 * Ordem: Invoice primeiro (depende de User), depois User.
 * Usar em beforeEach nos testes que alteram dados.
 */
export async function truncateForTests(): Promise<void> {
  await prisma.invoice.deleteMany();
  await prisma.user.deleteMany();
}
