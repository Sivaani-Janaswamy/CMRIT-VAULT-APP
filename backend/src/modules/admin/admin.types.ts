import type { DownloadListItem, DownloadPage } from '../downloads/downloads.types';
import type { Resource, ResourcePage, ResourceStatus, ResourceType } from '../resources/resources.types';
import type { RoleCode } from '../users/users.types';

export type AdminPeriod = '7d' | '30d' | '90d' | 'all';
export type DownloadSourceFilter = 'mobile' | 'web' | 'admin';

export interface AdminDashboardQuery {
  period: AdminPeriod;
}

export interface AdminResourcesOverviewQuery {
  page: number;
  pageSize: number;
  subjectId?: string;
  department?: string;
  semester?: number;
  resourceType?: ResourceType;
  academicYear?: string;
  status?: ResourceStatus;
  uploadedBy?: string;
}

export interface AdminDownloadsOverviewQuery {
  page: number;
  pageSize: number;
  userId?: string;
  resourceId?: string;
  source?: DownloadSourceFilter;
  fromDate?: string;
  toDate?: string;
}

export interface AdminDashboardSummary {
  period: AdminPeriod;
  startDate: string | null;
  endDate: string | null;
  users: {
    total: number;
    active: number;
    inactive: number;
    byRole: Record<RoleCode, number>;
  };
  subjects: {
    total: number;
    active: number;
  };
  resources: {
    total: number;
    byStatus: Record<ResourceStatus, number>;
  };
  downloads: {
    total: number;
    inPeriod: number;
    bySource: Record<DownloadSourceFilter, number>;
  };
}

export interface AdminAuditLogInput {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

export interface AdminResourcePage extends ResourcePage {}

export interface AdminDownloadPage extends DownloadPage {}

export interface AdminResourceListItem extends Resource {}

export interface AdminDownloadListItem extends DownloadListItem {}
