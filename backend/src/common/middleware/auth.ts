import type { NextFunction, Request, Response } from 'express';

import { supabaseServiceClient } from '../../integrations/supabase/client';
import { UnauthorizedError } from '../errors/UnauthorizedError';
import type { AuthenticatedRequest } from '../types/authenticated-request';
import type { User } from '../types/user';
import { logDebug } from '../utils/logger';
import { withRetryAndTimeout } from '../utils/retry';

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    logDebug('authMiddleware: auth request received');
    const header = req.header('authorization');
    logDebug('authMiddleware: bearer token present', { present: Boolean(header?.startsWith('Bearer ')) });
    if (!header?.startsWith('Bearer ')) {
      logDebug('authMiddleware: missing bearer token');
      throw new UnauthorizedError('Missing bearer token');
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      logDebug('authMiddleware: empty bearer token');
      throw new UnauthorizedError('Missing bearer token');
    }

    const { data, error } = await withRetryAndTimeout(() =>
      supabaseServiceClient.auth.getUser(token)
    );
    if (error || !data.user) {
      logDebug('authMiddleware: token validation failed', {
        error: error?.message ?? 'no user returned'
      });
      throw new UnauthorizedError('Invalid or expired token');
    }
    logDebug('authMiddleware: token validation passed', { userId: data.user.id });

    const user: User = {
      id: data.user.id,
      email: data.user.email ?? '',
      fullName:
        (data.user.user_metadata?.full_name as string | undefined) ??
        (data.user.user_metadata?.name as string | undefined) ??
        data.user.email ??
        '',
      // Role must be resolved from internal DB during sync/authorization checks.
      role: 'student'
    };
    (req as AuthenticatedRequest).user = user;
    logDebug('authMiddleware: user attached to request', {
      userId: user.id,
      role: user.role
    });

    next();
  } catch (error) {
    next(error);
  }
}
