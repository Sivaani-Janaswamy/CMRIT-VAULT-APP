import { z } from 'zod';

import { resourceTypeSchema } from '../resources/resources.schemas';

export const searchResourcesQuerySchema = z
  .object({
    q: z.string().trim().min(1),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
    resourceType: resourceTypeSchema.optional(),
    subjectId: z.string().uuid().optional(),
    department: z.string().trim().min(1).optional(),
    semester: z.coerce.number().int().min(1).max(8).optional(),
    academicYear: z.string().trim().min(1).optional()
  })
  .strict();

export const suggestQuerySchema = z
  .object({
    q: z.string().trim().min(1),
    limit: z.coerce.number().int().min(1).max(10).default(5)
  })
  .strict();

export const reindexResourceParamSchema = z
  .object({
    id: z.string().uuid()
  })
  .strict();
