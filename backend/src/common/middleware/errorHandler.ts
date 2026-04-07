import type { NextFunction, Request, Response } from 'express';
import * as Sentry from '@sentry/node';

import { AppError } from '../errors/AppError';
import type { AuthenticatedRequest } from '../types/authenticated-request';
import { env } from '../../config/env';
import { logError } from '../utils/logger';

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestScopedReq = req as Request & { requestId?: string };
  const authReq = req as Partial<AuthenticatedRequest>;
  const requestId = requestScopedReq.requestId ?? res.locals.requestId ?? null;

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      data: null,
      error: {
        code: error.code,
        details: error.details ?? null,
        requestId
      }
    });
    return;
  }

  if (error instanceof Error && error.message.startsWith('CORS:')) {
    res.status(403).json({
      success: false,
      message: 'Origin not allowed',
      data: null,
      error: {
        code: 'CORS_FORBIDDEN',
        details: null,
        requestId
      }
    });
    return;
  }

  const message = env.isProduction ? 'Internal server error' : error instanceof Error ? error.message : 'Internal server error';
  logError('Unhandled error', {
    requestId,
    route: req.originalUrl,
    method: req.method,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : null
  });
  if (env.sentryDsn) {
    Sentry.withScope((scope) => {
      scope.setTag('request_id', String(requestId ?? 'unknown'));
      scope.setTag('route', req.originalUrl);
      scope.setTag('method', req.method);
      if (authReq.user?.id) {
        scope.setUser({
          id: authReq.user.id,
          email: authReq.user.email,
          username: authReq.user.fullName
        });
        scope.setTag('user_role', authReq.user.role);
      }
      Sentry.captureException(error);
    });
  }

  res.status(500).json({
    success: false,
    message,
    data: null,
    error: {
      code: 'INTERNAL_ERROR',
      details: null,
      requestId
    }
  });
}
