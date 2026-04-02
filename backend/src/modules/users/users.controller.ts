import type { Request, Response, NextFunction } from 'express';

import { usersService } from './users.service';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request';
import { logDebug } from '../../common/utils/logger';

export async function getMeHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    logDebug('GET /v1/users/me received', { userId: authUser.id });
    const user = await usersService.getCurrentUser(authUser.id);
    logDebug('GET /v1/users/me success', { userId: user.id, role: user.role });
    res.status(200).json({
      success: true,
      message: 'Current user fetched successfully',
      data: { user },
      error: null
    });
  } catch (error) {
    logDebug('GET /v1/users/me failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}
