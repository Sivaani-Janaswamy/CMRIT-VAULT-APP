import { supabaseServiceClient } from '../../integrations/supabase/client';
import type { DownloadSource } from '../downloads/downloads.types';
import type { Resource, ResourceStatus, ResourceType } from '../resources/resources.types';
import type {
  FacultyDashboardSummary,
  FacultyPeriod,
  FacultyResourceDownloadMetrics,
  FacultyResourcePage,
  FacultyResourcesQuery,
  FacultyScope
} from './faculty.types';

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
  downloaded_at: string;
};

type DownloadCountFilter = {
  source?: DownloadSource;
  startDate?: string | null;
  endDate?: string | null;
};

class FacultyRepository {
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

  private applyScope<T>(query: T, scope: FacultyScope): T {
    if (scope.role === 'faculty') {
      return (query as { eq: (column: string, value: string) => T }).eq('uploaded_by', scope.userId);
    }

    return query;
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

    return (data ?? []).map((row) => (row as { id: string }).id);
  }

  private buildPeriodRange(period: FacultyPeriod): { startDate: string | null; endDate: string | null } {
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

  private async listScopedResourceIds(scope: FacultyScope): Promise<string[]> {
    let query = supabaseServiceClient.from('resources').select('id');
    query = this.applyScope(query, scope);

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => (row as { id: string }).id);
  }

  private async countResources(scope: FacultyScope, status?: ResourceStatus): Promise<number> {
    let query = supabaseServiceClient.from('resources').select('id', { count: 'exact', head: true });
    query = this.applyScope(query, scope);
    if (status) {
      query = query.eq('status', status);
    }

    const { error, count } = await query;
    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  private async countDownloads(resourceIds: string[], filter: DownloadCountFilter = {}): Promise<number> {
    if (resourceIds.length === 0) {
      return 0;
    }

    let query = supabaseServiceClient
      .from('downloads')
      .select('id', { count: 'exact', head: true })
      .in('resource_id', resourceIds);

    if (filter.source) {
      query = query.eq('source', filter.source);
    }

    if (filter.startDate) {
      query = query.gte('downloaded_at', filter.startDate);
    }

    if (filter.endDate) {
      query = query.lte('downloaded_at', filter.endDate);
    }

    const { error, count } = await query;
    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  private async getDownloadBoundary(resourceId: string, direction: 'ascending' | 'descending'): Promise<string | null> {
    const { data, error } = await supabaseServiceClient
      .from('downloads')
      .select('downloaded_at')
      .eq('resource_id', resourceId)
      .order('downloaded_at', { ascending: direction === 'ascending' })
      .order('id', { ascending: direction === 'ascending' })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as DownloadRow | null)?.downloaded_at ?? null;
  }

  private async getResourceDownloadMetrics(resourceId: string): Promise<FacultyResourceDownloadMetrics> {
    const [total, mobile, web, admin, firstDownloadedAt, lastDownloadedAt] = await Promise.all([
      this.countDownloads([resourceId]),
      this.countDownloads([resourceId], { source: 'mobile' }),
      this.countDownloads([resourceId], { source: 'web' }),
      this.countDownloads([resourceId], { source: 'admin' }),
      this.getDownloadBoundary(resourceId, 'ascending'),
      this.getDownloadBoundary(resourceId, 'descending')
    ]);

    return {
      total,
      bySource: {
        mobile,
        web,
        admin
      },
      firstDownloadedAt,
      lastDownloadedAt
    };
  }

  async findResourceById(id: string): Promise<Resource | null> {
    const { data, error } = await supabaseServiceClient
      .from('resources')
      .select(this.resourceSelect)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const row = data as ResourceRow | null;
    return row ? this.mapResourceRow(row) : null;
  }

  async listResources(scope: FacultyScope, filters: FacultyResourcesQuery): Promise<FacultyResourcePage> {
    const { page, pageSize, subjectId, department, semester, resourceType, academicYear, status } = filters;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const subjectIdsByDepartment = await this.resolveSubjectIdsByDepartment(department);
    if (department && subjectIdsByDepartment?.length === 0) {
      return { items: [], page, pageSize, total: 0 };
    }

    let query = supabaseServiceClient
      .from('resources')
      .select(this.resourceSelect, { count: 'exact' })
      .order('created_at', { ascending: false })
      .order('id', { ascending: false });

    query = this.applyScope(query, scope);

    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }

    if (subjectIdsByDepartment) {
      query = query.in('subject_id', subjectIdsByDepartment);
    }

    if (semester !== undefined) {
      query = query.eq('semester', semester);
    }

    if (resourceType) {
      query = query.eq('resource_type', resourceType);
    }

    if (academicYear) {
      query = query.eq('academic_year', academicYear);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query.range(from, to);
    if (error) {
      throw error;
    }

    return {
      items: (data ?? []).map((row) => this.mapResourceRow(row as ResourceRow)),
      page,
      pageSize,
      total: count ?? 0
    };
  }

  async getDashboardSummary(scope: FacultyScope, period: FacultyPeriod): Promise<FacultyDashboardSummary> {
    const range = this.buildPeriodRange(period);
    const [total, draft, pendingReview, published, rejected, archived, resourceIds] = await Promise.all([
      this.countResources(scope),
      this.countResources(scope, 'draft'),
      this.countResources(scope, 'pending_review'),
      this.countResources(scope, 'published'),
      this.countResources(scope, 'rejected'),
      this.countResources(scope, 'archived'),
      this.listScopedResourceIds(scope)
    ]);

    const [downloadsTotal, downloadsInPeriod, mobile, web, admin] = await Promise.all([
      this.countDownloads(resourceIds),
      this.countDownloads(resourceIds, range),
      this.countDownloads(resourceIds, { ...range, source: 'mobile' }),
      this.countDownloads(resourceIds, { ...range, source: 'web' }),
      this.countDownloads(resourceIds, { ...range, source: 'admin' })
    ]);

    return {
      period,
      startDate: range.startDate,
      endDate: range.endDate,
      resources: {
        total,
        draft,
        pendingReview,
        published,
        rejected,
        archived
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

  async getResourceDownloadMetricsById(resourceId: string): Promise<FacultyResourceDownloadMetrics> {
    return this.getResourceDownloadMetrics(resourceId);
  }
}

export const facultyRepository = new FacultyRepository();
