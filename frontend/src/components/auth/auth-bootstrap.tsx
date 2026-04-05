"use client";

import { useEffect } from "react";

import { getSupabaseBrowserClient } from "@/src/lib/auth/supabase-browser";
import { bootstrapAuthFromSupabase, clearAuthCookies } from "@/src/lib/auth/web-auth-client";

export function AuthBootstrap() {
  useEffect(() => {
    let mounted = true;

    const start = async () => {
      if (!mounted) {
        return;
      }
      await bootstrapAuthFromSupabase();
    };

    void start();

    const supabase = getSupabaseBrowserClient();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) {
        return;
      }

      if (!session) {
        clearAuthCookies();
        return;
      }

      void bootstrapAuthFromSupabase();
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return null;
}
