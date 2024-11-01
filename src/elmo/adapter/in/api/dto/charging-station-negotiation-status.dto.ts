import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';
import {
  NegotiationStatus,
  NegotiationWithEmergencyStatus,
} from '../../../../application/available-capacity/types';

const ChargingStationNegotiationStatusDataSchema = z.object({
  today_status: z.nativeEnum(NegotiationWithEmergencyStatus).nullable(),
  tomorrow_status: z.nativeEnum(NegotiationStatus).nullable(),
});

export class ChargingStationNegotiationStatusDataDto extends createZodDto(
  ChargingStationNegotiationStatusDataSchema,
) {}
