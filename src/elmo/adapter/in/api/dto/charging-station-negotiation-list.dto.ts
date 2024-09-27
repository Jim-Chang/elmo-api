import { z } from 'zod';
import { NegotiationStatus } from '../../../../application/available-capacity/types';
import { createZodDto } from '@anatine/zod-nestjs';
import { DateTime } from 'luxon';
import { TAIPEI_TZ } from '../../../../../constants';

function checkDateQueryParam(date: string) {
  const parsedDate = DateTime.fromFormat(date, 'yyyy-MM-dd', {
    zone: TAIPEI_TZ,
  });
  const tomorrow = DateTime.now()
    .setZone(TAIPEI_TZ)
    .plus({ days: 1 })
    .startOf('day');
  return parsedDate.isValid && parsedDate <= tomorrow;
}

const ChargingStationNegotiationListQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(checkDateQueryParam, {
      message:
        'Date must be in YYYY-MM-DD format and not later than tomorrow in Taipei timezone',
    }),
  district_id: z.preprocess(
    (val) => (val !== undefined ? Number(val) : val),
    z.number().optional(),
  ),
  feed_line_id: z.preprocess(
    (val) => (val !== undefined ? Number(val) : val),
    z.number().optional(),
  ),
  load_site_id: z.preprocess(
    (val) => (val !== undefined ? Number(val) : val),
    z.number().optional(),
  ),
  negotiation_status: z.preprocess(
    (val) => {
      if (val === undefined) {
        return [];
      } else {
        return Array.isArray(val) ? val : [val];
      }
    },
    z.array(z.nativeEnum(NegotiationStatus)).optional(),
  ),
  keyword: z.string().optional(),
});

export class ChargingStationNegotiationListQueryDto extends createZodDto(
  ChargingStationNegotiationListQuerySchema,
) {}

const ChargingStationNegotiationDashboardItemDataSchema = z.object({
  negotiation_id: z.number(),
  feed_line: z.string(),
  electricity_account_no: z.string(),
  charging_station_name: z.string(),
  load_site_name: z.string(),
  negotiation_status: z.nativeEnum(NegotiationStatus).nullable(),
});

const ChargingStationNegotiationListDataSchema = z.object({
  items: z.array(ChargingStationNegotiationDashboardItemDataSchema),
});

export class ChargingStationNegotiationListDataDto extends createZodDto(
  ChargingStationNegotiationListDataSchema,
) {}
