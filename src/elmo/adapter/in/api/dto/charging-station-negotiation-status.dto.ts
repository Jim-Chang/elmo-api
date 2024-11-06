import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';
import { NegotiationWithEmergencyStatus } from '../../../../application/available-capacity/types';

const ChargingStationNegotiationStatusDataSchema = z.object({
  today_status: z.nativeEnum(NegotiationWithEmergencyStatus).nullable(),
  tomorrow_status: z.nativeEnum(NegotiationWithEmergencyStatus).nullable(),
});

export class ChargingStationNegotiationStatusDataDto extends createZodDto(
  ChargingStationNegotiationStatusDataSchema,
) {}
