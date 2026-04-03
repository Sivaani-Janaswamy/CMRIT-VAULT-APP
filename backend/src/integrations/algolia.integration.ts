import { env } from '../config/env';
import type { ResourceStatus, ResourceType } from '../modules/resources/resources.types';
import type {
  SearchIndexRecord,
  SearchResourceRow,
  SearchSubjectRow,
  SearchSuggestItem
} from '../modules/search/search.types';

interface AlgoliaConfig {
  appId: string;
  searchKey: string;
  adminKey: string;
  searchHost: string;
  adminHost: string;
  indexName: string;
}

interface AlgoliaSearchResponse<T> {
  hits: T[];
  nbHits: number;
}

interface AlgoliaBatchRequest<T> {
  requests: Array<{
    action: 'updateObject';
    body: T;
  }>;
}

class AlgoliaIntegration {
  private normalizeHost(host: string): string {
    if (host.startsWith('http://') || host.startsWith('https://')) {
      return host.replace(/\/+$/, '');
    }

    return `https://${host.replace(/\/+$/, '')}`;
  }

  private getConfig(): AlgoliaConfig {
    const appId = env.algoliaAppId;
    const searchKey = env.algoliaSearchKey ?? env.algoliaAdminKey;
    const adminKey = env.algoliaAdminKey ?? env.algoliaSearchKey;
    const searchHost = env.algoliaSearchHost
      ? this.normalizeHost(env.algoliaSearchHost)
      : appId
        ? `https://${appId}-dsn.algolia.net`
        : '';
    const adminHost = env.algoliaAdminHost
      ? this.normalizeHost(env.algoliaAdminHost)
      : appId
        ? `https://${appId}.algolia.net`
        : '';
    const indexName = env.algoliaIndexName ?? 'cmrit_vault_resources';

    if (!appId || !searchKey || !adminKey || !searchHost || !adminHost) {
      throw new Error(
        'Missing Algolia env vars: ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY, ALGOLIA_ADMIN_KEY, ALGOLIA_SEARCH_HOST, or ALGOLIA_ADMIN_HOST'
      );
    }

    return {
      appId,
      searchKey,
      adminKey,
      searchHost,
      adminHost,
      indexName
    };
  }

  private async algoliaRequest<T>(
    host: string,
    method: 'GET' | 'POST',
    path: string,
    apiKey: string,
    body?: unknown
  ): Promise<T> {
    const { appId } = this.getConfig();
    const response = await fetch(`${host}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Algolia-Application-Id': appId,
        'X-Algolia-API-Key': apiKey
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });

    const text = await response.text();
    let json: T | null = null;
    if (text) {
      try {
        json = JSON.parse(text) as T;
      } catch {
        json = null;
      }
    }

    if (!response.ok) {
      const message =
        typeof json === 'object' && json !== null && 'message' in json
          ? String((json as { message?: unknown }).message ?? 'Algolia request failed')
          : 'Algolia request failed';
      throw new Error(message);
    }

    return json as T;
  }

  private isResourceType(value: string): value is ResourceType {
    return value === 'note' || value === 'question_paper' || value === 'faculty_upload';
  }

  private isResourceStatus(value: string): value is ResourceStatus {
    return (
      value === 'draft' ||
      value === 'pending_review' ||
      value === 'published' ||
      value === 'rejected' ||
      value === 'archived'
    );
  }

  buildSearchIndexRecord(resource: SearchResourceRow, subject: SearchSubjectRow): SearchIndexRecord {
    const resourceType = this.isResourceType(resource.resource_type) ? resource.resource_type : 'note';
    const status = this.isResourceStatus(resource.status) ? resource.status : 'draft';
    const searchableText = [
      resource.title,
      resource.description ?? '',
      resource.file_name,
      subject.code,
      subject.name,
      subject.department,
      resource.academic_year
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return {
      objectID: resource.id,
      resourceId: resource.id,
      subjectId: subject.id,
      subjectCode: subject.code,
      subjectName: subject.name,
      department: subject.department,
      semester: resource.semester,
      resourceType,
      title: resource.title,
      description: resource.description,
      academicYear: resource.academic_year,
      fileName: resource.file_name,
      status,
      downloadCount: resource.download_count,
      publishedAt: resource.published_at,
      createdAt: resource.created_at,
      updatedAt: resource.updated_at,
      ownerId: resource.uploaded_by,
      searchableText
    };
  }

  async searchResources(input: {
    query: string;
    page: number;
    pageSize: number;
    filters?: string;
  }): Promise<AlgoliaSearchResponse<SearchIndexRecord>> {
    const { indexName, searchHost, searchKey } = this.getConfig();
    // DSN/search host is query-only, so read paths use it for search and suggestions.
    return this.algoliaRequest<AlgoliaSearchResponse<SearchIndexRecord>>(
      searchHost,
      'POST',
      `/1/indexes/${encodeURIComponent(indexName)}/query`,
      searchKey,
      {
        query: input.query,
        page: input.page - 1,
        hitsPerPage: input.pageSize,
        filters: input.filters,
        attributesToRetrieve: [
          'objectID',
          'resourceId',
          'subjectId',
          'subjectCode',
          'subjectName',
          'department',
          'semester',
          'resourceType',
          'title',
          'description',
          'academicYear',
          'fileName',
          'status',
          'downloadCount',
          'publishedAt',
          'createdAt',
          'updatedAt',
          'ownerId',
          'searchableText'
        ]
      }
    );
  }

  async suggestResources(input: {
    query: string;
    limit: number;
    filters?: string;
  }): Promise<SearchSuggestItem[]> {
    const { indexName, searchHost, searchKey } = this.getConfig();
    // DSN/search host is query-only, so read paths use it for search and suggestions.
    const response = await this.algoliaRequest<AlgoliaSearchResponse<SearchSuggestItem>>(
      searchHost,
      'POST',
      `/1/indexes/${encodeURIComponent(indexName)}/query`,
      searchKey,
      {
        query: input.query,
        page: 0,
        hitsPerPage: input.limit,
        filters: input.filters,
        attributesToRetrieve: ['resourceId', 'title', 'subjectName', 'resourceType', 'academicYear', 'status', 'ownerId']
      }
    );

    return response.hits;
  }

  async reindexAllResources(records: SearchIndexRecord[]): Promise<number> {
    const { indexName, adminHost, adminKey } = this.getConfig();
    // DSN is query-only; reindexing is a write operation and must use the admin host.
    await this.algoliaRequest(adminHost, 'POST', `/1/indexes/${encodeURIComponent(indexName)}/clear`, adminKey, {});

    const batchSize = 100;
    for (let index = 0; index < records.length; index += batchSize) {
      const chunk = records.slice(index, index + batchSize);
      const payload: AlgoliaBatchRequest<SearchIndexRecord> = {
        requests: chunk.map((record) => ({
          action: 'updateObject',
          body: record
        }))
      };

      await this.algoliaRequest(adminHost, 'POST', `/1/indexes/${encodeURIComponent(indexName)}/batch`, adminKey, payload);
    }

    return records.length;
  }

  async reindexResource(record: SearchIndexRecord): Promise<void> {
    const { indexName, adminHost, adminKey } = this.getConfig();
    // DSN is query-only; single-record upserts must also use the admin host.
    const payload: AlgoliaBatchRequest<SearchIndexRecord> = {
      requests: [
        {
          action: 'updateObject',
          body: record
        }
      ]
    };

    await this.algoliaRequest(adminHost, 'POST', `/1/indexes/${encodeURIComponent(indexName)}/batch`, adminKey, payload);
  }
}

export const algoliaIntegration = new AlgoliaIntegration();
