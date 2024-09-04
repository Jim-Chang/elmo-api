import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

export enum MeasurementConfiguration {
  Continuous = 'CONTINUOUS',
  Intermittent = 'INTERMITTENT',
}

export const RequiredBehaviourSchema = z.object({
  heartbeat_interval: z.number().optional(),
  measurement_configuration: z.array(z.nativeEnum(MeasurementConfiguration)),
});

export class RequiredBehaviourDto extends createZodDto(
  RequiredBehaviourSchema,
) {}
