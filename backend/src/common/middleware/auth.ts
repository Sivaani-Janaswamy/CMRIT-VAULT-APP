import type { NextFunction, Request, Response } from 'express';

import { supabaseServiceClient } from '../../integrations/supabase/client';
import { UnauthorizedError } from '../errors/UnauthorizedError';
import type { AuthenticatedRequest } from '../types/authenticated-request';
import type { User } from '../types/user';

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const header = req.header('authorization');
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing bearer token');
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedError('Missing bearer token');
    }

    const { data, error } = await supabaseServiceClient.auth.getUser(token);
    if (error || !data.user) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    const user: User = {
      id: data.user.id,
      email: data.user.email ?? '',
      fullName:
        (data.user.user_metadata?.full_name as string | undefined) ??
        (data.user.user_metadata?.name as string | undefined) ??
        data.user.email ??
        '',
      role: (data.user.user_metadata?.role as string | undefined) ?? 'student'
    };
    (req as AuthenticatedRequest).user = user;

    next();
  } catch (error) {
    next(error);
  }
}
