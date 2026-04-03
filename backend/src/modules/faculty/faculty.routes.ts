import { Router } from 'express';

import { authMiddleware } from '../../common/middleware/auth';
import { validateParams, validateQuery } from '../../common/middleware/validate';
import {
  getFacultyDashboardSummaryHandler,
  getFacultyResourceStatsHandler,
  listFacultyResourcesHandler
} from './faculty.controller';
import {
  facultyDashboardQuerySchema,
  facultyResourceIdParamSchema,
  facultyResourcesQuerySchema
} from './faculty.schemas';

export const facultyRouter = Router();

facultyRouter.use(authMiddleware);
facultyRouter.get('/dashboard/summary', validateQuery(facultyDashboardQuerySchema), getFacultyDashboardSummaryHandler);
facultyRouter.get('/resources', validateQuery(facultyResourcesQuerySchema), listFacultyResourcesHandler);
facultyRouter.get(
  '/resources/:id/stats',
  validateParams(facultyResourceIdParamSchema),
  getFacultyResourceStatsHandler
);
