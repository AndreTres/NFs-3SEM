import { Response, NextFunction } from 'express';
import { validateSchema } from '../lib/validate';
import { createInvoiceSchema, updateInvoiceSchema } from '../schemas/invoice.schema';
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
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
    const invoices = await getInvoices(userId);
    res.json({ success: true, data: invoices });
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
    const id = req.params.id as string;
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
    const id = req.params.id as string;
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
    const id = req.params.id as string;
    await deleteInvoice(userId, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
