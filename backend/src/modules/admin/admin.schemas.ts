import { z } from 'zod';

import { resourceStatusSchema, resourceTypeSchema } from '../resources/resources.schemas';

export const adminPeriodSchema = z.enum(['7d', '30d', '90d', 'all']).default('30d');

export const adminDashboardQuerySchema = z
  .object({
    period: adminPeriodSchema
  })
  .strict();

export const adminResourcesOverviewQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    subjectId: z.string().uuid().optional(),
    department: z.string().trim().min(1).optional(),
    semester: z.coerce.number().int().min(1).max(8).optional(),
    resourceType: resourceTypeSchema.optional(),
    academicYear: z.string().trim().min(1).optional(),
    status: resourceStatusSchema.optional(),
    uploadedBy: z.string().uuid().optional()
  })
  .strict();

export const adminDownloadsOverviewQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    userId: z.string().uuid().optional(),
    resourceId: z.string().uuid().optional(),
    source: z.enum(['mobile', 'web', 'admin']).optional(),
    fromDate: z.string().datetime().optional(),
    toDate: z.string().datetime().optional()
  })
  .strict();
