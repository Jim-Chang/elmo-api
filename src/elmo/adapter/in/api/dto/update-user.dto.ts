import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';
import { ROLE_TYPES } from '../../../../application/user/types';

const UpdateUserSchema = z.object({
  password: z.string().min(1).optional(),
  full_name: z.string().optional(),
  role: z.enum(ROLE_TYPES).optional(),
  district_id: z.number().nullable().optional(),
  remark: z.string().nullable().optional(),
});

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
