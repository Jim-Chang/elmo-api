import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';
import {
  POWER_USER_ROLE,
  SUPERVISOR_ROLE,
} from '../../../../application/user/types';

const CreateUserSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(1),
    full_name: z.string(),
    role: z.enum([POWER_USER_ROLE, SUPERVISOR_ROLE]),
    remark: z.string().nullable().optional(),
    district_id: z.number().nullable().optional(),
  })
  .superRefine(validateRoleAndDistrict);

export class CreateUserDto extends createZodDto(CreateUserSchema) {}

function validateRoleAndDistrict(data: any, ctx: z.RefinementCtx) {
  if (data.role === POWER_USER_ROLE) {
    if (data.district_id) {
      ctx.addIssue({
        path: ['district_id'],
        code: z.ZodIssueCode.custom,
        message: 'should not be provided for power user role',
      });
    }
  } else if (data.role === SUPERVISOR_ROLE) {
    if (!data.district_id) {
      ctx.addIssue({
        path: ['district_id'],
        code: z.ZodIssueCode.custom,
        message: 'required for supervisor role',
      });
    }
  }
}

const UpdateUserSchema = z.object({
  full_name: z.string().optional(),
  role: z.enum([POWER_USER_ROLE, SUPERVISOR_ROLE]).optional(),
  district_id: z.number().nullable().optional(),
  remark: z.string().nullable().optional(),
});

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
