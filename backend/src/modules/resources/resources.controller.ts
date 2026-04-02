import type { NextFunction, Request, Response } from 'express';

import type { AuthenticatedRequest } from '../../common/types/authenticated-request';
import { logDebug } from '../../common/utils/logger';
import { resourcesService } from './resources.service';
import type {
  CreateResourceInput,
  ResourceListQuery,
  UpdateResourceInput,
  UpdateResourceStatusInput
} from './resources.types';

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

export async function listResourcesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = getAuthUser(req);
    const query = req.query as unknown as ResourceListQuery;
    logDebug('GET /v1/resources received', {
      userId: authUser.id,
      page: query.page,
      pageSize: query.pageSize
    });
    const result = await resourcesService.listResources(authUser.id, query);
    logDebug('GET /v1/resources success', {
      userId: authUser.id,
      count: result.items.length,
      total: result.total
    });
    res.status(200).json(
      successResponse('Resources fetched successfully', {
        items: result.items,
        pageInfo: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total
        }
      })
    );
  } catch (error) {
    logDebug('GET /v1/resources failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}

export async function getResourceHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = getAuthUser(req);
    const { id } = req.params as { id: string };
    logDebug('GET /v1/resources/:id received', {
      userId: authUser.id,
      resourceId: id
    });
    const resource = await resourcesService.getResource(authUser.id, id);
    logDebug('GET /v1/resources/:id success', {
      userId: authUser.id,
      resourceId: resource.id
    });
    res.status(200).json(successResponse('Resource fetched successfully', { resource }));
  } catch (error) {
    logDebug('GET /v1/resources/:id failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}

export async function createResourceHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = getAuthUser(req);
    const body = req.body as CreateResourceInput;
    logDebug('POST /v1/resources received', {
      userId: authUser.id,
      subjectId: body.subjectId
    });
    const result = await resourcesService.createResource(authUser.id, body);
    logDebug('POST /v1/resources success', {
      userId: authUser.id,
      resourceId: result.resource.id
    });
    res.status(201).json(
      successResponse('Resource created successfully', {
        resource: result.resource,
        uploadSession: result.uploadSession
      })
    );
  } catch (error) {
    logDebug('POST /v1/resources failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}

export async function updateResourceHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = getAuthUser(req);
    const { id } = req.params as { id: string };
    const body = req.body as UpdateResourceInput;
    logDebug('PATCH /v1/resources/:id received', {
      userId: authUser.id,
      resourceId: id
    });
    const resource = await resourcesService.updateResource(authUser.id, id, body);
    logDebug('PATCH /v1/resources/:id success', {
      userId: authUser.id,
      resourceId: resource.id
    });
    res.status(200).json(successResponse('Resource updated successfully', { resource }));
  } catch (error) {
    logDebug('PATCH /v1/resources/:id failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}

export async function completeResourceHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = getAuthUser(req);
    const { id } = req.params as { id: string };
    logDebug('POST /v1/resources/:id/complete received', {
      userId: authUser.id,
      resourceId: id
    });
    const resource = await resourcesService.completeResource(authUser.id, id);
    logDebug('POST /v1/resources/:id/complete success', {
      userId: authUser.id,
      resourceId: resource.id,
      status: resource.status
    });
    res.status(200).json(successResponse('Resource completion updated successfully', { resource }));
  } catch (error) {
    logDebug('POST /v1/resources/:id/complete failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}

export async function submitResourceHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = getAuthUser(req);
    const { id } = req.params as { id: string };
    logDebug('POST /v1/resources/:id/submit received', {
      userId: authUser.id,
      resourceId: id
    });
    const resource = await resourcesService.submitResource(authUser.id, id);
    logDebug('POST /v1/resources/:id/submit success', {
      userId: authUser.id,
      resourceId: resource.id,
      status: resource.status
    });
    res.status(200).json(successResponse('Resource submitted successfully', { resource }));
  } catch (error) {
    logDebug('POST /v1/resources/:id/submit failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}

export async function archiveResourceHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = getAuthUser(req);
    const { id } = req.params as { id: string };
    logDebug('DELETE /v1/resources/:id received', {
      userId: authUser.id,
      resourceId: id
    });
    const resource = await resourcesService.archiveResource(authUser.id, id);
    logDebug('DELETE /v1/resources/:id success', {
      userId: authUser.id,
      resourceId: resource.id,
      status: resource.status
    });
    res.status(200).json(successResponse('Resource archived successfully', { resource }));
  } catch (error) {
    logDebug('DELETE /v1/resources/:id failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}

export async function updateResourceStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = getAuthUser(req);
    const { id } = req.params as { id: string };
    const body = req.body as UpdateResourceStatusInput;
    logDebug('PATCH /v1/admin/resources/:id/status received', {
      userId: authUser.id,
      resourceId: id,
      status: body.status
    });
    const resource = await resourcesService.updateResourceStatus(authUser.id, id, body.status);
    logDebug('PATCH /v1/admin/resources/:id/status success', {
      userId: authUser.id,
      resourceId: resource.id,
      status: resource.status
    });
    res.status(200).json(successResponse('Resource status updated successfully', { resource }));
  } catch (error) {
    logDebug('PATCH /v1/admin/resources/:id/status failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}
