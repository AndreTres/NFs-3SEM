import { Request, Response } from 'express';
import { registerSchema } from '../schemas/auth.schema';
import { loginSchema } from '../schemas/login.schema';
import { validateSchema } from '../lib/validate';
import { register, login } from '../services/auth.service';

export async function registerController(
  req: Request,
  res: Response
): Promise<void> {
  const data = validateSchema(registerSchema, req.body);
  const user = await register(data);
  res.status(201).json({ success: true, data: user });
}

export async function loginController(
  req: Request,
  res: Response
): Promise<void> {
  const data = validateSchema(loginSchema, req.body);
  const result = await login(data);
  res.json({ success: true, data: result });
}
