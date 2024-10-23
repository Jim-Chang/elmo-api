import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { DateTime } from 'luxon';

const HistoryDataQuerySchema = z.object({
  startDate: z
    .string()
    .refine((date) => DateTime.fromISO(date, { zone: 'utc' }).isValid, {
      message: 'Invalid date format, expected ISO 8601',
    })
    .transform((dateString) =>
      DateTime.fromISO(dateString, { zone: 'utc' }).toJSDate(),
    ),
  endDate: z
    .string()
    .refine((date) => DateTime.fromISO(date, { zone: 'utc' }).isValid, {
      message: 'Invalid date format, expected ISO 8601',
    })
    .transform((dateString) =>
      DateTime.fromISO(dateString, { zone: 'utc' }).toJSDate(),
    ),
});

export class HistoryDataQueryDto extends createZodDto(HistoryDataQuerySchema) {}

const TransformerFifteenMinuteESRawDataSchema = z.object({
  transformer_id: z.string(),
  time_mark: z.string(),
  ac_power_meter_output_kw: z.number(),
  ac_power_meter_output_kvar: z.number(),
  ac_power_meter_output_kva: z.number(),
  ac_power_meter_output_pf: z.number(),
  ac_power_meter_freq: z.number(),
  ac_power_meter_line_amps_a: z.number(),
  ac_power_meter_line_amps_b: z.number(),
  ac_power_meter_line_amps_c: z.number(),
  ac_power_meter_line_volts_a_b: z.number(),
  ac_power_meter_line_volts_b_c: z.number(),
  ac_power_meter_line_volts_c_a: z.number(),
});

const TransformerOneHourESRawDataSchema =
  TransformerFifteenMinuteESRawDataSchema;

const TransformerOneDayESRawDataSchema = z.object({
  transformer_id: z.string(),
  time_mark: z.string(),
  ac_power_meter_kwh: z.number(),
  ac_power_meter_kvarh: z.number(),
  ac_power_meter_kvah: z.number(),
  ac_power_meter_output_kwh: z.number(),
  ac_power_meter_output_kvarh: z.number(),
  ac_power_meter_output_kvah: z.number(),
  ac_power_meter_input_kwh: z.number(),
  ac_power_meter_input_kvarh: z.number(),
  ac_power_meter_input_kvah: z.number(),
});

const HistoryDateSchema = z.object({
  data: z.union([
    z.array(TransformerFifteenMinuteESRawDataSchema),
    z.array(TransformerOneHourESRawDataSchema),
    z.array(TransformerOneDayESRawDataSchema),
  ]),
});

export class HistoryDataDto extends createZodDto(HistoryDateSchema) {}
