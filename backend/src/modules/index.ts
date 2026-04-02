import { Router } from 'express';

import { authRouter } from './auth/auth.routes';
import { subjectsRouter } from './subjects/subjects.routes';
import { adminUsersRouter, usersRouter } from './users/users.routes';

export const modulesRouter = Router();

modulesRouter.use('/auth', authRouter);
modulesRouter.use('/users', usersRouter);
modulesRouter.use('/admin/users', adminUsersRouter);
modulesRouter.use('/subjects', subjectsRouter);
