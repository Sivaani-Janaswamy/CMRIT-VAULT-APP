import type { Request, Response, NextFunction } from 'express';

import { authService } from './auth.service';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request';
import { logDebug } from '../../common/utils/logger';

export async function syncAuthHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    logDebug('POST /v1/auth/sync received', { userId: authUser.id });
    const profile = await authService.syncCurrentUser(authUser);
    logDebug('POST /v1/auth/sync success', {
      userId: profile.id,
      role: profile.role
    });
    res.status(200).json({
      success: true,
      message: 'User synced successfully',
      data: { user: profile },
      error: null
    });
  } catch (error) {
    logDebug('POST /v1/auth/sync failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}
