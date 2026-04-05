"use client";

import { apiRequest } from "@/src/lib/api/http-client";
import { getSupabaseBrowserClient } from "@/src/lib/auth/supabase-browser";
import type { AppRole } from "@/src/lib/auth/session";

const ACCESS_TOKEN_COOKIE = "cmrit_access_token";
const ROLE_COOKIE = "cmrit_role";
const USER_ID_COOKIE = "cmrit_user_id";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

interface CurrentUserResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      role: AppRole;
      email: string;
    };
  };
  error: unknown;
}

export interface AuthResult {
  role?: AppRole;
  message?: string;
}

function setCookie(name: string, value: string, maxAgeSeconds = COOKIE_MAX_AGE_SECONDS) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
}

export function clearAuthCookies() {
  clearCookie(ACCESS_TOKEN_COOKIE);
  clearCookie(ROLE_COOKIE);
  clearCookie(USER_ID_COOKIE);
}

async function syncAuthAndPersist(token: string): Promise<AuthResult> {
  await apiRequest<{ success: boolean }>("/v1/auth/sync", {
    method: "POST",
    body: JSON.stringify({}),
    accessToken: token,
  });

  const me = await apiRequest<CurrentUserResponse>("/v1/users/me", {
    method: "GET",
    accessToken: token,
  });

  const user = me.data.user;

  setCookie(ACCESS_TOKEN_COOKIE, token);
  setCookie(ROLE_COOKIE, user.role);
  setCookie(USER_ID_COOKIE, user.id);

  return { role: user.role };
}

export async function signInWithPassword(email: string, password: string): Promise<AuthResult> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw new Error(
      error.message.toLowerCase().includes("confirm")
        ? "Please confirm your email before signing in."
        : error.message,
    );
  }

  const token = data.session?.access_token;
  if (!token) {
    throw new Error("No active session returned. Please try again.");
  }

  return syncAuthAndPersist(token);
}

export async function signUpWithPassword(fullName: string, email: string, password: string): Promise<AuthResult> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: "student",
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  const token = data.session?.access_token;
  if (!token) {
    clearAuthCookies();
    return { message: "Account created. Please confirm your email, then sign in." };
  }

  return syncAuthAndPersist(token);
}

export async function bootstrapAuthFromSupabase(): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    clearAuthCookies();
    return;
  }

  const token = data.session?.access_token;
  if (!token) {
    clearAuthCookies();
    return;
  }

  try {
    await syncAuthAndPersist(token);
  } catch {
    clearAuthCookies();
  }
}

export async function signOutWeb(): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  await supabase.auth.signOut();
  clearAuthCookies();
}
