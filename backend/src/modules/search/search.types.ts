import type { ResourceStatus, ResourceType } from '../../common/types/search-contracts';
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
