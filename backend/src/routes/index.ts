import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import invoiceRoutes from './invoice.routes';

const router = Router();

router.use(healthRoutes);
router.use('/auth', authRoutes);
router.use('/invoices', invoiceRoutes);

export default router;
