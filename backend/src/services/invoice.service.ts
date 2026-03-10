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

  const order =
    sort?.startsWith('-') === true
      ? ('desc' as const)
      : ('asc' as const);
  const sortField = sort?.startsWith('-') ? sort.slice(1) : sort;

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: sortField ? { [sortField]: order } : { createdAt: 'desc' },
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

export type InvoicesSummary = {
  income: number;
  expenses: number;
  balance: number;
};

export async function getInvoicesSummary(
  userId: string
): Promise<InvoicesSummary> {
  const [incomeResult, expensesResult] = await Promise.all([
    prisma.invoice.aggregate({
      where: { userId, type: 'INCOME' },
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      where: { userId, type: 'EXPENSE' },
      _sum: { amount: true },
    }),
  ]);

  const income = Number(incomeResult._sum.amount ?? 0);
  const expenses = Number(expensesResult._sum.amount ?? 0);
  const balance = income - expenses;

  return { income, expenses, balance };
}

export type InvoicesStats = {
  PENDING: number;
  PAID: number;
  OVERDUE: number;
  CANCELED: number;
};

export async function getInvoicesStats(
  userId: string
): Promise<InvoicesStats> {
  const groups = await prisma.invoice.groupBy({
    by: ['status'],
    where: { userId },
    _count: { id: true },
  });

  const stats: InvoicesStats = {
    PENDING: 0,
    PAID: 0,
    OVERDUE: 0,
    CANCELED: 0,
  };

  for (const row of groups) {
    stats[row.status] = row._count.id;
  }

  return stats;
}

export type MonthlyMetric = {
  month: string;
  income: number;
  expenses: number;
};

type MonthlyMetricRow = {
  month: string;
  income: unknown;
  expenses: unknown;
};

export async function getMonthlyMetrics(
  userId: string,
  months?: number
): Promise<MonthlyMetric[]> {
  const startDate = new Date();
  if (months != null) {
    startDate.setMonth(startDate.getMonth() - months);
  } else {
    startDate.setTime(0);
  }

  const rows = await prisma.$queryRaw<MonthlyMetricRow[]>`
    SELECT
      TO_CHAR(DATE_TRUNC('month', "issueDate"), 'YYYY-MM') as month,
      COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0)::float as income,
      COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0)::float as expenses
    FROM "Invoice"
    WHERE "userId" = ${userId}
    AND "issueDate" >= ${startDate}
    GROUP BY DATE_TRUNC('month', "issueDate")
    ORDER BY month
  `;

  return rows.map((row) => ({
    month: row.month,
    income: Number(row.income),
    expenses: Number(row.expenses),
  }));
}
