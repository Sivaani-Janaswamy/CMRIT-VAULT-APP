import { z } from 'zod';

export const resourceTypeSchema = z.enum(['note', 'question_paper', 'faculty_upload']);

export const resourceStatusSchema = z.enum([
  'draft',
  'pending_review',
  'published',
  'rejected',
  'archived'
]);

export const resourceIdParamSchema = z
  .object({
    id: z.string().uuid()
  })
  .strict();

export const listResourcesQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    subjectId: z.string().uuid().optional(),
    semester: z.coerce.number().int().min(1).max(8).optional(),
    department: z.string().trim().min(1).optional(),
    resourceType: resourceTypeSchema.optional(),
    academicYear: z.string().trim().min(1).optional(),
    status: resourceStatusSchema.optional()
  })
  .strict();

export const createResourceSchema = z
  .object({
    subjectId: z.string().uuid(),
    title: z.string().trim().min(1),
    description: z.string().trim().min(1).nullable().optional(),
    resourceType: resourceTypeSchema,
    academicYear: z.string().trim().min(1),
    semester: z.coerce.number().int().min(1).max(8),
    fileName: z.string().trim().min(1),
    filePath: z.string().trim().min(1).optional(),
    fileSizeBytes: z.coerce.number().int().min(1),
    mimeType: z.string().trim().min(1).optional()
  })
  .strict();

export const updateResourceSchema = z
  .object({
    subjectId: z.string().uuid().optional(),
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).nullable().optional(),
    resourceType: resourceTypeSchema.optional(),
    academicYear: z.string().trim().min(1).optional(),
    semester: z.coerce.number().int().min(1).max(8).optional(),
    fileName: z.string().trim().min(1).optional(),
    filePath: z.string().trim().min(1).optional(),
    fileSizeBytes: z.coerce.number().int().min(1).optional(),
    mimeType: z.string().trim().min(1).optional()
  })
  .strict()
  .refine(
    (value) =>
      value.subjectId !== undefined ||
      value.title !== undefined ||
      value.description !== undefined ||
      value.resourceType !== undefined ||
      value.academicYear !== undefined ||
      value.semester !== undefined ||
      value.fileName !== undefined ||
      value.filePath !== undefined ||
      value.fileSizeBytes !== undefined ||
      value.mimeType !== undefined,
    {
      message: 'At least one field must be provided'
    }
  );

export const updateResourceStatusSchema = z
  .object({
    status: z.enum(['published', 'rejected'])
  })
  .strict();
