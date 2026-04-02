import { supabaseServiceClient } from '../../integrations/supabase/client';
import type { Subject } from './subjects.types';

class SubjectsRepository {
  async findAll(): Promise<Subject[]> {
    const { data, error } = await supabaseServiceClient
      .from('subjects')
      .select('id,name,code')
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
}

export const subjectsRepository = new SubjectsRepository();
