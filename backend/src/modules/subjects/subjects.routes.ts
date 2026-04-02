import { Router } from 'express';

import { authMiddleware } from '../../common/middleware/auth';
import { listSubjectsHandler } from './subjects.controller';

export const subjectsRouter = Router();

subjectsRouter.get('/', authMiddleware, listSubjectsHandler);
