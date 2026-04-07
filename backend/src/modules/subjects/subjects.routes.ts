import { Router } from 'express';

import { authMiddleware } from '../../common/middleware/auth';
import { adminLimiter } from '../../common/middleware/rateLimiters';
import { validateBody, validateParams } from '../../common/middleware/validate';
import {
  createAdminSubjectHandler,
  deleteAdminSubjectHandler,
  getSubjectHandler,
  listSubjectsHandler,
  updateAdminSubjectHandler
} from './subjects.controller';
import {
  createSubjectSchema,
  subjectIdParamSchema,
  updateSubjectSchema
} from './subjects.schemas';

export const subjectsRouter = Router();
export const adminSubjectsRouter = Router();

subjectsRouter.get('/', authMiddleware, listSubjectsHandler);
subjectsRouter.get('/:id', authMiddleware, validateParams(subjectIdParamSchema), getSubjectHandler);

adminSubjectsRouter.use(authMiddleware);
adminSubjectsRouter.use(adminLimiter);
adminSubjectsRouter.post('/', validateBody(createSubjectSchema), createAdminSubjectHandler);
adminSubjectsRouter.patch(
  '/:id',
  validateParams(subjectIdParamSchema),
  validateBody(updateSubjectSchema),
  updateAdminSubjectHandler
);
adminSubjectsRouter.delete(
  '/:id',
  validateParams(subjectIdParamSchema),
  deleteAdminSubjectHandler
);
