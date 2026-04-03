import type { NextFunction, Request, Response } from 'express';

import type { AuthenticatedRequest } from '../../common/types/authenticated-request';
import { logDebug } from '../../common/utils/logger';
import { facultyService } from './faculty.service';
import type { FacultyDashboardQuery, FacultyResourcesQuery } from './faculty.types';

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

export async function getFacultyDashboardSummaryHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = getAuthUser(req);
    const query = req.query as unknown as FacultyDashboardQuery;
    logDebug('GET /v1/faculty/dashboard/summary received', {
      userId: authUser.id,
      period: query.period
    });
    const summary = await facultyService.getDashboardSummary(authUser.id, query);
    logDebug('GET /v1/faculty/dashboard/summary success', {
      userId: authUser.id
    });
    res.status(200).json(successResponse('Faculty dashboard summary fetched successfully', { summary }));
  } catch (error) {
    logDebug('GET /v1/faculty/dashboard/summary failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}

export async function listFacultyResourcesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = getAuthUser(req);
    const query = req.query as unknown as FacultyResourcesQuery;
    logDebug('GET /v1/faculty/resources received', {
      userId: authUser.id,
      page: query.page,
      pageSize: query.pageSize
    });
    const result = await facultyService.listResources(authUser.id, query);
    logDebug('GET /v1/faculty/resources success', {
      userId: authUser.id,
      count: result.items.length,
      total: result.total
    });
    res.status(200).json(
      successResponse('Faculty resources fetched successfully', {
        items: result.items,
        pageInfo: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total
        }
      })
    );
  } catch (error) {
    logDebug('GET /v1/faculty/resources failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}

export async function getFacultyResourceStatsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = getAuthUser(req);
    const { id } = req.params as { id: string };
    logDebug('GET /v1/faculty/resources/:id/stats received', {
      userId: authUser.id,
      resourceId: id
    });
    const stats = await facultyService.getResourceStats(authUser.id, id);
    logDebug('GET /v1/faculty/resources/:id/stats success', {
      userId: authUser.id,
      resourceId: id
    });
    res.status(200).json(successResponse('Faculty resource stats fetched successfully', { stats }));
  } catch (error) {
    logDebug('GET /v1/faculty/resources/:id/stats failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}
