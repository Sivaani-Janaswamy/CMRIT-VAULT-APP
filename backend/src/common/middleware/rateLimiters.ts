import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

import { env } from '../../config/env';
import type { AuthenticatedRequest } from '../types/authenticated-request';

function withUserAwareKeyGenerator(prefix: string) {
  return (req: Request) => {
    const userId = (req as AuthenticatedRequest).user?.id;
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    return userId ? `${prefix}:user:${userId}` : `${prefix}:ip:${ip}`;
  };
}

function createLimiter(
  windowMs: number,
  max: number,
  prefix: string,
  message: string,
  userAware = false
) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.nodeEnv === 'test',
    keyGenerator: userAware ? withUserAwareKeyGenerator(prefix) : undefined,
    message: {
      success: false,
      message,
      data: null,
      error: {
        code: 'RATE_LIMITED',
        details: null
      }
    }
  });
}

export const globalLimiter = createLimiter(
  env.globalRateLimitWindowMs,
  env.globalRateLimitMax,
  'global',
  'Too many requests. Please try again later.'
);

export const authLimiter = createLimiter(
  env.authRateLimitWindowMs,
  env.authRateLimitMax,
  'auth',
  'Too many authentication attempts. Please wait and retry.'
);

export const uploadMutationLimiter = createLimiter(
  env.uploadRateLimitWindowMs,
  env.uploadRateLimitMax,
  'upload',
  'Too many resource mutations. Please wait and retry.',
  true
);

export const downloadUrlLimiter = createLimiter(
  env.downloadRateLimitWindowMs,
  env.downloadRateLimitMax,
  'download-url',
  'Too many download URL requests. Please wait and retry.',
  true
);

export const adminLimiter = createLimiter(
  env.adminRateLimitWindowMs,
  env.adminRateLimitMax,
  'admin',
  'Too many admin requests. Please wait and retry.',
  true
);
