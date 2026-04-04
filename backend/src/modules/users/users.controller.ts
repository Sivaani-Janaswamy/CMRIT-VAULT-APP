import type { NextFunction, Request, Response } from 'express';

import type { AuthenticatedRequest } from '../../common/types/authenticated-request';
import { logDebug } from '../../common/utils/logger';
import { usersService } from './users.service';
import type {
  AdminUsersQuery,
  RoleCode,
  UpdateOwnUserInput,
  UpdateUserRoleInput,
  UpdateUserStatusInput
} from './users.types';

function getAuthUser(req: Request) {
  return (req as AuthenticatedRequest).user;
}

function successResponse<T>(message: string, data: T) {
  return {
    success: true,
    message,
    data,
    error: null
  };
}

export async function getMeHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = getAuthUser(req);
    logDebug('GET /v1/users/me received', { userId: authUser.id });
    const user = await usersService.getCurrentUser(authUser.id);
    logDebug('GET /v1/users/me success', { userId: user.id, role: user.role });
    res.status(200).json(successResponse('Current user fetched successfully', { user }));
  } catch (error) {
    logDebug('GET /v1/users/me failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}

export async function updateMeHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = getAuthUser(req);
    const body = req.body as UpdateOwnUserInput;
    logDebug('PATCH /v1/users/me received', { userId: authUser.id });
    const user = await usersService.updateCurrentUser(authUser.id, body);
    logDebug('PATCH /v1/users/me success', { userId: user.id, role: user.role });
    res.status(200).json(successResponse('Current user updated successfully', { user }));
  } catch (error) {
    logDebug('PATCH /v1/users/me failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}

export async function listAdminUsersHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = getAuthUser(req);
    const query = req.query as unknown as AdminUsersQuery;
    logDebug('GET /v1/admin/users received', {
      userId: authUser.id,
      page: query.page,
      pageSize: query.pageSize,
      role: query.role
    });
    const result = await usersService.listAdminUsers(authUser.id, query);
    logDebug('GET /v1/admin/users success', {
      userId: authUser.id,
      count: result.items.length,
      total: result.total
    });
    res.status(200).json(
      successResponse('Users fetched successfully', {
        items: result.items,
        pageInfo: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
          totalPages: result.totalPages
        }
      })
    );
  } catch (error) {
    logDebug('GET /v1/admin/users failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}

export async function getAdminUserHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = getAuthUser(req);
    const { id } = req.params as { id: string };
    logDebug('GET /v1/admin/users/:id received', { userId: authUser.id, targetUserId: id });
    const user = await usersService.getAdminUser(authUser.id, id);
    logDebug('GET /v1/admin/users/:id success', {
      userId: authUser.id,
      targetUserId: user.id,
      role: user.role
    });
    res.status(200).json(successResponse('User fetched successfully', { user }));
  } catch (error) {
    logDebug('GET /v1/admin/users/:id failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}

export async function updateAdminUserRoleHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = getAuthUser(req);
    const { id } = req.params as { id: string };
    const body = req.body as UpdateUserRoleInput;
    logDebug('PATCH /v1/admin/users/:id/role received', {
      userId: authUser.id,
      targetUserId: id,
      role: body.role
    });
    const user = await usersService.updateAdminUserRole(authUser.id, id, body.role as RoleCode);
    logDebug('PATCH /v1/admin/users/:id/role success', {
      userId: authUser.id,
      targetUserId: user.id,
      role: user.role
    });
    res.status(200).json(successResponse('User role updated successfully', { user }));
  } catch (error) {
    logDebug('PATCH /v1/admin/users/:id/role failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}

export async function updateAdminUserStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = getAuthUser(req);
    const { id } = req.params as { id: string };
    const body = req.body as UpdateUserStatusInput;
    logDebug('PATCH /v1/admin/users/:id/status received', {
      userId: authUser.id,
      targetUserId: id,
      isActive: body.is_active
    });
    const user = await usersService.updateAdminUserStatus(authUser.id, id, body.is_active);
    logDebug('PATCH /v1/admin/users/:id/status success', {
      userId: authUser.id,
      targetUserId: user.id,
      isActive: user.isActive
    });
    res.status(200).json(successResponse('User status updated successfully', { user }));
  } catch (error) {
    logDebug('PATCH /v1/admin/users/:id/status failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}
