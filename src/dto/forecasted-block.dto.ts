import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ForecastedBlockUnit, PhaseIndicator } from './enums';

export const ForecastedBlockSchema = z.object({
  capacity: z.number().min(0),
  phase: z.nativeEnum(PhaseIndicator),
  unit: z.nativeEnum(ForecastedBlockUnit),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
});

export class ForecastedBlockDto extends createZodDto(ForecastedBlockSchema) {}
