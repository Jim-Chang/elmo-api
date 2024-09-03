import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

export enum PhaseIndicator {
  Unknown = 'UNKNOWN',
  One = 'ONE',
  Two = 'TWO',
  Three = 'THREE',
  All = 'ALL',
}

export enum ForecastedBlockUnit {
  A = 'A',
  W = 'W',
  Kw = 'KW',
  Wh = 'WH',
  Kwh = 'KWH',
}

export const ForecastedBlockSchema = z.object({
  capacity: z.number().min(0),
  phase: z.nativeEnum(PhaseIndicator),
  unit: z.nativeEnum(ForecastedBlockUnit),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
});

export class ForecastedBlockDto extends createZodDto(ForecastedBlockSchema) {}
