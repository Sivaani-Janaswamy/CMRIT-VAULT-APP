import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../errors/AppError';

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      data: null,
      error: {
        code: error.code,
        details: error.details ?? null
      }
    });
    return;
  }

  const message = error instanceof Error ? error.message : 'Internal server error';
  console.error(error);

  res.status(500).json({
    success: false,
    message,
    data: null,
    error: {
      code: 'INTERNAL_ERROR',
      details: null
    }
  });
}
