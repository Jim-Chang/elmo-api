import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';

const UserChangePasswordSchema = z.object({
  old_password: z.string().min(1),
  new_password: z.string().min(1),
});

export class UserChangePasswordDto extends createZodDto(
  UserChangePasswordSchema,
) {}
