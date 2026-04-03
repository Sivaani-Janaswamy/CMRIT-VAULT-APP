import type { NextFunction, Request, Response } from 'express';

import type { AuthenticatedRequest } from '../../common/types/authenticated-request';
import { logDebug } from '../../common/utils/logger';
import { adminService } from './admin.service';
import type {
  AdminDashboardQuery,
  AdminDownloadsOverviewQuery,
  AdminResourcesOverviewQuery
} from './admin.types';

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

export async function getAdminDashboardSummaryHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = getAuthUser(req);
    const query = req.query as unknown as AdminDashboardQuery;
    logDebug('GET /v1/admin/dashboard/summary received', {
      userId: authUser.id,
      period: query.period
    });
    const summary = await adminService.getDashboardSummary(authUser.id, query);
    logDebug('GET /v1/admin/dashboard/summary success', {
      userId: authUser.id
    });
    res.status(200).json(successResponse('Admin dashboard summary fetched successfully', { summary }));
  } catch (error) {
    logDebug('GET /v1/admin/dashboard/summary failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}

export async function listAdminResourcesOverviewHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = getAuthUser(req);
    const query = req.query as unknown as AdminResourcesOverviewQuery;
    logDebug('GET /v1/admin/resources/overview received', {
      userId: authUser.id,
      page: query.page,
      pageSize: query.pageSize
    });
    const result = await adminService.listResourcesOverview(authUser.id, query);
    logDebug('GET /v1/admin/resources/overview success', {
      userId: authUser.id,
      count: result.items.length,
      total: result.total
    });
    res.status(200).json(
      successResponse('Admin resources overview fetched successfully', {
        items: result.items,
        pageInfo: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total
        }
      })
    );
  } catch (error) {
    logDebug('GET /v1/admin/resources/overview failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}

export async function listAdminDownloadsOverviewHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = getAuthUser(req);
    const query = req.query as unknown as AdminDownloadsOverviewQuery;
    logDebug('GET /v1/admin/downloads/overview received', {
      userId: authUser.id,
      page: query.page,
      pageSize: query.pageSize
    });
    const result = await adminService.listDownloadsOverview(authUser.id, query);
    logDebug('GET /v1/admin/downloads/overview success', {
      userId: authUser.id,
      count: result.items.length,
      total: result.total
    });
    res.status(200).json(
      successResponse('Admin downloads overview fetched successfully', {
        items: result.items,
        pageInfo: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total
        }
      })
    );
  } catch (error) {
    logDebug('GET /v1/admin/downloads/overview failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}
