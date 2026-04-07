import { createApp } from './app';
import { env } from './config/env';
import { logDebug, logError, logInfo } from './common/utils/logger';
import * as Sentry from '@sentry/node';

const app = createApp();

if (env.sentryDsn) {
  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.nodeEnv,
    enabled: true
  });
}

const server = app.listen(env.port, () => {
  logInfo(`Backend running on port ${env.port}`);
});

let shuttingDown = false;

function shutdown(signal: string): void {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  logInfo('Shutdown requested', { signal });

  server.close((error) => {
    if (error) {
      logError('Graceful shutdown failed', { error: error.message });
      process.exit(1);
      return;
    }

    logInfo('HTTP server closed gracefully');
    process.exit(0);
  });

  setTimeout(() => {
    logError('Force shutdown timeout reached');
    process.exit(1);
  }, 15_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('uncaughtException', (error) => {
  logError('Uncaught exception', { error: error.message, stack: error.stack });
});

process.on('unhandledRejection', (reason) => {
  logError('Unhandled rejection', {
    reason: reason instanceof Error ? reason.message : String(reason)
  });
});
