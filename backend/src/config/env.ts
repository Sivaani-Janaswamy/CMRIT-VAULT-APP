import dotenv from 'dotenv';

dotenv.config();

const isTestEnv = (process.env.NODE_ENV ?? '').trim() === 'test';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    if (isTestEnv) {
      return `test-${name.toLowerCase()}`;
    }
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function asNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value == null) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }

  return fallback;
}

function asCsvList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export const env = {
  port: asNumber(process.env.PORT, 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: (process.env.NODE_ENV ?? 'development') === 'production',
  appAllowedOrigins: asCsvList(process.env.APP_ALLOWED_ORIGINS),
  allowMissingOrigin: asBoolean(process.env.ALLOW_MISSING_ORIGIN, true),
  requestTimeoutMs: asNumber(process.env.REQUEST_TIMEOUT_MS, 8000),
  retryCount: asNumber(process.env.REQUEST_RETRY_COUNT, 2),
  retryBaseDelayMs: asNumber(process.env.REQUEST_RETRY_BASE_DELAY_MS, 200),
  globalRateLimitWindowMs: asNumber(process.env.GLOBAL_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  globalRateLimitMax: asNumber(process.env.GLOBAL_RATE_LIMIT_MAX, 600),
  authRateLimitWindowMs: asNumber(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  authRateLimitMax: asNumber(process.env.AUTH_RATE_LIMIT_MAX, 30),
  uploadRateLimitWindowMs: asNumber(process.env.UPLOAD_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  uploadRateLimitMax: asNumber(process.env.UPLOAD_RATE_LIMIT_MAX, 40),
  downloadRateLimitWindowMs: asNumber(process.env.DOWNLOAD_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  downloadRateLimitMax: asNumber(process.env.DOWNLOAD_RATE_LIMIT_MAX, 120),
  adminRateLimitWindowMs: asNumber(process.env.ADMIN_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  adminRateLimitMax: asNumber(process.env.ADMIN_RATE_LIMIT_MAX, 120),
  sentryDsn: process.env.SENTRY_DSN,
  uploadBucket: process.env.UPLOAD_BUCKET ?? 'cmrit-vault-files',
  uploadMaxBytes: asNumber(process.env.UPLOAD_MAX_BYTES, 25 * 1024 * 1024),
  allowedUploadMimeTypes: asCsvList(process.env.ALLOWED_UPLOAD_MIME_TYPES).length > 0
    ? asCsvList(process.env.ALLOWED_UPLOAD_MIME_TYPES)
    : [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/png',
        'image/jpeg'
      ],
  supabaseUrl: required('SUPABASE_URL'),
  supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  algoliaAppId: process.env.ALGOLIA_APP_ID,
  algoliaSearchKey: process.env.ALGOLIA_SEARCH_KEY,
  algoliaAdminKey: process.env.ALGOLIA_ADMIN_KEY,
  algoliaSearchHost: process.env.ALGOLIA_SEARCH_HOST,
  algoliaAdminHost: process.env.ALGOLIA_ADMIN_HOST,
  algoliaIndexName: process.env.ALGOLIA_INDEX_NAME
} as const;
