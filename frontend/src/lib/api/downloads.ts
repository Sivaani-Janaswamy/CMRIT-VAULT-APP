import { apiRequest } from "@/src/lib/api/http-client";

export interface DownloadHistoryItem {
  id: string;
  resourceId: string;
  userId: string;
  resourceTitle: string;
  source: "mobile" | "web" | "admin";
  ipHash: string | null;
  userAgent: string | null;
  downloadedAt: string;
  resourceType: "note" | "question_paper" | "faculty_upload";
  subjectId: string;
}

interface DownloadsResponse {
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

interface FetchMyDownloadsInput {
  page?: number;
  pageSize?: number;
  resourceType?: "note" | "question_paper" | "faculty_upload";
  subjectId?: string;
  startDate?: string;
  endDate?: string;
}

export async function fetchMyDownloads(
  accessToken: string,
  input: FetchMyDownloadsInput = {},
): Promise<{ items: DownloadHistoryItem[]; total: number; page: number; pageSize: number }> {
  const search = new URLSearchParams({
    page: String(input.page ?? 1),
    pageSize: String(input.pageSize ?? 30),
  });

  if (input.resourceType) {
    search.set("resourceType", input.resourceType);
  }
  if (input.subjectId) {
    search.set("subjectId", input.subjectId);
  }
  if (input.startDate) {
    search.set("startDate", input.startDate);
  }
  if (input.endDate) {
    search.set("endDate", input.endDate);
  }

  const response = await apiRequest<DownloadsResponse>(`/v1/downloads/me?${search.toString()}`, {
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
