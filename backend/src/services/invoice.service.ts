import { prisma } from '../lib/prisma';
import type { z } from 'zod';
import type {
  createInvoiceSchema,
  updateInvoiceSchema,
  invoiceQuerySchema,
} from '../schemas/invoice.schema';

type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
type GetInvoicesQuery = z.infer<typeof invoiceQuerySchema>;

function throwNotFound(message: string): never {
  const err = new Error(message) as Error & { statusCode?: number };
  err.statusCode = 404;
  throw err;
}

function throwBadRequest(message: string): never {
  const err = new Error(message) as Error & { statusCode?: number };
  err.statusCode = 400;
  throw err;
}

export async function createInvoice(userId: string, data: CreateInvoiceInput) {
  return prisma.invoice.create({
    data: {
      userId,
      number: data.number,
      amount: data.amount,
      issueDate: new Date(data.issueDate),
      dueDate: new Date(data.dueDate),
      status: data.status,
      type: data.type,
    },
  });
}

export async function getInvoices(
  userId: string,
  query: GetInvoicesQuery = {}
) {
  const { page = 1, limit = 10, status, type, sort } = query;

  const where = {
    userId,
    ...(status && { status }),
    ...(type && { type }),
  };

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: sort ? { [sort]: 'asc' } : { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.invoice.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: invoices,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}

export async function getInvoiceById(userId: string, id: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id, userId },
  });

  if (!invoice) {
    throwNotFound('Invoice not found');
  }

  return invoice;
}

export async function updateInvoice(
  userId: string,
  id: string,
  data: UpdateInvoiceInput
) {
  const invoice = await prisma.invoice.findFirst({
    where: { id, userId },
  });

  if (!invoice) {
    throwNotFound('Invoice not found');
  }

  if (invoice.status === 'CANCELED') {
    throwBadRequest('Cannot update a canceled invoice');
  }

  return prisma.invoice.update({
    where: { id },
    data: {
      ...(data.number !== undefined && { number: data.number }),
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.issueDate !== undefined && {
        issueDate: new Date(data.issueDate),
      }),
      ...(data.dueDate !== undefined && { dueDate: new Date(data.dueDate) }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.type !== undefined && { type: data.type }),
    },
  });
}

export async function deleteInvoice(userId: string, id: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id, userId },
  });

  if (!invoice) {
    throwNotFound('Invoice not found');
  }

  return prisma.invoice.delete({
    where: { id },
  });
}
