import { Router } from 'express';
import { registerController, loginController } from '../controllers/auth.controller';
import { authRateLimit } from '../middlewares/rate-limit.middleware';

const router = Router();

router.post('/register', authRateLimit, registerController);
router.post('/login', authRateLimit, loginController);

export default router;
