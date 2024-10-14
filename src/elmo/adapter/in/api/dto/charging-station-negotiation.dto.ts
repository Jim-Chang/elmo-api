import { z } from 'zod';
import {
  NegotiationStatus,
  NegotiationWithEmergencyStatus,
} from '../../../../application/available-capacity/types';
import { createZodDto } from '@anatine/zod-nestjs';

const AvailableCapacityNegotiationHourCapacitySchema = z.object({
  hour: z.number().int().min(0).max(23),
  capacity: z.number().positive(),
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

const ChargingStationNegotiationEmergencyDataSchema = z.object({
  id: z.number(),
  period_start_at: z.date(),
  period_end_at: z.date(),
  capacity: z.number(),
  is_success_sent: z.boolean(),
  created_at: z.date(),
});

export class ChargingStationNegotiationEmergencyDto extends createZodDto(
  ChargingStationNegotiationEmergencyDataSchema,
) {}

const ChargingStationNegotiationDataSchema = z.object({
  charging_station: ChargingStationSchema,
  negotiation_id: z.number(),
  date: z.date(),
  initial_detail: ChargingStationNegotiationDetailDataSchema,
  initial_edit_detail: ChargingStationNegotiationDetailDataSchema,
  request_detail: ChargingStationNegotiationDetailDataSchema.nullable(),
  reply_edit_detail: ChargingStationNegotiationDetailDataSchema.nullable(),
  reply_detail: ChargingStationNegotiationDetailDataSchema.nullable(),
  apply_detail: ChargingStationNegotiationDetailDataSchema.nullable(),
  last_status: z.nativeEnum(NegotiationWithEmergencyStatus),
  last_emergency: ChargingStationNegotiationEmergencyDataSchema.nullable(),
});

export class ChargingStationNegotiationDto extends createZodDto(
  ChargingStationNegotiationDataSchema,
) {}

const ChargingStationNegotiationPostDataSchema = z.object({
  negotiation_id: z.number(),
  hour_capacities: z
    .array(AvailableCapacityNegotiationHourCapacitySchema)
    .refine(
      (hourCapacities) => {
        const hours = hourCapacities.map((item) => item.hour);
        return (
          hours.length === 24 && hours.every((hour, index) => hour === index)
        );
      },
      {
        message:
          'hour_capacities must contain each hour from 0 to 23 exactly once',
      },
    ),
});

export class ChargingStationNegotiationPostDataDto extends createZodDto(
  ChargingStationNegotiationPostDataSchema,
) {}

const ChargingStationNegotiationConfirmPostDataSchema = z.object({
  negotiation_id: z.number(),
});

export class ChargingStationNegotiationConfirmPostDataDto extends createZodDto(
  ChargingStationNegotiationConfirmPostDataSchema,
) {}
