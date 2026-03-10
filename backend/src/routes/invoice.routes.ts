import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { invoicesRateLimit } from '../middlewares/rate-limit.middleware';
import {
  createInvoiceController,
  getInvoicesController,
  getInvoicesSummaryController,
  getInvoicesStatsController,
  getMonthlyMetricsController,
  getInvoiceByIdController,
  updateInvoiceController,
  deleteInvoiceController,
} from '../controllers/invoice.controller';

const router = Router();

router.use(authMiddleware);
router.use(invoicesRateLimit);

router.post('/', createInvoiceController);
router.get('/', getInvoicesController);
router.get('/summary', getInvoicesSummaryController);
router.get('/stats', getInvoicesStatsController);
router.get('/monthly', getMonthlyMetricsController);
router.get('/:id', getInvoiceByIdController);
router.patch('/:id', updateInvoiceController);
router.delete('/:id', deleteInvoiceController);

export default router;
