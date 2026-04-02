import { Router } from 'express';

import { authMiddleware } from '../../common/middleware/auth';
import { getMeHandler } from './users.controller';

export const usersRouter = Router();

usersRouter.get('/me', authMiddleware, getMeHandler);
