import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { OSCP_API_VERSION } from '../../../../../constants';

export const VersionUrlSchema = z.object({
  version: z.string().refine((val) => val === OSCP_API_VERSION, {
    message: 'Version must be 2.0',
  }),
  base_url: z.string().regex(/^https:\/\/[a-zA-Z0-9./-]*[^/]$/, {
    message:
      'base_url must be a valid URL starting with https:// and must not end with /',
  }),
});

export class VersionUrlDto extends createZodDto(VersionUrlSchema) {}
