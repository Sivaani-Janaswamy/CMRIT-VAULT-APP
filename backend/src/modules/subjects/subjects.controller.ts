import type { Request, Response, NextFunction } from 'express';

import { subjectsService } from './subjects.service';
import { logDebug } from '../../common/utils/logger';

export async function listSubjectsHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    logDebug('GET /v1/subjects received');
    const subjects = await subjectsService.listSubjects();
    logDebug('GET /v1/subjects success', {
      count: subjects.length
    });
    res.status(200).json({
      success: true,
      message: 'Subjects fetched successfully',
      data: { items: subjects },
      error: null
    });
  } catch (error) {
    logDebug('GET /v1/subjects failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}
