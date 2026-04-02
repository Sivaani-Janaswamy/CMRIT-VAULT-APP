import type { Request, Response, NextFunction } from 'express';

import type { AuthenticatedRequest } from '../../common/types/authenticated-request';
import { subjectsService } from './subjects.service';
import { logDebug } from '../../common/utils/logger';
import type { CreateSubjectInput, UpdateSubjectInput } from './subjects.types';

function getAuthUser(req: Request) {
  return (req as AuthenticatedRequest).user;
}

export async function listSubjectsHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    logDebug('GET /v1/subjects received');
    const subjects = await subjectsService.listSubjects();
    const pageInfo = {
      page: 1,
      pageSize: subjects.length,
      total: subjects.length
    };
    logDebug('GET /v1/subjects success', {
      count: subjects.length
    });
    res.status(200).json({
      success: true,
      message: 'Subjects fetched successfully',
      data: { items: subjects, pageInfo },
      error: null
    });
  } catch (error) {
    logDebug('GET /v1/subjects failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}

export async function getSubjectHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = getAuthUser(req);
    const { id } = req.params as { id: string };
    logDebug('GET /v1/subjects/:id received', {
      userId: authUser.id,
      subjectId: id
    });
    const subject = await subjectsService.getSubject(authUser.id, id);
    logDebug('GET /v1/subjects/:id success', {
      userId: authUser.id,
      subjectId: subject.id
    });
    res.status(200).json({
      success: true,
      message: 'Subject fetched successfully',
      data: { subject },
      error: null
    });
  } catch (error) {
    logDebug('GET /v1/subjects/:id failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}

export async function createAdminSubjectHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = getAuthUser(req);
    const body = req.body as CreateSubjectInput;
    logDebug('POST /v1/admin/subjects received', {
      userId: authUser.id,
      code: body.code
    });
    const subject = await subjectsService.createSubject(authUser.id, body);
    logDebug('POST /v1/admin/subjects success', {
      userId: authUser.id,
      subjectId: subject.id
    });
    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: { subject },
      error: null
    });
  } catch (error) {
    logDebug('POST /v1/admin/subjects failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}

export async function updateAdminSubjectHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = getAuthUser(req);
    const { id } = req.params as { id: string };
    const body = req.body as UpdateSubjectInput;
    logDebug('PATCH /v1/admin/subjects/:id received', {
      userId: authUser.id,
      subjectId: id
    });
    const subject = await subjectsService.updateSubject(authUser.id, id, body);
    logDebug('PATCH /v1/admin/subjects/:id success', {
      userId: authUser.id,
      subjectId: subject.id
    });
    res.status(200).json({
      success: true,
      message: 'Subject updated successfully',
      data: { subject },
      error: null
    });
  } catch (error) {
    logDebug('PATCH /v1/admin/subjects/:id failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}

export async function deleteAdminSubjectHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = getAuthUser(req);
    const { id } = req.params as { id: string };
    logDebug('DELETE /v1/admin/subjects/:id received', {
      userId: authUser.id,
      subjectId: id
    });
    const subject = await subjectsService.deleteSubject(authUser.id, id);
    logDebug('DELETE /v1/admin/subjects/:id success', {
      userId: authUser.id,
      subjectId: subject.id
    });
    res.status(200).json({
      success: true,
      message: 'Subject deleted successfully',
      data: { subject },
      error: null
    });
  } catch (error) {
    logDebug('DELETE /v1/admin/subjects/:id failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}
