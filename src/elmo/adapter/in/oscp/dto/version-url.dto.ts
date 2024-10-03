import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

export const VersionUrlSchema = z.object({
  version: z.string().refine((val) => val === '2.0', {
    message: 'Version must be 2.0',
  }),
  base_url: z.string().regex(/^\/[a-zA-Z0-9\/]*$/, {
    message: 'base_url must be a valid URL path starting with /',
  }),
});

export class VersionUrlDto extends createZodDto(VersionUrlSchema) {}
