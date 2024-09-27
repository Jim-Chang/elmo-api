import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

const CreateAndSendEmergencySchema = z.object({
  chargingStationId: z.number().int().positive(),
  periodStartAt: z.string().datetime({ offset: true }),
  periodEndAt: z.string().datetime({ offset: true }),
  capacity: z.number().int().positive(),
});

export class CreateAndSendEmergencyDto extends createZodDto(
  CreateAndSendEmergencySchema,
) {}
