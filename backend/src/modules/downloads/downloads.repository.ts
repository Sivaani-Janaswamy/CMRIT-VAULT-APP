import { NotFoundError } from '../../common/errors/NotFoundError';
import { supabaseServiceClient } from '../../integrations/supabase/client';
import type { ResourceType } from '../resources/resources.types';
import type {
  AdminDownloadsQuery,
  CreateDownloadUrlInput,
  DownloadListItem,
  DownloadPage,
  DownloadRecord,
  MyDownloadsQuery
} from './downloads.types';

type DownloadRow = {
  id: string;
  resource_id: string;
  user_id: string;
  resource_title: string;
  source: 'mobile' | 'web' | 'admin' | string;
  ip_hash: string | null;
  user_agent: string | null;
  downloaded_at: string;
};

type ResourceRow = {
  id: string;
  resource_type: string;
  subject_id: string;
};

type ResourceFilter = {
  resourceType?: ResourceType;
  subjectId?: string;
};

type ResourceDetails = {
  resourceType: ResourceType;
  subjectId: string;
};

class DownloadsRepository {
  private isResourceType(value: string): value is ResourceType {
    return value === 'note' || value === 'question_paper' || value === 'faculty_upload';
  }

  private mapDownloadRow(row: DownloadRow, resource: ResourceDetails): DownloadListItem {
    return {
      id: row.id,
      resourceId: row.resource_id,
      userId: row.user_id,
      resourceTitle: row.resource_title,
      source: row.source === 'web' || row.source === 'admin' ? row.source : 'mobile',
      ipHash: row.ip_hash,
      userAgent: row.user_agent,
      downloadedAt: row.downloaded_at,
      resourceType: resource.resourceType,
      subjectId: resource.subjectId
    };
  }

  private async resolveResourceIds(filters: ResourceFilter): Promise<string[] | null> {
    const hasFilter = Boolean(filters.resourceType || filters.subjectId);
    if (!hasFilter) {
      return null;
    }

    let query = supabaseServiceClient.from('resources').select('id');

    if (filters.resourceType) {
      query = query.eq('resource_type', filters.resourceType);
    }

    if (filters.subjectId) {
      query = query.eq('subject_id', filters.subjectId);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => (row as { id: string }).id);
  }

  private async resolveResourceDetails(resourceIds: string[]): Promise<Map<string, ResourceDetails>> {
    if (resourceIds.length === 0) {
      return new Map<string, ResourceDetails>();
    }

    const { data, error } = await supabaseServiceClient
      .from('resources')
      .select('id,resource_type,subject_id')
      .in('id', resourceIds);

    if (error) {
      throw error;
    }

    const map = new Map<string, ResourceDetails>();
    for (const row of data ?? []) {
      const resourceRow = row as ResourceRow;
      if (!this.isResourceType(resourceRow.resource_type)) {
        throw new NotFoundError('Resource not found');
      }

      map.set(resourceRow.id, {
        resourceType: resourceRow.resource_type,
        subjectId: resourceRow.subject_id
      });
    }

    return map;
  }

  private applyDateRange(
    query: any,
    startDate?: string,
    endDate?: string
  ) {
    let nextQuery = query;

    if (startDate) {
      nextQuery = nextQuery.gte('downloaded_at', new Date(startDate).toISOString());
    }

    if (endDate) {
      nextQuery = nextQuery.lte('downloaded_at', new Date(endDate).toISOString());
    }

    return nextQuery;
  }

  private async loadPagedDownloads(
    baseQuery: any,
    page: number,
    pageSize: number
  ): Promise<{ rows: DownloadRow[]; total: number }> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await baseQuery.range(from, to);

    if (error) {
      throw error;
    }

    return {
      rows: (data ?? []) as DownloadRow[],
      total: count ?? 0
    };
  }

  async createDownloadRecord(
    input: CreateDownloadUrlInput & {
      resourceId: string;
      userId: string;
      resourceTitle: string;
    }
  ): Promise<DownloadRecord> {
    const { data, error } = await supabaseServiceClient
      .from('downloads')
      .insert({
        resource_id: input.resourceId,
        user_id: input.userId,
        resource_title: input.resourceTitle,
        source: input.source,
        ip_hash: input.ipHash ?? null,
        user_agent: input.userAgent ?? null
      })
      .select('id,resource_id,user_id,resource_title,source,ip_hash,user_agent,downloaded_at')
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new NotFoundError('Download record not found');
    }

    const row = data as DownloadRow;
    return {
      id: row.id,
      resourceId: row.resource_id,
      userId: row.user_id,
      resourceTitle: row.resource_title,
      source: row.source === 'web' || row.source === 'admin' ? row.source : 'mobile',
      ipHash: row.ip_hash,
      userAgent: row.user_agent,
      downloadedAt: row.downloaded_at
    };
  }

  async listOwnDownloads(userId: string, filters: MyDownloadsQuery): Promise<DownloadPage> {
    const resourceIds = await this.resolveResourceIds({
      resourceType: filters.resourceType,
      subjectId: filters.subjectId
    });

    if (resourceIds && resourceIds.length === 0) {
      return { items: [], page: filters.page, pageSize: filters.pageSize, total: 0 };
    }

    let query = supabaseServiceClient
      .from('downloads')
      .select('id,resource_id,user_id,resource_title,source,ip_hash,user_agent,downloaded_at', {
        count: 'exact'
      })
      .eq('user_id', userId)
      .order('downloaded_at', { ascending: false })
      .order('id', { ascending: false });

    query = this.applyDateRange(query, filters.startDate, filters.endDate);

    if (resourceIds) {
      query = query.in('resource_id', resourceIds);
    }

    const { rows, total } = await this.loadPagedDownloads(query, filters.page, filters.pageSize);
    const resourceDetails = await this.resolveResourceDetails(rows.map((row) => row.resource_id));

    const items = rows.map((row) => {
      const resource = resourceDetails.get(row.resource_id);
      if (!resource) {
        throw new NotFoundError('Resource not found');
      }

      return this.mapDownloadRow(row, resource);
    });

    return {
      items,
      page: filters.page,
      pageSize: filters.pageSize,
      total
    };
  }

  async listAdminDownloads(filters: AdminDownloadsQuery): Promise<DownloadPage> {
    let query = supabaseServiceClient
      .from('downloads')
      .select('id,resource_id,user_id,resource_title,source,ip_hash,user_agent,downloaded_at', {
        count: 'exact'
      })
      .order('downloaded_at', { ascending: false })
      .order('id', { ascending: false });

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters.resourceId) {
      query = query.eq('resource_id', filters.resourceId);
    }

    query = this.applyDateRange(query, filters.startDate, filters.endDate);

    const { rows, total } = await this.loadPagedDownloads(query, filters.page, filters.pageSize);
    const resourceDetails = await this.resolveResourceDetails(rows.map((row) => row.resource_id));

    const items = rows.map((row) => {
      const resource = resourceDetails.get(row.resource_id);
      if (!resource) {
        throw new NotFoundError('Resource not found');
      }

      return this.mapDownloadRow(row, resource);
    });

    return {
      items,
      page: filters.page,
      pageSize: filters.pageSize,
      total
    };
  }
}

export const downloadsRepository = new DownloadsRepository();

