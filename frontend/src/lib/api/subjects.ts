import { apiRequest } from "@/src/lib/api/http-client";

export interface SubjectListItem {
  id: string;
  name: string;
  code: string;
}

export interface SubjectDetail {
  id: string;
  code: string;
  name: string;
  department: string;
  semester: number;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ListSubjectsResponse {
  success: boolean;
  message: string;
  data: {
    items: SubjectListItem[];
    pageInfo: {
      page: number;
      pageSize: number;
      total: number;
    };
  };
  error: unknown;
}

interface GetSubjectResponse {
  success: boolean;
  message: string;
  data: {
    subject: SubjectDetail;
  };
  error: unknown;
}

export async function fetchSubjects(accessToken: string): Promise<SubjectListItem[]> {
  const response = await apiRequest<ListSubjectsResponse>("/v1/subjects", {
    method: "GET",
    accessToken,
  });

  return response.data.items;
}

export async function fetchSubjectById(id: string, accessToken: string): Promise<SubjectDetail> {
  const response = await apiRequest<GetSubjectResponse>(`/v1/subjects/${id}`, {
    method: "GET",
    accessToken,
  });

  return response.data.subject;
}
