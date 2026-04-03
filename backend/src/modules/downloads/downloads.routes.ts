import { Router } from 'express';

import { authMiddleware } from '../../common/middleware/auth';
import { validateBody, validateParams, validateQuery } from '../../common/middleware/validate';
import {
  createDownloadUrlHandler,
  listAdminDownloadsHandler,
  listMyDownloadsHandler
} from './downloads.controller';
import {
  createDownloadUrlSchema,
  listAdminDownloadsQuerySchema,
  listMyDownloadsQuerySchema,
  resourceIdParamSchema
} from './downloads.schemas';

export const resourceDownloadsRouter = Router();
export const downloadsRouter = Router();
export const adminDownloadsRouter = Router();

resourceDownloadsRouter.post(
  '/:id/download-url',
  authMiddleware,
  validateParams(resourceIdParamSchema),
  validateBody(createDownloadUrlSchema),
  createDownloadUrlHandler
);

downloadsRouter.get('/me', authMiddleware, validateQuery(listMyDownloadsQuerySchema), listMyDownloadsHandler);

adminDownloadsRouter.use(authMiddleware);
adminDownloadsRouter.get('/', validateQuery(listAdminDownloadsQuerySchema), listAdminDownloadsHandler);

