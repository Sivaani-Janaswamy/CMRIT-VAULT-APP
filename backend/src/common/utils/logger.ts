import { env } from '../../config/env';

export function logDebug(message: string, meta?: Record<string, unknown>): void {
  if (env.nodeEnv === 'production') {
    return;
  }

  if (meta) {
    console.log(`[debug] ${message}`, meta);
    return;
  }

  console.log(`[debug] ${message}`);
}
