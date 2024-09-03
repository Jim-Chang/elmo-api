import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

export const VersionUrlSchema = z.object({
  version: z.string().refine((val) => val === '2.0', {
    message: 'Version must be 2.0',
  }),
  base_url: z.string(),
});

export class VersionUrlDto extends createZodDto(VersionUrlSchema) {}
