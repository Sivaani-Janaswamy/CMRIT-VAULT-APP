import { webEnv } from "@/src/lib/config/env";

export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
    this.name = "ApiError";
  }
}

export interface ApiRequestOptions extends RequestInit {
  accessToken?: string;
}

export async function apiRequest<T>(
  path: string,
  { accessToken, headers, ...rest }: ApiRequestOptions = {},
): Promise<T> {
  const response = await fetch(`${webEnv.apiBaseUrl}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    cache: "no-store",
  });

  const payload = await response
    .json()
    .catch(() => ({ success: false, message: "Invalid JSON response" }));

  if (!response.ok || payload?.success === false) {
    throw new ApiError(
      payload?.message ?? `Request failed with status ${response.status}`,
      response.status,
      payload,
    );
  }

  return payload as T;
}
