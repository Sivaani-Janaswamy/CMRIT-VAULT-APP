import express from 'express';
import helmet from 'helmet';

import { modulesRouter } from './modules';
import { errorHandler } from './common/middleware/errorHandler';
import { notFound } from './common/middleware/notFound';
import { requestLogger } from './common/middleware/requestLogger';
import { requestIdMiddleware } from './common/middleware/requestId';
import { corsMiddleware } from './common/middleware/corsPolicy';
import { globalLimiter } from './common/middleware/rateLimiters';
import { logDebug } from './common/utils/logger';

export function createApp() {
  const app = express();

  app.use(requestIdMiddleware);
  app.use(globalLimiter);
  app.use(helmet());
  app.use(corsMiddleware);
  app.use(express.json());
  app.use(requestLogger);

  app.get('/health', (_req, res) => {
    logDebug('GET /health received');
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
