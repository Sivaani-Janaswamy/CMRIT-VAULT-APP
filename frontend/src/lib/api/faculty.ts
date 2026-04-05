import { apiRequest } from "@/src/lib/api/http-client";
import type { ResourceItem, ResourceType } from "@/src/lib/api/resources";

export type FacultyPeriod = "7d" | "30d" | "90d" | "all";

export interface FacultyDashboardSummary {
  period: FacultyPeriod;
  startDate: string | null;
  endDate: string | null;
  resources: {
    total: number;
    draft: number;
    pendingReview: number;
    published: number;
    rejected: number;
    archived: number;
  };
  downloads: {
    total: number;
    inPeriod: number;
    bySource: {
      mobile: number;
      web: number;
      admin: number;
    };
  };
}

interface FacultyDashboardResponse {
  success: boolean;
  message: string;
  data: {
    summary: FacultyDashboardSummary;
  };
  error: unknown;
}

interface FacultyResourcesResponse {
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

interface FacultyResourceStatsResponse {
  success: boolean;
  message: string;
  data: {
    stats: {
      resource: ResourceItem;
      downloads: {
        total: number;
        bySource: {
          mobile: number;
          web: number;
          admin: number;
        };
        firstDownloadedAt: string | null;
        lastDownloadedAt: string | null;
      };
    };
  };
  error: unknown;
}

export interface FacultyResourcesFilters {
  page?: number;
  pageSize?: number;
  subjectId?: string;
  department?: string;
  semester?: number;
  resourceType?: ResourceType;
  academicYear?: string;
  status?: "draft" | "pending_review" | "published" | "rejected" | "archived";
}

export async function fetchFacultyDashboardSummary(
  accessToken: string,
  period: FacultyPeriod,
): Promise<FacultyDashboardSummary> {
  const params = new URLSearchParams({ period });
  const response = await apiRequest<FacultyDashboardResponse>(
    `/v1/faculty/dashboard/summary?${params.toString()}`,
    {
      method: "GET",
      accessToken,
    },
  );

  return response.data.summary;
}

export async function fetchFacultyResources(
  accessToken: string,
  filters: FacultyResourcesFilters = {},
): Promise<{ items: ResourceItem[]; total: number; page: number; pageSize: number }> {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    pageSize: String(filters.pageSize ?? 20),
  });

  if (filters.subjectId) {
    params.set("subjectId", filters.subjectId);
  }
  if (filters.department) {
    params.set("department", filters.department);
  }
  if (typeof filters.semester === "number") {
    params.set("semester", String(filters.semester));
  }
  if (filters.resourceType) {
    params.set("resourceType", filters.resourceType);
  }
  if (filters.academicYear) {
    params.set("academicYear", filters.academicYear);
  }
  if (filters.status) {
    params.set("status", filters.status);
  }

  const response = await apiRequest<FacultyResourcesResponse>(`/v1/faculty/resources?${params.toString()}`, {
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

export async function fetchFacultyResourceStats(
  accessToken: string,
  resourceId: string,
): Promise<{
  resource: ResourceItem;
  downloads: {
    total: number;
    bySource: {
      mobile: number;
      web: number;
      admin: number;
    };
    firstDownloadedAt: string | null;
    lastDownloadedAt: string | null;
  };
}> {
  const response = await apiRequest<FacultyResourceStatsResponse>(`/v1/faculty/resources/${resourceId}/stats`, {
    method: "GET",
    accessToken,
  });

  return response.data.stats;
}
