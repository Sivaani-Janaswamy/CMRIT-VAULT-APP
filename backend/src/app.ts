import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { modulesRouter } from './modules';
import { errorHandler } from './common/middleware/errorHandler';
import { notFound } from './common/middleware/notFound';
import { requestLogger } from './common/middleware/requestLogger';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(requestLogger);

  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'OK',
      data: { status: 'healthy' },
      error: null
    });
  });

  app.use('/v1', modulesRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
