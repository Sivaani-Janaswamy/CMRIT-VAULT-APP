import { Router } from 'express';

import { authMiddleware } from '../../common/middleware/auth';
import { validateQuery } from '../../common/middleware/validate';
import {
  adminDashboardQuerySchema,
  adminDownloadsOverviewQuerySchema,
  adminResourcesOverviewQuerySchema
} from './admin.schemas';
import {
  getAdminDashboardSummaryHandler,
  listAdminDownloadsOverviewHandler,
  listAdminResourcesOverviewHandler
} from './admin.controller';

export const adminRouter = Router();

adminRouter.use(authMiddleware);
adminRouter.get('/dashboard/summary', validateQuery(adminDashboardQuerySchema), getAdminDashboardSummaryHandler);
adminRouter.get('/resources/overview', validateQuery(adminResourcesOverviewQuerySchema), listAdminResourcesOverviewHandler);
adminRouter.get('/downloads/overview', validateQuery(adminDownloadsOverviewQuerySchema), listAdminDownloadsOverviewHandler);
