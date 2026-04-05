import { apiRequest } from "@/src/lib/api/http-client";
import type { DownloadHistoryItem } from "@/src/lib/api/downloads";
import type { ResourceItem } from "@/src/lib/api/resources";

export type AdminPeriod = "7d" | "30d" | "90d" | "all";

export interface AdminDashboardSummary {
  period: AdminPeriod;
  startDate: string | null;
  endDate: string | null;
  users: {
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
  };
  subjects: {
    total: number;
    active: number;
  };
  resources: {
    total: number;
    byStatus: Record<string, number>;
  };
  downloads: {
    total: number;
    inPeriod: number;
    bySource: Record<string, number>;
  };
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: "student" | "faculty" | "admin";
  rollNo: string | null;
  department: string | null;
  semester: number | null;
  isActive: boolean;
}

interface AdminSummaryResponse {
  success: boolean;
  message: string;
  data: {
    summary: AdminDashboardSummary;
  };
  error: unknown;
}

interface AdminUsersResponse {
  success: boolean;
  message: string;
  data: {
    items: AdminUser[];
    pageInfo: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
  error: unknown;
}

interface AdminResourcesResponse {
  success: boolean;
  message: string;
  data: {
    items: ResourceItem[];
    pageInfo: {
      page: number;
      pageSize: number;
      total: number;
    };
  };
  error: unknown;
}

interface AdminDownloadsResponse {
  success: boolean;
  message: string;
  data: {
    items: DownloadHistoryItem[];
    pageInfo: {
      page: number;
      pageSize: number;
      total: number;
    };
  };
  error: unknown;
}

export async function fetchAdminDashboardSummary(
  accessToken: string,
  period: AdminPeriod,
): Promise<AdminDashboardSummary> {
  const params = new URLSearchParams({ period });
  const response = await apiRequest<AdminSummaryResponse>(`/v1/admin/dashboard/summary?${params.toString()}`, {
    method: "GET",
    accessToken,
  });

  return response.data.summary;
}

export async function fetchAdminUsers(
  accessToken: string,
  filters: { page?: number; pageSize?: number; role?: "student" | "faculty" | "admin" } = {},
): Promise<{ items: AdminUser[]; total: number; page: number; pageSize: number }> {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    pageSize: String(filters.pageSize ?? 20),
  });

  if (filters.role) {
    params.set("role", filters.role);
  }

  const response = await apiRequest<AdminUsersResponse>(`/v1/admin/users?${params.toString()}`, {
    method: "GET",
    accessToken,
  });

  return {
    items: response.data.items,
    total: response.data.pageInfo.total,
    page: response.data.pageInfo.page,
    pageSize: response.data.pageInfo.pageSize,
  };
}

export async function fetchAdminResourcesOverview(
  accessToken: string,
  filters: { page?: number; pageSize?: number; status?: string } = {},
): Promise<{ items: ResourceItem[]; total: number; page: number; pageSize: number }> {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    pageSize: String(filters.pageSize ?? 20),
  });

  if (filters.status) {
    params.set("status", filters.status);
  }

  const response = await apiRequest<AdminResourcesResponse>(`/v1/admin/resources/overview?${params.toString()}`, {
    method: "GET",
    accessToken,
  });

  return {
    items: response.data.items,
    total: response.data.pageInfo.total,
    page: response.data.pageInfo.page,
    pageSize: response.data.pageInfo.pageSize,
  };
}

export async function fetchAdminDownloadsOverview(
  accessToken: string,
  filters: { page?: number; pageSize?: number; source?: "mobile" | "web" | "admin" } = {},
): Promise<{ items: DownloadHistoryItem[]; total: number; page: number; pageSize: number }> {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    pageSize: String(filters.pageSize ?? 20),
  });

  if (filters.source) {
    params.set("source", filters.source);
  }

  const response = await apiRequest<AdminDownloadsResponse>(`/v1/admin/downloads/overview?${params.toString()}`, {
    method: "GET",
    accessToken,
  });

  return {
    items: response.data.items,
    total: response.data.pageInfo.total,
    page: response.data.pageInfo.page,
    pageSize: response.data.pageInfo.pageSize,
  };
}
