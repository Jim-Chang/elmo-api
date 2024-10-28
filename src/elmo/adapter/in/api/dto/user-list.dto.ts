import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';
import { ROLE_TYPES } from '../../../../application/user/types';

const UserListQuerySchema = z.object({
  keyword: z.string().optional(),
});

export class UserListQueryDto extends createZodDto(UserListQuerySchema) {}

export const UserListItemDataSchema = z.object({
  uuid: z.string(),
  full_name: z.string(),
  email: z.string().email(),
  role: z.enum(ROLE_TYPES),
  remark: z.string().nullable(),
  created_at: z.date(),
});

const UserListDataSchema = z.object({
  items: z.array(UserListItemDataSchema),
});

export class UserListDataDto extends createZodDto(UserListDataSchema) {}
