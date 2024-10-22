import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';

const ChargingStationRealTimeDataSchema = z.object({
  uid: z.string(),
  time_mark: z.string().nullable(),
  kw: z.number().nullable(),
  available_capacity: z.number().nullable(),
});

export class ChargingStationRealTimeDataDto extends createZodDto(
  ChargingStationRealTimeDataSchema,
) {}
