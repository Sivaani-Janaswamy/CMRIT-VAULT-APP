import { Router } from 'express';

import { authMiddleware } from '../../common/middleware/auth';
import { adminLimiter } from '../../common/middleware/rateLimiters';
import { validateBody, validateParams, validateQuery } from '../../common/middleware/validate';
import {
  adminUsersQuerySchema,
  updateOwnUserSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  userIdParamSchema
} from './users.schemas';
import {
  getAdminUserHandler,
  getMeHandler,
  listAdminUsersHandler,
  updateAdminUserRoleHandler,
  updateAdminUserStatusHandler,
  updateMeHandler
} from './users.controller';

export const usersRouter = Router();
export const adminUsersRouter = Router();

usersRouter.get('/me', authMiddleware, getMeHandler);
usersRouter.patch('/me', authMiddleware, validateBody(updateOwnUserSchema), updateMeHandler);

adminUsersRouter.get('/', authMiddleware, adminLimiter, validateQuery(adminUsersQuerySchema), listAdminUsersHandler);
adminUsersRouter.get('/:id', authMiddleware, adminLimiter, validateParams(userIdParamSchema), getAdminUserHandler);
adminUsersRouter.patch(
  '/:id/role',
  authMiddleware,
  adminLimiter,
  validateParams(userIdParamSchema),
  validateBody(updateUserRoleSchema),
  updateAdminUserRoleHandler
);
adminUsersRouter.patch(
  '/:id/status',
  authMiddleware,
  adminLimiter,
  validateParams(userIdParamSchema),
  validateBody(updateUserStatusSchema),
  updateAdminUserStatusHandler
);
