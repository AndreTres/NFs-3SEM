import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';
import { AppError } from '../errors/app-error';

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err instanceof AppError ? err.statusCode : 500;
  const message =
    status >= 500 ? 'Internal server error' : (err.message ?? 'Error');

  if (status >= 500) {
    logger.error(err.stack ?? err.message);
  } else {
    logger.warn(message);
  }

  res.status(status).json({
    success: false,
    error: message,
  });
}
