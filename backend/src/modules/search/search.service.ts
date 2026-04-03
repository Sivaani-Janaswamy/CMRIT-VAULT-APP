import { randomUUID } from 'node:crypto';

import { ForbiddenError } from '../../common/errors/ForbiddenError';
import { NotFoundError } from '../../common/errors/NotFoundError';
import { algoliaIntegration } from '../../integrations/algolia.integration';
import { canViewResource } from '../resources/resources.utils';
import { usersRepository } from '../users/users.repository';
import { searchRepository } from './search.repository';
import type {
  SearchFilters,
  SearchIndexRecord,
  SearchPage,
  SearchQueryInput,
  SearchReindexResult,
  SearchResourceItem,
  SearchResourceRow,
  SearchSubjectRow,
  SearchSuggestItem,
  SearchSuggestQueryInput
} from './search.types';

class SearchService {
  private async requireAccess(userId: string) {
    const currentUser = await usersRepository.findAccessContextById(userId);
    if (!currentUser || !currentUser.isActive) {
      throw new ForbiddenError('Access required');
    }

    return currentUser;
  }

  private buildVisibilityFilter(role: 'student' | 'faculty' | 'admin', currentUserId: string): string | null {
    if (role === 'admin') {
      return null;
    }

    if (role === 'faculty') {
      return `(status:published OR (ownerId:${JSON.stringify(currentUserId)} AND NOT status:archived))`;
    }

    return 'status:published';
  }

  private buildFilters(filters: SearchFilters): string[] {
    const clauses: string[] = [];

    if (filters.resourceType) {
      clauses.push(`resourceType:${filters.resourceType}`);
    }

    if (filters.subjectId) {
      clauses.push(`subjectId:${JSON.stringify(filters.subjectId)}`);
    }

    if (filters.department) {
      clauses.push(`department:${JSON.stringify(filters.department)}`);
    }

    if (filters.semester !== undefined) {
      clauses.push(`semester:${filters.semester}`);
    }

    if (filters.academicYear) {
      clauses.push(`academicYear:${JSON.stringify(filters.academicYear)}`);
    }

    return clauses;
  }

  private composeFilters(
    role: 'student' | 'faculty' | 'admin',
    currentUserId: string,
    filters: SearchFilters
  ): string | undefined {
    const clauses = this.buildFilters(filters);
    const visibility = this.buildVisibilityFilter(role, currentUserId);

    if (visibility) {
      clauses.unshift(visibility);
    }

    return clauses.length > 0 ? clauses.join(' AND ') : undefined;
  }

  private mapIndexRecordToItem(record: SearchIndexRecord): SearchResourceItem {
    return {
      resourceId: record.resourceId,
      subjectId: record.subjectId,
      subjectCode: record.subjectCode,
      subjectName: record.subjectName,
      department: record.department,
      semester: record.semester,
      resourceType: record.resourceType,
      title: record.title,
      description: record.description,
      academicYear: record.academicYear,
      fileName: record.fileName,
      status: record.status,
      downloadCount: record.downloadCount,
      publishedAt: record.publishedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      ownerId: record.ownerId
    };
  }

  private mapResourceRowToIndexRecord(
    resource: SearchResourceRow,
    subject: SearchSubjectRow
  ): SearchIndexRecord {
    return algoliaIntegration.buildSearchIndexRecord(resource, subject);
  }

  async searchResources(userId: string, input: SearchQueryInput): Promise<SearchPage> {
    const currentUser = await this.requireAccess(userId);
    const result = await algoliaIntegration.searchResources({
      query: input.q,
      page: input.page,
      pageSize: input.pageSize,
      filters: this.composeFilters(currentUser.role, currentUser.id, input.filters)
    });

    // ARCHITECTURE.md + DATABASE_DESIGN.md: Search is a read model, so visibility is
    // enforced before returning results even though Algolia already filters the index query.
    const items = result.hits
      .filter((item) => canViewResource(currentUser.role, { status: item.status, ownerId: item.ownerId }, currentUser.id))
      .map((item) => this.mapIndexRecordToItem(item));

    return {
      items,
      page: input.page,
      pageSize: input.pageSize,
      total: result.nbHits
    };
  }

  async suggestResources(userId: string, input: SearchSuggestQueryInput): Promise<SearchSuggestItem[]> {
    const currentUser = await this.requireAccess(userId);
    const items = await algoliaIntegration.suggestResources({
      query: input.q,
      limit: input.limit,
      filters: this.composeFilters(currentUser.role, currentUser.id, {})
    });

    // DATABASE_DESIGN.md: suggestions must never leak hidden resources.
    return items.filter((item) =>
      canViewResource(currentUser.role, { status: item.status, ownerId: item.ownerId }, currentUser.id)
    );
  }

  async reindexAll(userId: string): Promise<SearchReindexResult> {
    const currentUser = await this.requireAccess(userId);
    if (currentUser.role !== 'admin') {
      throw new ForbiddenError('Admin access required');
    }

    const resources = await searchRepository.fetchAllResources();
    const subjects = await searchRepository.fetchSubjectsByIds(resources.map((resource) => resource.subject_id));
    const records = resources.map((resource) => {
      const subject = subjects.get(resource.subject_id);
      if (!subject) {
        throw new NotFoundError(`Subject not found for resource ${resource.id}`);
      }

      return algoliaIntegration.buildSearchIndexRecord(resource, subject);
    });

    await algoliaIntegration.reindexAllResources(records);
    return {
      jobId: randomUUID(),
      status: 'completed'
    };
  }

  async reindexResource(userId: string, resourceId: string): Promise<SearchReindexResult> {
    const currentUser = await this.requireAccess(userId);
    if (currentUser.role !== 'admin') {
      throw new ForbiddenError('Admin access required');
    }

    const resource = await searchRepository.fetchResourceById(resourceId);
    if (!resource) {
      throw new NotFoundError('Resource not found');
    }

    const subject = await searchRepository.fetchSubjectById(resource.subject_id);
    if (!subject) {
      throw new NotFoundError('Subject not found');
    }

    const record = this.mapResourceRowToIndexRecord(resource, subject);
    await algoliaIntegration.reindexResource(record);
    return {
      jobId: randomUUID(),
      status: 'completed'
    };
  }
}

export const searchService = new SearchService();
