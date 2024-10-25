import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';

const FeedLineDataSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const ChargingStationDataSchema = z.object({
  id: z.number(),
  uid: z.string(),
  name: z.string(),
  contract_capacity: z.number(),
});

const TransformerDataSchema = z.object({
  id: z.number(),
  uid: z.string(),
  tpclid: z.string(),
  group: z.string(),
  capacity: z.number(),
  voltage_level: z.number(),
});

const LoadSiteDetailDataSchema = z.object({
  load_site_id: z.number(),
  load_site_name: z.string(),
  load_site_address: z.string().nullable(),
  feed_line: FeedLineDataSchema.nullable(),
  charging_stations: z.array(ChargingStationDataSchema),
  transformers: z.array(TransformerDataSchema),
});

export class LoadSiteDetailDataDto extends createZodDto(
  LoadSiteDetailDataSchema,
) {}
