import { supabaseServiceClient } from '../../integrations/supabase/client';
import { NotFoundError } from '../../common/errors/NotFoundError';
import type {
  CreateSubjectInput,
  Subject,
  SubjectDetail,
  UpdateSubjectInput
} from './subjects.types';

type SubjectRow = {
  id: string;
  code: string;
  name: string;
  department: string;
  semester: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

class SubjectsRepository {
  private mapSubjectRow(row: SubjectRow): SubjectDetail {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      department: row.department,
      semester: row.semester,
      isActive: row.is_active,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async findAll(): Promise<Subject[]> {
    const { data, error } = await supabaseServiceClient
      .from('subjects')
      .select('id,name,code')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []).map((subject) => ({
      id: subject.id,
      name: subject.name,
      code: subject.code
      }));
  }

  async findById(id: string): Promise<SubjectDetail | null> {
    const { data, error } = await supabaseServiceClient
      .from('subjects')
      .select('id,code,name,department,semester,is_active,created_by,created_at,updated_at')
      .eq('id', id)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const row = data as SubjectRow | null;
    return row ? this.mapSubjectRow(row) : null;
  }

  async createSubject(
    input: CreateSubjectInput,
    createdBy: string
  ): Promise<SubjectDetail> {
    const payload = {
      code: input.code,
      name: input.name,
      department: input.department,
      semester: input.semester,
      is_active: input.isActive ?? true,
      created_by: createdBy
    };

    const { data, error } = await supabaseServiceClient
      .from('subjects')
      .insert(payload)
      .select('id,code,name,department,semester,is_active,created_by,created_at,updated_at')
      .maybeSingle();

    if (error) {
      throw error;
    }

    const row = data as SubjectRow | null;
    if (!row) {
      throw new NotFoundError('Subject not found');
    }

    return this.mapSubjectRow(row);
  }

  async updateSubject(
    id: string,
    input: UpdateSubjectInput
  ): Promise<SubjectDetail | null> {
    const payload: Record<string, string | number | boolean | null> = {};

    if (input.code !== undefined) {
      payload.code = input.code;
    }

    if (input.name !== undefined) {
      payload.name = input.name;
    }

    if (input.department !== undefined) {
      payload.department = input.department;
    }

    if (input.semester !== undefined) {
      payload.semester = input.semester;
    }

    if (input.isActive !== undefined) {
      payload.is_active = input.isActive;
    }

    const { data, error } = await supabaseServiceClient
      .from('subjects')
      .update(payload)
      .eq('id', id)
      .select('id,code,name,department,semester,is_active,created_by,created_at,updated_at')
      .maybeSingle();

    if (error) {
      throw error;
    }

    const row = data as SubjectRow | null;
    return row ? this.mapSubjectRow(row) : null;
  }

  async softDeleteSubject(id: string): Promise<SubjectDetail | null> {
    const { data, error } = await supabaseServiceClient
      .from('subjects')
      .update({ is_active: false })
      .eq('id', id)
      .select('id,code,name,department,semester,is_active,created_by,created_at,updated_at')
      .maybeSingle();

    if (error) {
      throw error;
    }

    const row = data as SubjectRow | null;
    return row ? this.mapSubjectRow(row) : null;
  }
}

export const subjectsRepository = new SubjectsRepository();
