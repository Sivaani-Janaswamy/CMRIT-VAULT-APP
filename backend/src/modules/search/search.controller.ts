import type { NextFunction, Request, Response } from 'express';

import type { AuthenticatedRequest } from '../../common/types/authenticated-request';
import { logDebug } from '../../common/utils/logger';
import { searchService } from './search.service';
import type { SearchFilters, SearchQueryInput, SearchSuggestQueryInput } from './search.types';

function getAuthUser(req: Request) {
  return (req as AuthenticatedRequest).user;
}

function successResponse<T>(message: string, data: T) {
  return {
    success: true,
    message,
    data,
    error: null
  };
}

export async function searchResourcesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = getAuthUser(req);
    const query = req.query as unknown as {
      q: string;
      page: number;
      pageSize: number;
      resourceType?: SearchFilters['resourceType'];
      subjectId?: string;
      department?: string;
      semester?: number;
      academicYear?: string;
    };
    const input: SearchQueryInput = {
      q: query.q,
      page: query.page,
      pageSize: query.pageSize,
      filters: {
        resourceType: query.resourceType,
        subjectId: query.subjectId,
        department: query.department,
        semester: query.semester,
        academicYear: query.academicYear
      }
    };
    logDebug('GET /v1/search/resources received', {
      userId: authUser.id,
      q: input.q,
      page: input.page,
      pageSize: input.pageSize
    });
    const result = await searchService.searchResources(authUser.id, input);
    logDebug('GET /v1/search/resources success', {
      userId: authUser.id,
      count: result.items.length,
      total: result.total
    });
    res.status(200).json(
      successResponse('Search results fetched successfully', {
        items: result.items,
        pageInfo: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total
        }
      })
    );
  } catch (error) {
    logDebug('GET /v1/search/resources failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}

export async function suggestResourcesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = getAuthUser(req);
    const query = req.query as unknown as SearchSuggestQueryInput;
    logDebug('GET /v1/search/suggest received', {
      userId: authUser.id,
      q: query.q,
      limit: query.limit
    });
    const items = await searchService.suggestResources(authUser.id, query);
    logDebug('GET /v1/search/suggest success', {
      userId: authUser.id,
      count: items.length
    });
    const responseItems = items.map(({ resourceId, title, subjectName, resourceType, academicYear }) => ({
      resourceId,
      title,
      subjectName,
      resourceType,
      academicYear
    }));
    res.status(200).json(successResponse('Search suggestions fetched successfully', { items: responseItems }));
  } catch (error) {
    logDebug('GET /v1/search/suggest failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}

export async function reindexAllResourcesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = getAuthUser(req);
    logDebug('POST /v1/admin/search/reindex received', { userId: authUser.id });
    const result = await searchService.reindexAll(authUser.id);
    logDebug('POST /v1/admin/search/reindex success', {
      userId: authUser.id,
      jobId: result.jobId
    });
    res.status(200).json(successResponse('Search reindex started successfully', result));
  } catch (error) {
    logDebug('POST /v1/admin/search/reindex failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}

export async function reindexSingleResourceHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = getAuthUser(req);
    const { id } = req.params as { id: string };
    logDebug('POST /v1/admin/search/resources/:id/reindex received', {
      userId: authUser.id,
      resourceId: id
    });
    const result = await searchService.reindexResource(authUser.id, id);
    logDebug('POST /v1/admin/search/resources/:id/reindex success', {
      userId: authUser.id,
      resourceId: id,
      jobId: result.jobId
    });
    res.status(200).json(successResponse('Resource reindex started successfully', result));
  } catch (error) {
    logDebug('POST /v1/admin/search/resources/:id/reindex failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}
