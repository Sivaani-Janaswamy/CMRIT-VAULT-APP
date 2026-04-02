import { Router } from 'express';

import { authMiddleware } from '../../common/middleware/auth';
import { validateBody, validateParams, validateQuery } from '../../common/middleware/validate';
import {
  archiveResourceHandler,
  completeResourceHandler,
  createResourceHandler,
  getResourceHandler,
  listResourcesHandler,
  submitResourceHandler,
  updateResourceStatusHandler,
  updateResourceHandler
} from './resources.controller';
import {
  createResourceSchema,
  listResourcesQuerySchema,
  resourceIdParamSchema,
  updateResourceStatusSchema,
  updateResourceSchema
} from './resources.schemas';

export const resourcesRouter = Router();
export const adminResourcesRouter = Router();

resourcesRouter.get('/', authMiddleware, validateQuery(listResourcesQuerySchema), listResourcesHandler);
resourcesRouter.get('/:id', authMiddleware, validateParams(resourceIdParamSchema), getResourceHandler);
resourcesRouter.post('/', authMiddleware, validateBody(createResourceSchema), createResourceHandler);
resourcesRouter.patch(
  '/:id',
  authMiddleware,
  validateParams(resourceIdParamSchema),
  validateBody(updateResourceSchema),
  updateResourceHandler
);
resourcesRouter.post(
  '/:id/complete',
  authMiddleware,
  validateParams(resourceIdParamSchema),
  completeResourceHandler
);
resourcesRouter.post(
  '/:id/submit',
  authMiddleware,
  validateParams(resourceIdParamSchema),
  submitResourceHandler
);
resourcesRouter.delete('/:id', authMiddleware, validateParams(resourceIdParamSchema), archiveResourceHandler);

adminResourcesRouter.use(authMiddleware);
adminResourcesRouter.patch(
  '/:id/status',
  validateParams(resourceIdParamSchema),
  validateBody(updateResourceStatusSchema),
  updateResourceStatusHandler
);
