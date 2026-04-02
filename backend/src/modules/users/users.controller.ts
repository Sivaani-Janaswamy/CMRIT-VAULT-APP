import type { Request, Response, NextFunction } from 'express';

import { usersService } from './users.service';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request';

export async function getMeHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await usersService.getCurrentUser(
      (req as AuthenticatedRequest).user.id
    );
    res.status(200).json({
      success: true,
      message: 'Current user fetched successfully',
      data: { user },
      error: null
    });
  } catch (error) {
    next(error);
  }
}
