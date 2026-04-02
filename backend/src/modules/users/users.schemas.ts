import { z } from 'zod';

export const roleCodeSchema = z.enum(['student', 'faculty', 'admin']);

export const updateOwnUserSchema = z
  .object({
    fullName: z.string().trim().min(1).optional(),
    rollNo: z.string().trim().min(1).nullable().optional(),
    department: z.string().trim().min(1).nullable().optional(),
    semester: z.union([z.coerce.number().int().min(1).max(8), z.null()]).optional()
  })
  .strict()
  .refine(
    (value) =>
      value.fullName !== undefined ||
      value.rollNo !== undefined ||
      value.department !== undefined ||
      value.semester !== undefined,
    {
      message: 'At least one field must be provided'
    }
  );

export const adminUsersQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    role: roleCodeSchema.optional(),
    department: z.string().trim().min(1).optional(),
    semester: z.coerce.number().int().min(1).max(8).optional()
  })
  .strict();

export const userIdParamSchema = z
  .object({
    id: z.string().uuid()
  })
  .strict();

export const updateUserRoleSchema = z
  .object({
    role: roleCodeSchema
  })
  .strict();

export const updateUserStatusSchema = z
  .object({
    isActive: z.boolean()
  })
  .strict();
