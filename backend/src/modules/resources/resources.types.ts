import type { RoleCode } from '../users/users.types';

export type ResourceType = 'note' | 'question_paper' | 'faculty_upload';
export type ResourceStatus = 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived';

export interface Resource {
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
  status: ResourceStatus;
  downloadCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResourcePage {
  items: Resource[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ResourceListQuery {
  page: number;
  pageSize: number;
  subjectId?: string;
  semester?: number;
  department?: string;
  resourceType?: ResourceType;
  academicYear?: string;
  status?: ResourceStatus;
}

export interface CreateResourceInput {
  subjectId: string;
  title: string;
  description?: string | null;
  resourceType: ResourceType;
  academicYear: string;
  semester: number;
  fileName: string;
  filePath?: string;
  fileSizeBytes: number;
  mimeType?: string;
  status?: never;
}

export interface UploadSession {
  resourceId: string;
  uploadPath: string;
  uploadToken: string;
  signedUploadUrl: string;
  expiresAt: string;
}

export interface UpdateResourceInput {
  subjectId?: string;
  title?: string;
  description?: string | null;
  resourceType?: ResourceType;
  academicYear?: string;
  semester?: number;
  fileName?: string;
  filePath?: string;
  fileSizeBytes?: number;
  mimeType?: string;
}

export interface UpdateResourceStatusInput {
  status: 'published' | 'rejected';
}

export interface ResourceAccessContext {
  id: string;
  role: RoleCode;
  isActive: boolean;
}
