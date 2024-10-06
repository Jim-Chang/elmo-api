import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { VersionUrlSchema } from './version-url.dto';

const RegisterSchema = z.object({
  token: z
    .string()
    .min(1, 'Token is required')
    .max(767, 'Token is too long, max 767 characters'),
  version_url: z
    .array(VersionUrlSchema)
    .min(1, 'At least one version url is required')
    .max(1, 'Only one version url is allowed'),
});

export class RegisterDto extends createZodDto(RegisterSchema) {}
