import { Router } from 'express';
import { z } from 'zod';

import { authMiddleware } from '../../common/middleware/auth';
import { validateBody } from '../../common/middleware/validate';
import { syncAuthHandler } from './auth.controller';

export const authRouter = Router();

authRouter.post('/sync', authMiddleware, validateBody(z.object({}).strict()), syncAuthHandler);
