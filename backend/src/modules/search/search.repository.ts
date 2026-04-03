import { supabaseServiceClient } from '../../integrations/supabase/client';
import type { SearchResourceRow, SearchSubjectRow } from '../../common/types/search-contracts';

interface ResourceBatch {
  rows: SearchResourceRow[];
  hasMore: boolean;
}

class SearchRepository {
  private async fetchResourceBatch(page: number, pageSize: number): Promise<ResourceBatch> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabaseServiceClient
      .from('resources')
      .select(
        'id,subject_id,uploaded_by,title,description,resource_type,academic_year,semester,file_name,status,download_count,published_at,created_at,updated_at'
      )
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(from, to);

    if (error) {
      throw error;
    }

    const rows = (data ?? []) as SearchResourceRow[];
    return {
      rows,
      hasMore: rows.length === pageSize
    };
  }

  async fetchAllResources(): Promise<SearchResourceRow[]> {
    const rows: SearchResourceRow[] = [];
    let page = 1;
    const pageSize = 500;

    while (true) {
      const pageResult = await this.fetchResourceBatch(page, pageSize);
      rows.push(...pageResult.rows);
      if (!pageResult.hasMore) {
        break;
      }
      page += 1;
    }

    return rows;
  }

  async fetchResourceById(resourceId: string): Promise<SearchResourceRow | null> {
    const { data, error } = await supabaseServiceClient
      .from('resources')
      .select(
        'id,subject_id,uploaded_by,title,description,resource_type,academic_year,semester,file_name,status,download_count,published_at,created_at,updated_at'
      )
      .eq('id', resourceId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as SearchResourceRow | null) ?? null;
  }

  async fetchSubjectsByIds(subjectIds: string[]): Promise<Map<string, SearchSubjectRow>> {
    if (subjectIds.length === 0) {
      return new Map<string, SearchSubjectRow>();
    }

    const { data, error } = await supabaseServiceClient
      .from('subjects')
      .select('id,code,name,department,semester')
      .in('id', subjectIds);

    if (error) {
      throw error;
    }

    const map = new Map<string, SearchSubjectRow>();
    for (const row of (data ?? []) as SearchSubjectRow[]) {
      map.set(row.id, row);
    }

    return map;
  }

  async fetchSubjectById(subjectId: string): Promise<SearchSubjectRow | null> {
    const { data, error } = await supabaseServiceClient
      .from('subjects')
      .select('id,code,name,department,semester')
      .eq('id', subjectId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as SearchSubjectRow | null) ?? null;
  }
}

export const searchRepository = new SearchRepository();
