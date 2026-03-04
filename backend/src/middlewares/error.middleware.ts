import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

type ErrorWithStatus = Error & { statusCode?: number };

export function errorMiddleware(
  err: ErrorWithStatus,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.statusCode ?? 500;
  const message =
    status >= 500 ? 'Internal server error' : (err.message ?? 'Error');

  if (status >= 500) {
    logger.error(message);
  } else {
    logger.warn(message);
  }

  res.status(status).json({
    success: false,
    error: message,
  });
}
