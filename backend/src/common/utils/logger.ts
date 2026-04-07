import { env } from '../../config/env';
import pino from 'pino';

const level = env.nodeEnv === 'production' ? 'info' : 'debug';

export const logger = pino({
  level,
  redact: {
    paths: [
      'req.headers.authorization',
      'authorization',
      'token',
      '*.token',
      '*.password',
      '*.secret',
      '*.apiKey',
      '*.accessToken'
    ],
    remove: true
  }
});

export function logDebug(message: string, meta?: Record<string, unknown>): void {
  logger.debug(meta ?? {}, message);
}

export function logInfo(message: string, meta?: Record<string, unknown>): void {
  logger.info(meta ?? {}, message);
}

export function logWarn(message: string, meta?: Record<string, unknown>): void {
  logger.warn(meta ?? {}, message);
}

export function logError(message: string, meta?: Record<string, unknown>): void {
  logger.error(meta ?? {}, message);
}
