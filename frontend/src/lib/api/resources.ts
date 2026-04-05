import { apiRequest } from "@/src/lib/api/http-client";

export type ResourceType = "note" | "question_paper" | "faculty_upload";

export interface ResourceItem {
  id: string;
  subjectId: string;
  uploadedBy: string;
  title: string;
  description: string | null;
  resourceType: ResourceType;
  academicYear: string;
  semester: number;
  fileName: string;
  filePath: string;
  fileSizeBytes: number;
  mimeType: string;
  downloadCount: number;
  status: string;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt: string;
}

interface GetResourceResponse {
  success: boolean;
  message: string;
  data: {
    resource: ResourceItem;
  };
  error: unknown;
}

interface CreateDownloadUrlResponse {
  success: boolean;
  message: string;
  data: {
    downloadUrl: string;
    expiresAt: string;
  };
  error: unknown;
}

interface ListResourcesResponse {
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

interface ListResourcesInput {
  subjectId: string;
  page?: number;
  pageSize?: number;
}

export async function fetchResourcesForSubject(
  input: ListResourcesInput,
  accessToken: string,
): Promise<ResourceItem[]> {
  const search = new URLSearchParams({
    subjectId: input.subjectId,
    page: String(input.page ?? 1),
    pageSize: String(input.pageSize ?? 100),
  });

  const response = await apiRequest<ListResourcesResponse>(`/v1/resources?${search.toString()}`, {
    method: "GET",
    accessToken,
  });

  return response.data.items;
}

export async function fetchResourceById(id: string, accessToken: string): Promise<ResourceItem> {
  const response = await apiRequest<GetResourceResponse>(`/v1/resources/${id}`, {
    method: "GET",
    accessToken,
  });

  return response.data.resource;
}

export async function createDownloadUrl(
  resourceId: string,
  accessToken: string,
): Promise<{ downloadUrl: string; expiresAt: string }> {
  const response = await apiRequest<CreateDownloadUrlResponse>(`/v1/resources/${resourceId}/download-url`, {
    method: "POST",
    accessToken,
    body: JSON.stringify({ source: "web" }),
  });

  return response.data;
}
