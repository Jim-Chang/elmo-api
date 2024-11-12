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
});

const TransformerOneHourHistoryDataSchema =
  TransformerFifteenMinuteHistoryDataSchema;

const TransformerOneDayHistoryDataSchema = z.object({
  time_mark: z.string(),
  ac_power_meter_input_kwh_today: z.number().nullable(),
  ac_power_meter_input_kvarh_today: z.number().nullable(),
  ac_power_meter_input_kvah_today: z.number().nullable(),
  ac_power_meter_output_kwh: z.number().nullable(),
  ac_power_meter_output_kvarh: z.number().nullable(),
  ac_power_meter_output_kvah: z.number().nullable(),
  ac_power_meter_input_kwh: z.number().nullable(),
  ac_power_meter_input_kvarh: z.number().nullable(),
  ac_power_meter_input_kvah: z.number().nullable(),
});

const ChargingStationFifteenMinuteHistoryDataSchema = z.object({
  time_mark: z.string(),
  kw: z.number().nullable(),
  available_capacity: z.number(),
  contract_capacity: z.number(),
  is_in_emergency: z.number().nullable(),
});

const ChargingStationOneHourHistoryDataSchema = z.object({
  time_mark: z.string(),
  kw: z.number().nullable(),
  available_capacity: z.number(),
  contract_capacity: z.number(),
});

const ChargingStationOneDayHistoryDataSchema = z.object({
  time_mark: z.string(),
  kwh: z.number().nullable(),
  life_kwh_total: z.number().nullable(),
});

const LoadSiteFifteenMinuteHistoryDataSchema = z.object({
  time_mark: z.string(),
  total_load_kw: z.number().nullable(),
  charge_load_kw: z.number().nullable(),
  demand_load_kw: z.number().nullable(),
  available_capacity: z.number(),
  contract_capacity: z.number(),
  is_in_emergency: z.number().nullable(),
});

const LoadSiteOneHourHistoryDataSchema = z.object({
  time_mark: z.string(),
  total_load_kw: z.number().nullable(),
  charge_load_kw: z.number().nullable(),
  demand_load_kw: z.number().nullable(),
  available_capacity: z.number(),
  contract_capacity: z.number(),
});

const LoadSiteOneDayHistoryDataSchema = z.object({
  time_mark: z.string(),
  total_load_kwh: z.number().nullable(),
  charge_load_kwh: z.number().nullable(),
  demand_load_kwh: z.number().nullable(),
});

const FeederFifteenMinuteHistoryDataSchema = z.object({
  time_mark: z.string(),
  total_load_kw: z.number().nullable(),
  charge_load_kw: z.number().nullable(),
  demand_load_kw: z.number().nullable(),
});

const FeederOneHourHistoryDataSchema = FeederFifteenMinuteHistoryDataSchema;

const FeederOneDayHistoryDataSchema = z.object({
  time_mark: z.string(),
  total_load_kwh: z.number().nullable(),
  charge_load_kwh: z.number().nullable(),
  demand_load_kwh: z.number().nullable(),
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
    z.array(FeederFifteenMinuteHistoryDataSchema),
    z.array(FeederOneHourHistoryDataSchema),
    z.array(FeederOneDayHistoryDataSchema),
  ]),
});

export class HistoryDataDto extends createZodDto(HistoryDataSchema) {}
