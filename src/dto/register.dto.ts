import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { VersionUrlSchema } from './version-url.dto';

const RegisterSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  version_url: z
    .array(VersionUrlSchema)
    .min(1, 'At least one version url is required'),
});

export class RegisterDto extends createZodDto(RegisterSchema) {}
