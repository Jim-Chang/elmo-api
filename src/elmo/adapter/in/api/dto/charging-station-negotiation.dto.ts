import { z } from 'zod';
import { NegotiationStatus } from '../../../../application/available-capacity/types';
import { createZodDto } from '@anatine/zod-nestjs';

const AvailableCapacityNegotiationHourCapacitySchema = z.object({
  hour: z.number(),
  capacity: z.number(),
});

const ChargingStationSchema = z.object({
  name: z.string(),
  contract_capacity: z.number(),
});

const ChargingStationNegotiationDataSchema = z.object({
  charging_station: ChargingStationSchema,
  negotiation_id: z.number(),
  date: z.date(),
  status: z.nativeEnum(NegotiationStatus),
  hour_capacities: z.array(AvailableCapacityNegotiationHourCapacitySchema),
});

export class ChargingStationNegotiationDto extends createZodDto(
  ChargingStationNegotiationDataSchema,
) {}
