import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { DateTime } from 'luxon';

const HistoryDataQuerySchema = z.object({
  start_date: z
    .string()
    .refine((date) => DateTime.fromISO(date, { zone: 'utc' }).isValid, {
      message: 'Invalid date format, expected ISO 8601',
    })
    .transform((dateString) =>
      DateTime.fromISO(dateString, { zone: 'utc' }).toJSDate(),
    ),
  end_date: z
    .string()
    .refine((date) => DateTime.fromISO(date, { zone: 'utc' }).isValid, {
      message: 'Invalid date format, expected ISO 8601',
    })
    .transform((dateString) =>
      DateTime.fromISO(dateString, { zone: 'utc' }).toJSDate(),
    ),
});

export class HistoryDataQueryDto extends createZodDto(HistoryDataQuerySchema) {}

const TransformerFifteenMinuteHistoryDataSchema = z.object({
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

const TransformerOneHourHistoryDataSchema =
  TransformerFifteenMinuteHistoryDataSchema;

const TransformerOneDayHistoryDataSchema = z.object({
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

const ChargingStationFifteenMinuteHistoryDataSchema = z.object({
  time_mark: z.string(),
  kw: z.number(),
});

const ChargingStationOneHourHistoryDataSchema =
  ChargingStationFifteenMinuteHistoryDataSchema;

const ChargingStationOneDayHistoryDataSchema = z.object({
  time_mark: z.string(),
  kwh: z.number(),
  life_kwh_total: z.number(),
});

const LoadSiteFifteenMinuteHistoryDataSchema = z.object({
  time_mark: z.string(),
  total_load_kw: z.number().nullable(),
  charge_load_kw: z.number().nullable(),
  demand_load_kw: z.number().nullable(),
});

const LoadSiteOneHourHistoryDataSchema = LoadSiteFifteenMinuteHistoryDataSchema;

const LoadSiteOneDayHistoryDataSchema = z.object({
  time_mark: z.string(),
  total_load_kwh: z.number(),
  charge_load_kwh: z.number(),
  demand_load_kwh: z.number(),
});

const FeedLineFifteenMinuteHistoryDataSchema = z.object({
  time_mark: z.string(),
  total_load_kw: z.number().nullable(),
  charge_load_kw: z.number().nullable(),
  demand_load_kw: z.number().nullable(),
});

const FeedLineOneHourHistoryDataSchema = FeedLineFifteenMinuteHistoryDataSchema;

const FeedLineOneDayHistoryDataSchema = z.object({
  time_mark: z.string(),
  total_load_kwh: z.number(),
  charge_load_kwh: z.number(),
  demand_load_kwh: z.number(),
});

const HistoryDataSchema = z.object({
  data: z.union([
    z.array(TransformerFifteenMinuteHistoryDataSchema),
    z.array(TransformerOneHourHistoryDataSchema),
    z.array(TransformerOneDayHistoryDataSchema),
    z.array(ChargingStationFifteenMinuteHistoryDataSchema),
    z.array(ChargingStationOneHourHistoryDataSchema),
    z.array(ChargingStationOneDayHistoryDataSchema),
    z.array(LoadSiteFifteenMinuteHistoryDataSchema),
    z.array(LoadSiteOneHourHistoryDataSchema),
    z.array(LoadSiteOneDayHistoryDataSchema),
    z.array(FeedLineFifteenMinuteHistoryDataSchema),
    z.array(FeedLineOneHourHistoryDataSchema),
    z.array(FeedLineOneDayHistoryDataSchema),
  ]),
});

export class HistoryDataDto extends createZodDto(HistoryDataSchema) {}
