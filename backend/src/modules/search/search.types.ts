import type { ResourceStatus, ResourceType } from '../resources/resources.types';
import type { RoleCode } from '../users/users.types';

export interface SearchFilters {
  resourceType?: ResourceType;
  subjectId?: string;
  department?: string;
  semester?: number;
  academicYear?: string;
}

export interface SearchPage {
  items: SearchResourceItem[];
  page: number;
  pageSize: number;
  total: number;
}

export interface SearchResourceRow {
  id: string;
  subject_id: string;
  uploaded_by: string;
  title: string;
  description: string | null;
  resource_type: string;
  academic_year: string;
  semester: number;
  file_name: string;
  status: string;
  download_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SearchSubjectRow {
  id: string;
  code: string;
  name: string;
  department: string;
  semester: number;
}

export interface SearchIndexRecord {
  objectID: string;
  resourceId: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  department: string;
  semester: number;
  resourceType: ResourceType;
  title: string;
  description: string | null;
  academicYear: string;
  fileName: string;
  status: ResourceStatus;
  downloadCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  searchableText: string;
}

export interface SearchResourceItem {
  resourceId: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  department: string;
  semester: number;
  resourceType: ResourceType;
  title: string;
  description: string | null;
  academicYear: string;
  fileName: string;
  status: ResourceStatus;
  downloadCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
}

export interface SearchSuggestItem {
  resourceId: string;
  title: string;
  subjectName: string;
  resourceType: ResourceType;
  academicYear: string;
  status: ResourceStatus;
  ownerId: string;
}

export interface SearchQueryInput {
  q: string;
  page: number;
  pageSize: number;
  filters: SearchFilters;
}

export interface SearchSuggestQueryInput {
  q: string;
  limit: number;
}

export interface SearchReindexResult {
  jobId: string;
  status: 'completed';
}

export interface SearchAccessContext {
  id: string;
  role: RoleCode;
  isActive: boolean;
}
