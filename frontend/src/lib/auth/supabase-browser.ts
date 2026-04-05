"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { webEnv } from "@/src/lib/config/env";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createClient(webEnv.supabaseUrl, webEnv.supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }

  return browserClient;
}
