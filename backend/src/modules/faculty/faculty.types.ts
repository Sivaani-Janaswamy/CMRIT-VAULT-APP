import type { Resource, ResourcePage, ResourceStatus, ResourceType } from '../resources/resources.types';

export type FacultyPeriod = '7d' | '30d' | '90d' | 'all';

export interface FacultyScope {
  role: 'faculty' | 'admin';
  userId: string;
}

export interface FacultyDashboardQuery {
  period: FacultyPeriod;
}

export interface FacultyResourcesQuery {
  page: number;
  pageSize: number;
  subjectId?: string;
  department?: string;
  semester?: number;
  resourceType?: ResourceType;
  academicYear?: string;
  status?: ResourceStatus;
}

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

export interface FacultyResourceDownloadMetrics {
  total: number;
  bySource: {
    mobile: number;
    web: number;
    admin: number;
  };
  firstDownloadedAt: string | null;
  lastDownloadedAt: string | null;
}

export interface FacultyResourceStats {
  resource: Resource;
  downloads: FacultyResourceDownloadMetrics;
}

export interface FacultyResourcePage extends ResourcePage {}
