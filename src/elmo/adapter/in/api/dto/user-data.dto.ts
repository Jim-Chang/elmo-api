import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';
import { ROLE_TYPES } from '../../../../application/user/types';

export const UserDataSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password: z.string().min(1),
  full_name: z.string(),
  role: z.enum(ROLE_TYPES),
  remark: z.string().optional(),
  district_id: z.number().optional(),
  created_at: z.date(),
});

export class UserDataDto extends createZodDto(UserDataSchema) {}
