import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

import { AppError } from '../errors/AppError';

export function validateBody(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(
        new AppError(422, 'Validation failed', 'VALIDATION_ERROR', result.error.flatten())
      );
      return;
    }

    req.body = result.data;
    next();
  };
}
