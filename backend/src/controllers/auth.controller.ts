import { Request, Response } from 'express';
import { registerSchema } from '../schemas/auth.schema';
import { loginSchema } from '../schemas/login.schema';
import { register, login } from '../services/auth.service';

export async function registerController(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue: { message: string }) => issue.message)
      .join('; ');
    const err = new Error(message) as Error & { statusCode?: number };
    err.statusCode = 400;
    throw err;
  }

  const user = await register(parsed.data);
  res.status(201).json({ success: true, data: user });
}

export async function loginController(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue: { message: string }) => issue.message)
      .join('; ');
    const err = new Error(message) as Error & { statusCode?: number };
    err.statusCode = 400;
    throw err;
  }

  const result = await login(parsed.data);
  res.json({ success: true, data: result });
}
