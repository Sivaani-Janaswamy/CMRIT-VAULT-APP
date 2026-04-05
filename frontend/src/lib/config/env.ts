const fallbackApiBaseUrl = "http://127.0.0.1:4000";
const fallbackSupabaseUrl = "https://dxaugxhkojuwhzugjuxy.supabase.co";
const fallbackSupabaseAnonKey = "sb_publishable_SociCfP0fO6PUAxVr_2Zsg_tctBTbnF";

export const webEnv = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? fallbackApiBaseUrl,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? fallbackSupabaseUrl,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? fallbackSupabaseAnonKey,
};
