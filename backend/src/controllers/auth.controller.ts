import { Request, Response, NextFunction } from 'express';
import { registerSchema } from '../schemas/auth.schema';
import { loginSchema } from '../schemas/login.schema';
import { validateSchema } from '../lib/validate';
import { register, login } from '../services/auth.service';

export async function registerController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = validateSchema(registerSchema, req.body);
    const user = await register(data);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function loginController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = validateSchema(loginSchema, req.body);
    const result = await login(data);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
