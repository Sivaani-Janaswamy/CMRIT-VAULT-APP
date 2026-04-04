const fallbackApiBaseUrl = "http://127.0.0.1:4000";

export const webEnv = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? fallbackApiBaseUrl,
};
