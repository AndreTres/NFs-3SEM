import { Response, NextFunction } from 'express';
import { validateSchema } from '../lib/validate';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  paramsIdSchema,
  invoiceQuerySchema,
  monthlyQuerySchema,
} from '../schemas/invoice.schema';
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  getInvoicesSummary,
  getInvoicesStats,
  getMonthlyMetrics,
  updateInvoice,
  deleteInvoice,
} from '../services/invoice.service';
import type { AuthRequest } from '../middlewares/auth.middleware';

export async function createInvoiceController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const data = validateSchema(createInvoiceSchema, req.body);
    const invoice = await createInvoice(userId, data);
    res.status(201).json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
}

export async function getInvoicesController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const query = validateSchema(invoiceQuerySchema, req.query);
    const result = await getInvoices(userId, query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function getInvoicesSummaryController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const summary = await getInvoicesSummary(userId);
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
}

export async function getInvoicesStatsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const stats = await getInvoicesStats(userId);
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}

export async function getMonthlyMetricsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const query = validateSchema(monthlyQuerySchema, req.query);
    const data = await getMonthlyMetrics(userId, query.months);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getInvoiceByIdController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = validateSchema(paramsIdSchema, req.params);
    const invoice = await getInvoiceById(userId, id);
    res.json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
}

export async function updateInvoiceController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = validateSchema(paramsIdSchema, req.params);
    const data = validateSchema(updateInvoiceSchema, req.body);
    const invoice = await updateInvoice(userId, id, data);
    res.json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
}

export async function deleteInvoiceController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = validateSchema(paramsIdSchema, req.params);
    await deleteInvoice(userId, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
