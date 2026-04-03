import { logDebug } from '../../common/utils/logger';
import { supabaseServiceClient } from '../../integrations/supabase/client';
import type { DownloadSource } from '../downloads/downloads.types';
import type { Resource, ResourceStatus, ResourceType } from '../resources/resources.types';
import type { RoleCode } from '../users/users.types';
import type {
  AdminAuditLogInput,
  AdminDashboardQuery,
  AdminDashboardSummary,
  AdminDownloadPage,
  AdminDownloadsOverviewQuery,
  AdminResourcePage,
  AdminResourcesOverviewQuery,
  AdminPeriod
} from './admin.types';

type ResourceRow = {
  id: string;
  subject_id: string;
  uploaded_by: string;
  title: string;
  description: string | null;
  resource_type: string;
  academic_year: string;
  semester: number;
  file_name: string;
  file_path: string;
  file_size_bytes: number;
  mime_type: string;
  status: string;
  download_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type DownloadRow = {
  id: string;
  resource_id: string;
  user_id: string;
  resource_title: string;
  source: DownloadSource | string;
  ip_hash: string | null;
  user_agent: string | null;
  downloaded_at: string;
};

type SubjectRow = {
  id: string;
  department: string;
};

type RoleCache = {
  roleCodeToId: Map<RoleCode, number>;
};

class AdminRepository {
  private readonly roleCache: RoleCache = {
    roleCodeToId: new Map<RoleCode, number>()
  };

  private readonly resourceSelect =
    'id,subject_id,uploaded_by,title,description,resource_type,academic_year,semester,file_name,file_path,file_size_bytes,mime_type,status,download_count,published_at,created_at,updated_at';

  private isResourceStatus(value: string): value is ResourceStatus {
    return (
      value === 'draft' ||
      value === 'pending_review' ||
      value === 'published' ||
      value === 'rejected' ||
      value === 'archived'
    );
  }

  private isResourceType(value: string): value is ResourceType {
    return value === 'note' || value === 'question_paper' || value === 'faculty_upload';
  }

  private mapResourceRow(row: ResourceRow): Resource {
    return {
      id: row.id,
      subjectId: row.subject_id,
      uploadedBy: row.uploaded_by,
      title: row.title,
      description: row.description,
      resourceType: this.isResourceType(row.resource_type) ? row.resource_type : 'note',
      academicYear: row.academic_year,
      semester: row.semester,
      fileName: row.file_name,
      filePath: row.file_path,
      fileSizeBytes: row.file_size_bytes,
      mimeType: row.mime_type,
      status: this.isResourceStatus(row.status) ? row.status : 'draft',
      downloadCount: row.download_count,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private buildPeriodRange(period: AdminPeriod): { startDate: string | null; endDate: string | null } {
    if (period === 'all') {
      return { startDate: null, endDate: null };
    }

    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    };
  }

  private async resolveRoleId(role: RoleCode): Promise<number> {
    const cached = this.roleCache.roleCodeToId.get(role);
    if (cached !== undefined) {
      return cached;
    }

    const { data, error } = await supabaseServiceClient
      .from('roles')
      .select('id')
      .eq('code', role)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error(`Role not found: ${role}`);
    }

    this.roleCache.roleCodeToId.set(role, data.id);
    return data.id;
  }

  private async countUsersByRole(role: RoleCode): Promise<number> {
    const roleId = await this.resolveRoleId(role);
    const { error, count } = await supabaseServiceClient
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role_id', roleId);

    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  private async countExact(table: string, filter?: Record<string, string | boolean>): Promise<number> {
    let query = supabaseServiceClient.from(table).select('id', { count: 'exact', head: true });

    for (const [column, value] of Object.entries(filter ?? {})) {
      query = query.eq(column, value);
    }

    const { error, count } = await query;
    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  private async resolveSubjectIdsByDepartment(department?: string): Promise<string[] | null> {
    if (!department) {
      return null;
    }

    const { data, error } = await supabaseServiceClient
      .from('subjects')
      .select('id')
      .eq('department', department)
      .eq('is_active', true);

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => (row as SubjectRow).id);
  }

  private async loadResourceCountByStatus(status: ResourceStatus): Promise<number> {
    const { error, count } = await supabaseServiceClient
      .from('resources')
      .select('id', { count: 'exact', head: true })
      .eq('status', status);

    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  private async loadDownloadCount(filters: {
    resourceIds?: string[];
    userId?: string;
    resourceId?: string;
    source?: DownloadSource;
    startDate?: string | null;
    endDate?: string | null;
  }): Promise<number> {
    let query = supabaseServiceClient
      .from('downloads')
      .select('id', { count: 'exact', head: true });

    if (filters.resourceIds && filters.resourceIds.length > 0) {
      query = query.in('resource_id', filters.resourceIds);
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters.resourceId) {
      query = query.eq('resource_id', filters.resourceId);
    }

    if (filters.source) {
      query = query.eq('source', filters.source);
    }

    if (filters.startDate) {
      query = query.gte('downloaded_at', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('downloaded_at', filters.endDate);
    }

    const { error, count } = await query;
    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  private async loadDownloadBoundary(
    filters: AdminDownloadsOverviewQuery,
    direction: 'ascending' | 'descending'
  ): Promise<string | null> {
    let query = supabaseServiceClient
      .from('downloads')
      .select('downloaded_at')
      .order('downloaded_at', { ascending: direction === 'ascending' })
      .order('id', { ascending: direction === 'ascending' })
      .limit(1);

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters.resourceId) {
      query = query.eq('resource_id', filters.resourceId);
    }

    if (filters.source) {
      query = query.eq('source', filters.source);
    }

    if (filters.fromDate) {
      query = query.gte('downloaded_at', filters.fromDate);
    }

    if (filters.toDate) {
      query = query.lte('downloaded_at', filters.toDate);
    }

    const { data, error } = await query.maybeSingle();
    if (error) {
      throw error;
    }

    return (data as DownloadRow | null)?.downloaded_at ?? null;
  }

  private async resolveResourceDetails(resourceIds: string[]): Promise<Map<string, { resourceType: ResourceType; subjectId: string }>> {
    const map = new Map<string, { resourceType: ResourceType; subjectId: string }>();
    if (resourceIds.length === 0) {
      return map;
    }

    const { data, error } = await supabaseServiceClient
      .from('resources')
      .select('id,resource_type,subject_id')
      .in('id', resourceIds);

    if (error) {
      throw error;
    }

    for (const row of data ?? []) {
      const resource = row as ResourceRow;
      if (!this.isResourceType(resource.resource_type)) {
        continue;
      }

      map.set(resource.id, {
        resourceType: resource.resource_type,
        subjectId: resource.subject_id
      });
    }

    return map;
  }

  async logAction(input: AdminAuditLogInput): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    try {
      const { error } = await supabaseServiceClient.from('audit_logs').insert({
        actor_id: input.actorId,
        action: input.action,
        entity_type: input.entityType,
        entity_id: input.entityId,
        metadata: input.metadata ?? null,
        created_at: new Date().toISOString()
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      logDebug('adminRepository.logAction no-op', {
        error: error instanceof Error ? error.message : String(error),
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId
      });
    }
  }

  async getDashboardSummary(query: AdminDashboardQuery): Promise<AdminDashboardSummary> {
    const range = this.buildPeriodRange(query.period);
    const [usersTotal, usersActive, studentCount, facultyCount, adminCount, subjectsTotal, subjectsActive, resourcesTotal, downloadsTotal] =
      await Promise.all([
        this.countExact('users'),
        this.countExact('users', { is_active: true }),
        this.countUsersByRole('student'),
        this.countUsersByRole('faculty'),
        this.countUsersByRole('admin'),
        this.countExact('subjects'),
        this.countExact('subjects', { is_active: true }),
        this.countExact('resources'),
        this.loadDownloadCount({})
      ]);

    const byStatus = await Promise.all([
      this.loadResourceCountByStatus('draft'),
      this.loadResourceCountByStatus('pending_review'),
      this.loadResourceCountByStatus('published'),
      this.loadResourceCountByStatus('rejected'),
      this.loadResourceCountByStatus('archived')
    ]);

    const [downloadsInPeriod, mobile, web, admin] = await Promise.all([
      this.loadDownloadCount({ startDate: range.startDate, endDate: range.endDate }),
      this.loadDownloadCount({ startDate: range.startDate, endDate: range.endDate, source: 'mobile' }),
      this.loadDownloadCount({ startDate: range.startDate, endDate: range.endDate, source: 'web' }),
      this.loadDownloadCount({ startDate: range.startDate, endDate: range.endDate, source: 'admin' })
    ]);

    return {
      period: query.period,
      startDate: range.startDate,
      endDate: range.endDate,
      users: {
        total: usersTotal,
        active: usersActive,
        inactive: usersTotal - usersActive,
        byRole: {
          student: studentCount,
          faculty: facultyCount,
          admin: adminCount
        }
      },
      subjects: {
        total: subjectsTotal,
        active: subjectsActive
      },
      resources: {
        total: resourcesTotal,
        byStatus: {
          draft: byStatus[0],
          pending_review: byStatus[1],
          published: byStatus[2],
          rejected: byStatus[3],
          archived: byStatus[4]
        }
      },
      downloads: {
        total: downloadsTotal,
        inPeriod: downloadsInPeriod,
        bySource: {
          mobile,
          web,
          admin
        }
      }
    };
  }

  async listResourcesOverview(filters: AdminResourcesOverviewQuery): Promise<AdminResourcePage> {
    const from = (filters.page - 1) * filters.pageSize;
    const to = from + filters.pageSize - 1;
    const subjectIdsByDepartment = await this.resolveSubjectIdsByDepartment(filters.department);

    if (filters.department && subjectIdsByDepartment?.length === 0) {
      return { items: [], page: filters.page, pageSize: filters.pageSize, total: 0 };
    }

    let query = supabaseServiceClient
      .from('resources')
      .select(this.resourceSelect, { count: 'exact' })
      .order('created_at', { ascending: false })
      .order('id', { ascending: false });

    if (filters.subjectId) {
      query = query.eq('subject_id', filters.subjectId);
    }

    if (subjectIdsByDepartment) {
      query = query.in('subject_id', subjectIdsByDepartment);
    }

    if (filters.semester !== undefined) {
      query = query.eq('semester', filters.semester);
    }

    if (filters.resourceType) {
      query = query.eq('resource_type', filters.resourceType);
    }

    if (filters.academicYear) {
      query = query.eq('academic_year', filters.academicYear);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.uploadedBy) {
      query = query.eq('uploaded_by', filters.uploadedBy);
    }

    const { data, error, count } = await query.range(from, to);
    if (error) {
      throw error;
    }

    return {
      items: (data ?? []).map((row) => this.mapResourceRow(row as ResourceRow)),
      page: filters.page,
      pageSize: filters.pageSize,
      total: count ?? 0
    };
  }

  async listDownloadsOverview(filters: AdminDownloadsOverviewQuery): Promise<AdminDownloadPage> {
    const from = (filters.page - 1) * filters.pageSize;
    const to = from + filters.pageSize - 1;

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

    if (filters.source) {
      query = query.eq('source', filters.source);
    }

    if (filters.fromDate) {
      query = query.gte('downloaded_at', filters.fromDate);
    }

    if (filters.toDate) {
      query = query.lte('downloaded_at', filters.toDate);
    }

    const { data, error, count } = await query.range(from, to);
    if (error) {
      throw error;
    }

    const rows = (data ?? []) as DownloadRow[];
    const resourceDetails = await this.resolveResourceDetails(rows.map((row) => row.resource_id));

    const items = rows
      .map((row) => {
        const resource = resourceDetails.get(row.resource_id);
        if (!resource) {
          return null;
        }

        const source: DownloadSource =
          row.source === 'mobile' || row.source === 'web' || row.source === 'admin' ? row.source : 'mobile';

        return {
          id: row.id,
          resourceId: row.resource_id,
          userId: row.user_id,
          resourceTitle: row.resource_title,
          source,
          ipHash: row.ip_hash,
          userAgent: row.user_agent,
          downloadedAt: row.downloaded_at,
          resourceType: resource.resourceType,
          subjectId: resource.subjectId
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return {
      items,
      page: filters.page,
      pageSize: filters.pageSize,
      total: count ?? 0
    };
  }
}

export const adminRepository = new AdminRepository();
