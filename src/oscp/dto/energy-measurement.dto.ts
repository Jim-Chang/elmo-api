import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';
import {
  EnergyFlowDirection,
  EnergyMeasurementUnit,
  EnergyType,
  PhaseIndicator,
} from './enums';

export const EnergyMeasurementSchema = z.object({
  value: z.number().min(0, 'Must be greater than or equal to 0'),
  phase: z.nativeEnum(PhaseIndicator),
  unit: z.nativeEnum(EnergyMeasurementUnit),
  energy_type: z.nativeEnum(EnergyType).optional(),
  direction: z.nativeEnum(EnergyFlowDirection),
  measure_time: z.string().datetime({ offset: true }),
  initial_measure_time: z.string().datetime({ offset: true }).optional(),
});

export class EnergyMeasurementDto extends createZodDto(
  EnergyMeasurementSchema,
) {}
