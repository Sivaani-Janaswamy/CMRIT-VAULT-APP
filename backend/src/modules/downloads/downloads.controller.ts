import type { NextFunction, Request, Response } from 'express';

import type { AuthenticatedRequest } from '../../common/types/authenticated-request';
import { logDebug } from '../../common/utils/logger';
import { downloadsService } from './downloads.service';
import type {
  AdminDownloadsQuery,
  CreateDownloadUrlInput,
  MyDownloadsQuery
} from './downloads.types';

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

export async function createDownloadUrlHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = getAuthUser(req);
    const { id } = req.params as { id: string };
    const body = req.body as CreateDownloadUrlInput;
    logDebug('POST /v1/resources/:id/download-url received', {
      userId: authUser.id,
      resourceId: id,
      source: body.source
    });
    const result = await downloadsService.createDownloadUrl(authUser.id, id, {
      source: body.source,
      ipHash: body.ipHash ?? null,
      userAgent: body.userAgent ?? req.header('user-agent') ?? null
    });
    logDebug('POST /v1/resources/:id/download-url success', {
      userId: authUser.id,
      resourceId: id
    });
    res.status(200).json(
      successResponse('Download URL created successfully', {
        downloadUrl: result.downloadUrl,
        expiresAt: result.expiresAt
      })
    );
  } catch (error) {
    logDebug('POST /v1/resources/:id/download-url failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}

export async function listMyDownloadsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = getAuthUser(req);
    const query = req.query as unknown as MyDownloadsQuery;
    logDebug('GET /v1/downloads/me received', {
      userId: authUser.id,
      page: query.page,
      pageSize: query.pageSize
    });
    const result = await downloadsService.listMyDownloads(authUser.id, query);
    logDebug('GET /v1/downloads/me success', {
      userId: authUser.id,
      count: result.items.length,
      total: result.total
    });
    res.status(200).json(
      successResponse('Downloads fetched successfully', {
        items: result.items,
        pageInfo: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total
        }
      })
    );
  } catch (error) {
    logDebug('GET /v1/downloads/me failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}

export async function listAdminDownloadsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = getAuthUser(req);
    const query = req.query as unknown as AdminDownloadsQuery;
    logDebug('GET /v1/admin/downloads received', {
      userId: authUser.id,
      page: query.page,
      pageSize: query.pageSize
    });
    const result = await downloadsService.listAdminDownloads(authUser.id, query);
    logDebug('GET /v1/admin/downloads success', {
      userId: authUser.id,
      count: result.items.length,
      total: result.total
    });
    res.status(200).json(
      successResponse('Downloads fetched successfully', {
        items: result.items,
        pageInfo: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total
        }
      })
    );
  } catch (error) {
    logDebug('GET /v1/admin/downloads failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}

