import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';

const LoadSiteUidMappingSchema = z.record(
  z.string().min(1),
  z.object({
    transformer: z.array(z.string().min(1)),
    charging_station: z.array(z.string().min(1)),
  }),
);

export class LoadSiteUidMappingDto extends createZodDto(
  LoadSiteUidMappingSchema,
) {}
