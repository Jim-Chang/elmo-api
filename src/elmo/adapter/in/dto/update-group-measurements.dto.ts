import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';
import { EnergyMeasurementSchema } from './energy-measurement.dto';

const UpdateGroupMeasurementsSchema = z.object({
  group_id: z.string().min(1, 'Required'),
  measurements: z
    .array(EnergyMeasurementSchema)
    .min(1, 'Should have at least one item'),
});

export class UpdateGroupMeasurementsDto extends createZodDto(
  UpdateGroupMeasurementsSchema,
) {}
