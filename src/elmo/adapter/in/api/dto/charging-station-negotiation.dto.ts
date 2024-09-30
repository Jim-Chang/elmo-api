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

const ChargingStationNegotiationDetailDataSchema = z.object({
  id: z.number(),
  status: z.nativeEnum(NegotiationStatus),
  hour_capacities: z.array(AvailableCapacityNegotiationHourCapacitySchema),
  created_at: z.date(),
});

export class ChargingStationNegotiationDetailDto extends createZodDto(
  ChargingStationNegotiationDetailDataSchema,
) {}

const ChargingStationNegotiationDataSchema = z.object({
  charging_station: ChargingStationSchema,
  negotiation_id: z.number(),
  date: z.date(),
  initial_detail: ChargingStationNegotiationDetailDataSchema,
  request_detail: ChargingStationNegotiationDetailDataSchema.nullable(),
  reply_detail: ChargingStationNegotiationDetailDataSchema.nullable(),
  last_status: z.nativeEnum(NegotiationStatus),
});

export class ChargingStationNegotiationDto extends createZodDto(
  ChargingStationNegotiationDataSchema,
) {}
