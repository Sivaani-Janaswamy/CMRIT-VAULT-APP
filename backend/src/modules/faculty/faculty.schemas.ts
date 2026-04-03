import { z } from 'zod';

import { resourceStatusSchema, resourceTypeSchema } from '../resources/resources.schemas';

export const facultyPeriodSchema = z.enum(['7d', '30d', '90d', 'all']).default('30d');

export const facultyDashboardQuerySchema = z
  .object({
    period: facultyPeriodSchema
  })
  .strict();

export const facultyResourcesQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    subjectId: z.string().uuid().optional(),
    department: z.string().trim().min(1).optional(),
    semester: z.coerce.number().int().min(1).max(8).optional(),
    resourceType: resourceTypeSchema.optional(),
    academicYear: z.string().trim().min(1).optional(),
    status: resourceStatusSchema.optional()
  })
  .strict();

export const facultyResourceIdParamSchema = z
  .object({
    id: z.string().uuid()
  })
  .strict();
