import { z } from 'zod';

import { resourceTypeSchema } from '../resources/resources.schemas';

export const resourceIdParamSchema = z
  .object({
    id: z.string().uuid()
  })
  .strict();

const dateStringSchema = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'Invalid date'
  });

export const createDownloadUrlSchema = z
  .object({
    source: z.enum(['mobile', 'web', 'admin']).default('mobile'),
    ipHash: z.string().trim().min(1).optional(),
    userAgent: z.string().trim().min(1).optional()
  })
  .strict()
  .default({
    source: 'mobile'
  });

export const listMyDownloadsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    startDate: dateStringSchema.optional(),
    endDate: dateStringSchema.optional(),
    resourceType: resourceTypeSchema.optional(),
    subjectId: z.string().uuid().optional()
  })
  .strict()
  .refine(
    (value) => {
      if (!value.startDate || !value.endDate) {
        return true;
      }

      return Date.parse(value.startDate) <= Date.parse(value.endDate);
    },
    {
      message: 'startDate must be before or equal to endDate'
    }
  );

export const listAdminDownloadsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    userId: z.string().uuid().optional(),
    resourceId: z.string().uuid().optional(),
    startDate: dateStringSchema.optional(),
    endDate: dateStringSchema.optional()
  })
  .strict()
  .refine(
    (value) => {
      if (!value.startDate || !value.endDate) {
        return true;
      }

      return Date.parse(value.startDate) <= Date.parse(value.endDate);
    },
    {
      message: 'startDate must be before or equal to endDate'
    }
  );
