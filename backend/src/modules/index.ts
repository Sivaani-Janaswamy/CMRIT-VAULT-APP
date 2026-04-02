import { Router } from 'express';

import { authRouter } from './auth/auth.routes';
import { adminSubjectsRouter, subjectsRouter } from './subjects/subjects.routes';
import { adminResourcesRouter, resourcesRouter } from './resources/resources.routes';
import { adminUsersRouter, usersRouter } from './users/users.routes';

export const modulesRouter = Router();

modulesRouter.use('/auth', authRouter);
modulesRouter.use('/users', usersRouter);
modulesRouter.use('/admin/users', adminUsersRouter);
modulesRouter.use('/admin/subjects', adminSubjectsRouter);
modulesRouter.use('/admin/resources', adminResourcesRouter);
modulesRouter.use('/subjects', subjectsRouter);
modulesRouter.use('/resources', resourcesRouter);
