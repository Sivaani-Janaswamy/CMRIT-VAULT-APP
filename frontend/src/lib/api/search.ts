import { apiRequest } from "@/src/lib/api/http-client";

export interface SearchResultItem {
  resourceId: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  department: string;
  semester: number;
  resourceType: "note" | "question_paper" | "faculty_upload";
  title: string;
  description: string | null;
  academicYear: string;
  fileName: string;
  status: string;
  downloadCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
}

export interface SearchSuggestionItem {
  resourceId: string;
  title: string;
  subjectName: string;
  resourceType: "note" | "question_paper" | "faculty_upload";
  academicYear: string;
}

interface SearchResourcesResponse {
  success: boolean;
  message: string;
  data: {
    items: SearchResultItem[];
    pageInfo: {
      page: number;
      pageSize: number;
      total: number;
    };
  };
  error: unknown;
}

interface SearchSuggestResponse {
  success: boolean;
  message: string;
  data: {
    items: SearchSuggestionItem[];
  };
  error: unknown;
}

export interface SearchFiltersInput {
  resourceType?: "note" | "question_paper" | "faculty_upload";
  subjectId?: string;
  semester?: number;
  department?: string;
  academicYear?: string;
}

export async function searchResources(
  query: string,
  accessToken: string,
  filters: SearchFiltersInput = {},
  page = 1,
  pageSize = 20,
): Promise<{ items: SearchResultItem[]; total: number; page: number; pageSize: number }> {
  const params = new URLSearchParams({ q: query, page: String(page), pageSize: String(pageSize) });

  if (filters.resourceType) {
    params.set("resourceType", filters.resourceType);
  }
  if (filters.subjectId) {
    params.set("subjectId", filters.subjectId);
  }
  if (typeof filters.semester === "number") {
    params.set("semester", String(filters.semester));
  }
  if (filters.department) {
    params.set("department", filters.department);
  }
  if (filters.academicYear) {
    params.set("academicYear", filters.academicYear);
  }

  const response = await apiRequest<SearchResourcesResponse>(`/v1/search/resources?${params.toString()}`, {
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

export async function suggestResources(query: string, accessToken: string): Promise<SearchSuggestionItem[]> {
  const params = new URLSearchParams({ q: query, limit: "5" });
  const response = await apiRequest<SearchSuggestResponse>(`/v1/search/suggest?${params.toString()}`, {
    method: "GET",
    accessToken,
  });

  return response.data.items;
}
