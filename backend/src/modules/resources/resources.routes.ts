import { Router } from 'express';

import { authMiddleware } from '../../common/middleware/auth';
import { uploadMutationLimiter } from '../../common/middleware/rateLimiters';
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
resourcesRouter.post('/', authMiddleware, uploadMutationLimiter, validateBody(createResourceSchema), createResourceHandler);
resourcesRouter.patch(
  '/:id',
  authMiddleware,
  uploadMutationLimiter,
  validateParams(resourceIdParamSchema),
  validateBody(updateResourceSchema),
  updateResourceHandler
);
resourcesRouter.post(
  '/:id/complete',
  authMiddleware,
  uploadMutationLimiter,
  validateParams(resourceIdParamSchema),
  completeResourceHandler
);
resourcesRouter.post(
  '/:id/submit',
  authMiddleware,
  uploadMutationLimiter,
  validateParams(resourceIdParamSchema),
  submitResourceHandler
);
resourcesRouter.delete('/:id', authMiddleware, uploadMutationLimiter, validateParams(resourceIdParamSchema), archiveResourceHandler);

adminResourcesRouter.use(authMiddleware);
adminResourcesRouter.use(uploadMutationLimiter);
adminResourcesRouter.patch(
  '/:id/status',
  validateParams(resourceIdParamSchema),
  validateBody(updateResourceStatusSchema),
  updateResourceStatusHandler
);
