import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ForecastedBlockSchema } from './forecasted-block.dto';

export const GroupCapacityComplianceErrorSchema = z.object({
  message: z.string().min(1),
  forecasted_blocks: z.array(ForecastedBlockSchema).optional(),
});

export class GroupCapacityComplianceErrorDto extends createZodDto(
  GroupCapacityComplianceErrorSchema,
) {}
