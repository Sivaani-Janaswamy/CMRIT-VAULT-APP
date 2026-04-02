import { createClient } from '@supabase/supabase-js';

import { env } from '../../config/env';

export const supabaseServiceClient = createClient(
  env.supabaseUrl,
  env.supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);
