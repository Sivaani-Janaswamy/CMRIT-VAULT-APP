import type { Request, Response, NextFunction } from 'express';

import { authService } from './auth.service';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request';

export async function syncAuthHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const profile = await authService.syncCurrentUser(
      (req as AuthenticatedRequest).user
    );
    res.status(200).json({
      success: true,
      message: 'User synced successfully',
      data: { user: profile },
      error: null
    });
  } catch (error) {
    next(error);
  }
}
