import { z } from 'zod';

export const InvoiceStatus = z.enum([
  'PENDING',
  'PAID',
  'OVERDUE',
  'CANCELED',
]);

export const InvoiceType = z.enum(['INCOME', 'EXPENSE']);

export const createInvoiceSchema = z
  .object({
    number: z.string().min(1),
    amount: z.number().positive(),
    issueDate: z.iso.datetime(),
    dueDate: z.iso.datetime(),
    status: InvoiceStatus,
    type: InvoiceType,
  })
  .refine(
    (data) => new Date(data.dueDate) >= new Date(data.issueDate),
    { message: 'dueDate must be greater than or equal to issueDate', path: ['dueDate'] }
  );

export const updateInvoiceSchema = z.object({
  number: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  issueDate: z.iso.datetime().optional(),
  dueDate: z.iso.datetime().optional(),
  status: InvoiceStatus.optional(),
  type: InvoiceType.optional(),
});

export const paramsIdSchema = z.object({
  id: z.string().uuid(),
});

export const invoiceQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  status: InvoiceStatus.optional(),
  type: InvoiceType.optional(),
  sort: z.string().optional(),
});

export const monthlyQuerySchema = z.object({
  months: z.coerce.number().int().positive().optional(),
});
