import type { Request, Response, NextFunction } from 'express';

import { subjectsService } from './subjects.service';

export async function listSubjectsHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const subjects = await subjectsService.listSubjects();
    res.status(200).json({
      success: true,
      message: 'Subjects fetched successfully',
      data: { items: subjects },
      error: null
    });
  } catch (error) {
    next(error);
  }
}
