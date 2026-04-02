import { Router } from 'express';

import { authMiddleware } from '../../common/middleware/auth';
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

adminUsersRouter.get('/', authMiddleware, validateQuery(adminUsersQuerySchema), listAdminUsersHandler);
adminUsersRouter.get('/:id', authMiddleware, validateParams(userIdParamSchema), getAdminUserHandler);
adminUsersRouter.patch(
  '/:id/role',
  authMiddleware,
  validateParams(userIdParamSchema),
  validateBody(updateUserRoleSchema),
  updateAdminUserRoleHandler
);
adminUsersRouter.patch(
  '/:id/status',
  authMiddleware,
  validateParams(userIdParamSchema),
  validateBody(updateUserStatusSchema),
  updateAdminUserStatusHandler
);
