import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';
import {
  POWER_USER_ROLE,
  ROLE_TYPES,
  SUPERVISOR_ROLE,
} from '../../../../application/user/types';

const CreateUserSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(1),
    full_name: z.string(),
    role: z.enum(ROLE_TYPES),
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
