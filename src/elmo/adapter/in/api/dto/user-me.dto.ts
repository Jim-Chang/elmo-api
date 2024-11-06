import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';
import { AccessToken } from '../../../../application/auth/types';

const UserChangePasswordSchema = z.object({
  old_password: z.string().min(1),
  new_password: z.string().min(1),
});

export class UserChangePasswordDto extends createZodDto(
  UserChangePasswordSchema,
) {}

const UserChangePasswordResponseSchema = z.object({
  access_token: AccessToken,
});

export class UserChangePasswordResponseDto extends createZodDto(
  UserChangePasswordResponseSchema,
) {}
