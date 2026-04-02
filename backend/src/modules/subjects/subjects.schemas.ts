import { z } from 'zod';

export const subjectIdParamSchema = z
  .object({
    id: z.string().uuid()
  })
  .strict();

export const createSubjectSchema = z
  .object({
    code: z.string().trim().min(1),
    name: z.string().trim().min(1),
    department: z.string().trim().min(1),
    semester: z.coerce.number().int().min(1).max(8),
    isActive: z.boolean().optional()
  })
  .strict();

export const updateSubjectSchema = z
  .object({
    code: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1).optional(),
    department: z.string().trim().min(1).optional(),
    semester: z.coerce.number().int().min(1).max(8).optional(),
    isActive: z.boolean().optional()
  })
  .strict()
  .refine(
    (value) =>
      value.code !== undefined ||
      value.name !== undefined ||
      value.department !== undefined ||
      value.semester !== undefined ||
      value.isActive !== undefined,
    {
      message: 'At least one field must be provided'
    }
  );
