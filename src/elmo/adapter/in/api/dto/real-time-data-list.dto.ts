import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';

const RealTimeDataListQuerySchema = z.object({
  district_id: z.preprocess(
    (val) => (val !== undefined ? Number(val) : val),
    z.number().optional(),
  ),
  feeder_id: z.preprocess(
    (val) => (val !== undefined ? Number(val) : val),
    z.number().optional(),
  ),
  keyword: z.string().optional(),
});

export class RealTimeDataListQueryDto extends createZodDto(
  RealTimeDataListQuerySchema,
) {}

const RealTimeDataListItemDataSchema = z.object({
  load_site_id: z.number(),
  load_site_name: z.string(),
  feeder_name: z.string().nullable(),
  total_load: z.number().nullable(),
  demand_load: z.number().nullable(),
  charge_load: z.number().nullable(),
  charge_load_percentage: z.number().nullable(),
  available_capacity: z.number().nullable(),
  updated_at: z.string().nullable(),
});

const RealTimeDataListDataSchema = z.object({
  items: z.array(RealTimeDataListItemDataSchema),
});

export class LoadSiteRealTimeDataListDataDto extends createZodDto(
  RealTimeDataListDataSchema,
) {}
