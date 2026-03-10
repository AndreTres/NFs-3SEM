import { prisma } from './db';
import type { Invoice, InvoiceStatus, InvoiceType } from '@prisma/client';

export type CreateTestInvoiceOverrides = {
  number?: string;
  amount?: number;
  issueDate?: Date;
  dueDate?: Date;
  status?: InvoiceStatus;
  type?: InvoiceType;
};

/**
 * Cria uma invoice de teste para o usuário informado.
 * Número único por chamada (timestamp). Campos opcionais podem ser sobrescritos.
 */
export async function createTestInvoice(
  userId: string,
  overrides: CreateTestInvoiceOverrides = {}
): Promise<Invoice> {
  const now = new Date();
  return prisma.invoice.create({
    data: {
      number: overrides.number ?? `INV-${Date.now()}`,
      amount: overrides.amount ?? 100,
      issueDate: overrides.issueDate ?? now,
      dueDate: overrides.dueDate ?? now,
      status: overrides.status ?? 'PENDING',
      type: overrides.type ?? 'INCOME',
      userId,
    },
  });
}

/**
 * Cria múltiplas invoices de teste para o mesmo usuário.
 * Cada invoice recebe número único (timestamp + índice) para evitar conflito de unique.
 */
export async function createTestInvoices(
  userId: string,
  count: number
): Promise<Invoice[]> {
  const invoices: Invoice[] = [];
  const base = Date.now();

  for (let i = 0; i < count; i++) {
    const invoice = await createTestInvoice(userId, {
      number: `INV-${base}-${i}`,
    });
    invoices.push(invoice);
  }

  return invoices;
}

/**
 * Cria um dataset fixo de 5 invoices com dados previsíveis para testes do Query Layer
 * (paginação, filtros, ordenação). Usa createTestInvoice em sequência.
 */
export async function seedInvoicesDataset(userId: string): Promise<Invoice[]> {
  const inv1 = await createTestInvoice(userId, {
    number: 'INV-001',
    amount: 100,
    status: 'PENDING',
    type: 'INCOME',
  });
  const inv2 = await createTestInvoice(userId, {
    number: 'INV-002',
    amount: 200,
    status: 'PENDING',
    type: 'EXPENSE',
  });
  const inv3 = await createTestInvoice(userId, {
    number: 'INV-003',
    amount: 300,
    status: 'PAID',
    type: 'INCOME',
  });
  const inv4 = await createTestInvoice(userId, {
    number: 'INV-004',
    amount: 400,
    status: 'PAID',
    type: 'EXPENSE',
  });
  const inv5 = await createTestInvoice(userId, {
    number: 'INV-005',
    amount: 500,
    status: 'PENDING',
    type: 'INCOME',
  });
  return [inv1, inv2, inv3, inv4, inv5];
}
