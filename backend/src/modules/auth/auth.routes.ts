import { Router } from 'express';
import { z } from 'zod';

import { authMiddleware } from '../../common/middleware/auth';
import { authLimiter } from '../../common/middleware/rateLimiters';
import { validateBody } from '../../common/middleware/validate';
import { syncAuthHandler } from './auth.controller';

export const authRouter = Router();

authRouter.post('/sync', authLimiter, authMiddleware, validateBody(z.object({}).strict()), syncAuthHandler);
