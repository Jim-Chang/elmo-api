import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { MeasurementConfiguration } from './enums';

export const RequiredBehaviourSchema = z.object({
  heartbeat_interval: z.number().optional(),
  measurement_configuration: z.array(z.nativeEnum(MeasurementConfiguration)),
});

export class RequiredBehaviourDto extends createZodDto(
  RequiredBehaviourSchema,
) {}
