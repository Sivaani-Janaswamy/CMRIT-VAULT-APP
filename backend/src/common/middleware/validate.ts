import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

import { AppError } from '../errors/AppError';

function validatePart(schema: ZodTypeAny, value: unknown) {
  return schema.safeParse(value);
}

function buildValidator(part: 'body' | 'query' | 'params', schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = validatePart(schema, req[part]);
    if (!result.success) {
      next(
        new AppError(422, 'Validation failed', 'VALIDATION_ERROR', result.error.flatten())
      );
      return;
    }

    (req as Request & Record<'body' | 'query' | 'params', unknown>)[part] = result.data;
    next();
  };
}

export function validateBody(schema: ZodTypeAny) {
  return buildValidator('body', schema);
}

export function validateQuery(schema: ZodTypeAny) {
  return buildValidator('query', schema);
}

export function validateParams(schema: ZodTypeAny) {
  return buildValidator('params', schema);
}
