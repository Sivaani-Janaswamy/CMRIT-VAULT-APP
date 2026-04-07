import { NotFoundError } from '../../common/errors/NotFoundError';
import { supabaseServiceClient } from '../../integrations/supabase/client';
import type {
  CreateResourceInput,
  Resource,
  ResourceListQuery,
  ResourcePage,
  ResourceStatus,
  UpdateResourceInput
} from './resources.types';

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

class ResourcesRepository {
  private isResourceStatus(value: string): value is ResourceStatus {
    return (
      value === 'draft' ||
      value === 'pending_review' ||
      value === 'published' ||
      value === 'rejected' ||
      value === 'archived'
    );
  }

  private isResourceType(value: string): value is Resource['resourceType'] {
    return value === 'note' || value === 'question_paper' || value === 'faculty_upload';
  }

  private mapRow(row: ResourceRow): Resource {
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

  private buildVisibilityClause(userRole: 'student' | 'faculty' | 'admin', userId: string) {
    if (userRole === 'admin') {
      return null;
    }

    if (userRole === 'faculty') {
      return `status.eq.published,uploaded_by.eq.${userId}`;
    }

    return 'status.eq.published';
  }

  async findById(id: string): Promise<Resource | null> {
    const { data, error } = await supabaseServiceClient
      .from('resources')
      .select(
        'id,subject_id,uploaded_by,title,description,resource_type,academic_year,semester,file_name,file_path,file_size_bytes,mime_type,status,download_count,published_at,created_at,updated_at'
      )
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const row = data as ResourceRow | null;
    return row ? this.mapRow(row) : null;
  }

  async listResources(
    filters: ResourceListQuery,
    userRole: 'student' | 'faculty' | 'admin',
    userId: string
  ): Promise<ResourcePage> {
    const { page, pageSize, subjectId, semester, department, resourceType, academicYear, status } =
      filters;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let subjectIds: string[] | undefined;
    if (department) {
      const { data, error } = await supabaseServiceClient
        .from('subjects')
        .select('id')
        .eq('department', department)
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      subjectIds = (data ?? []).map((subject) => subject.id);
      if (subjectIds.length === 0) {
        return { items: [], page, pageSize, total: 0 };
      }
    }

    let query = supabaseServiceClient
      .from('resources')
      .select(
        'id,subject_id,uploaded_by,title,description,resource_type,academic_year,semester,file_name,file_path,file_size_bytes,mime_type,status,download_count,published_at,created_at,updated_at',
        {
          count: 'exact'
        }
      )
      .order('created_at', { ascending: false })
      .order('id', { ascending: false });

    if (userRole !== 'admin') {
      query = query.neq('status', 'archived');
    }

    const visibility = this.buildVisibilityClause(userRole, userId);
    if (visibility) {
      query = query.or(visibility);
    }

    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }

    if (subjectIds) {
      query = query.in('subject_id', subjectIds);
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

    const items = (data ?? []).map((row) => this.mapRow(row as ResourceRow));
    return {
      items,
      page,
      pageSize,
      total: count ?? 0
    };
  }

  async createResource(
    resourceId: string,
    input: CreateResourceInput,
    uploadedBy: string,
    status: ResourceStatus
  ): Promise<Resource> {
    const { data, error } = await supabaseServiceClient
      .from('resources')
      .insert({
        id: resourceId,
        subject_id: input.subjectId,
        uploaded_by: uploadedBy,
        title: input.title,
        description: input.description ?? null,
        resource_type: input.resourceType,
        academic_year: input.academicYear,
        semester: input.semester,
        file_name: input.fileName,
        file_path: input.filePath,
        file_size_bytes: input.fileSizeBytes,
        mime_type: input.mimeType,
        status,
        download_count: 0,
        published_at: status === 'published' ? new Date().toISOString() : null
      })
      .select(
        'id,subject_id,uploaded_by,title,description,resource_type,academic_year,semester,file_name,file_path,file_size_bytes,mime_type,status,download_count,published_at,created_at,updated_at'
      )
      .maybeSingle();

    if (error) {
      throw error;
    }

    const row = data as ResourceRow | null;
    if (!row) {
      throw new NotFoundError('Resource not found');
    }

    return this.mapRow(row);
  }

  async updateResource(id: string, input: UpdateResourceInput): Promise<Resource | null> {
    const payload: Record<string, string | number | null> = {};

    if (input.subjectId !== undefined) {
      payload.subject_id = input.subjectId;
    }
    if (input.title !== undefined) {
      payload.title = input.title;
    }
    if (input.description !== undefined) {
      payload.description = input.description;
    }
    if (input.resourceType !== undefined) {
      payload.resource_type = input.resourceType;
    }
    if (input.academicYear !== undefined) {
      payload.academic_year = input.academicYear;
    }
    if (input.semester !== undefined) {
      payload.semester = input.semester;
    }
    if (input.fileName !== undefined) {
      payload.file_name = input.fileName;
    }
    if (input.filePath !== undefined) {
      payload.file_path = input.filePath;
    }
    if (input.fileSizeBytes !== undefined) {
      payload.file_size_bytes = input.fileSizeBytes;
    }
    if (input.mimeType !== undefined) {
      payload.mime_type = input.mimeType;
    }

    const { data, error } = await supabaseServiceClient
      .from('resources')
      .update(payload)
      .eq('id', id)
      .select(
        'id,subject_id,uploaded_by,title,description,resource_type,academic_year,semester,file_name,file_path,file_size_bytes,mime_type,status,download_count,published_at,created_at,updated_at'
      )
      .maybeSingle();

    if (error) {
      throw error;
    }

    const row = data as ResourceRow | null;
    return row ? this.mapRow(row) : null;
  }

  async updateResourceStatus(id: string, status: ResourceStatus): Promise<Resource | null> {
    return this.updateStatus(id, status);
  }

  async updateStatus(id: string, status: ResourceStatus): Promise<Resource | null> {
    const { data, error } = await supabaseServiceClient
      .from('resources')
      .update({
        status,
        published_at: status === 'published' ? new Date().toISOString() : null
      })
      .eq('id', id)
      .select(
        'id,subject_id,uploaded_by,title,description,resource_type,academic_year,semester,file_name,file_path,file_size_bytes,mime_type,status,download_count,published_at,created_at,updated_at'
      )
      .maybeSingle();

    if (error) {
      throw error;
    }

    const row = data as ResourceRow | null;
    return row ? this.mapRow(row) : null;
  }

  async archiveResource(id: string): Promise<Resource | null> {
    return this.updateResourceStatus(id, 'archived');
  }
}

export const resourcesRepository = new ResourcesRepository();
