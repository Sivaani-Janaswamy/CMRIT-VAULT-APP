import { Router } from 'express';

import { authRouter } from './auth/auth.routes';
import { subjectsRouter } from './subjects/subjects.routes';
import { usersRouter } from './users/users.routes';

export const modulesRouter = Router();

modulesRouter.use('/auth', authRouter);
modulesRouter.use('/users', usersRouter);
modulesRouter.use('/subjects', subjectsRouter);
