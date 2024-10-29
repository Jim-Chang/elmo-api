import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';
import { UserDataSchema } from './user-data.dto';

const UserListQuerySchema = z.object({
  keyword: z.string().optional(),
});

export class UserListQueryDto extends createZodDto(UserListQuerySchema) {}

const UserListDataSchema = z.object({
  items: z.array(UserDataSchema),
});

export class UserListDataDto extends createZodDto(UserListDataSchema) {}
