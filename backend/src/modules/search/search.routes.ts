import { Router } from 'express';

import { authMiddleware } from '../../common/middleware/auth';
import { validateParams, validateQuery } from '../../common/middleware/validate';
import {
  reindexAllResourcesHandler,
  reindexSingleResourceHandler,
  searchResourcesHandler,
  suggestResourcesHandler
} from './search.controller';
import {
  reindexResourceParamSchema,
  searchResourcesQuerySchema,
  suggestQuerySchema
} from './search.schemas';

export const searchRouter = Router();
export const adminSearchRouter = Router();

searchRouter.get('/resources', authMiddleware, validateQuery(searchResourcesQuerySchema), searchResourcesHandler);
searchRouter.get('/suggest', authMiddleware, validateQuery(suggestQuerySchema), suggestResourcesHandler);

adminSearchRouter.use(authMiddleware);
adminSearchRouter.post('/reindex', reindexAllResourcesHandler);
adminSearchRouter.post(
  '/resources/:id/reindex',
  validateParams(reindexResourceParamSchema),
  reindexSingleResourceHandler
);
