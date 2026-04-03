import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  supabaseUrl: required('SUPABASE_URL'),
  supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  algoliaAppId: process.env.ALGOLIA_APP_ID,
  algoliaSearchKey: process.env.ALGOLIA_SEARCH_KEY,
  algoliaAdminKey: process.env.ALGOLIA_ADMIN_KEY,
  algoliaSearchHost: process.env.ALGOLIA_SEARCH_HOST,
  algoliaAdminHost: process.env.ALGOLIA_ADMIN_HOST,
  algoliaIndexName: process.env.ALGOLIA_INDEX_NAME
} as const;
