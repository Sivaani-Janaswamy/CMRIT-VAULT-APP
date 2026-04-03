import type { RoleCode } from '../users/users.types';
import type { ResourceType } from '../resources/resources.types';

export type DownloadSource = 'mobile' | 'web' | 'admin';

export interface DownloadRecord {
  id: string;
  resourceId: string;
  userId: string;
  resourceTitle: string;
  source: DownloadSource;
  ipHash: string | null;
  userAgent: string | null;
  downloadedAt: string;
}

export interface DownloadListItem extends DownloadRecord {
  resourceType: ResourceType;
  subjectId: string;
}

export interface DownloadPage {
  items: DownloadListItem[];
  page: number;
  pageSize: number;
  total: number;
}

export interface DownloadUrlResult {
  downloadUrl: string;
  expiresAt: string;
}

export interface CreateDownloadUrlInput {
  source: DownloadSource;
  ipHash?: string | null;
  userAgent?: string | null;
}

export interface MyDownloadsQuery {
  page: number;
  pageSize: number;
  startDate?: string;
  endDate?: string;
  resourceType?: ResourceType;
  subjectId?: string;
}

export interface AdminDownloadsQuery {
  page: number;
  pageSize: number;
  userId?: string;
  resourceId?: string;
  startDate?: string;
  endDate?: string;
}

export interface DownloadAccessContext {
  id: string;
  role: RoleCode;
  isActive: boolean;
}

