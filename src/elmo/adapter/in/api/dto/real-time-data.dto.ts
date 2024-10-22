import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';

const ChargingStationRealTimeDataSchema = z.object({
  uid: z.string(),
  time_mark: z.string().nullable(),
  kw: z.number().nullable(),
  available_capacity: z.number().nullable(),
});

export class ChargingStationRealTimeDataDto extends createZodDto(
  ChargingStationRealTimeDataSchema,
) {}

const TransformerRealTimeDataSchema = z.object({
  uid: z.string(),
  time_mark: z.string().nullable(),

  ac_power_meter_output_kw: z.number().nullable(),
  ac_power_meter_output_kvar: z.number().nullable(),
  ac_power_meter_output_kva: z.number().nullable(),
  ac_power_meter_output_pf: z.number().nullable(),
  ac_power_meter_freq: z.number().nullable(),

  ac_power_meter_line_amps_a: z.number().nullable(),
  ac_power_meter_line_amps_b: z.number().nullable(),
  ac_power_meter_line_amps_c: z.number().nullable(),

  ac_power_meter_line_volts_a_b: z.number().nullable(),
  ac_power_meter_line_volts_b_c: z.number().nullable(),
  ac_power_meter_line_volts_c_a: z.number().nullable(),

  ac_power_meter_output_kwh: z.number().nullable(),
  ac_power_meter_output_kvarh: z.number().nullable(),
  ac_power_meter_output_kvah: z.number().nullable(),

  ac_power_meter_input_kwh: z.number().nullable(),
  ac_power_meter_input_kvarh: z.number().nullable(),
  ac_power_meter_input_kvah: z.number().nullable(),
});

export class TransformerRealTimeDataDto extends createZodDto(
  TransformerRealTimeDataSchema,
) {}
