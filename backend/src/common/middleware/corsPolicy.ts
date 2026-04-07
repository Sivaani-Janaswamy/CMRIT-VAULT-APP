import cors, { type CorsOptions } from 'cors';

import { env } from '../../config/env';

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, '');
}

const allowlist = new Set(env.appAllowedOrigins.map(normalizeOrigin));

const options: CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      if (!env.isProduction || env.allowMissingOrigin) {
        callback(null, true);
        return;
      }
      callback(new Error('CORS: origin header required'));
      return;
    }

    const normalized = normalizeOrigin(origin);
    if (!env.isProduction) {
      callback(null, true);
      return;
    }

    if (allowlist.has(normalized)) {
      callback(null, true);
      return;
    }

    callback(new Error('CORS: origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id']
};

export const corsMiddleware = cors(options);
