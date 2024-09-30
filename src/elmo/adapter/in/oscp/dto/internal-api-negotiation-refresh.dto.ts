import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';
import { NegotiationStatus } from '../../../../application/available-capacity/types';

const InternalApiNegotiationRefreshSchema = z.object({
  chargingStationUid: z.string(),
  date: z.string().datetime({ offset: true }),
  targetStatus: z.nativeEnum(NegotiationStatus),
  detailData: z.object({
    [NegotiationStatus.INITIAL_EDIT]: z.object({}).optional(),
    [NegotiationStatus.NEGOTIATING]: z.object({}).optional(),
    [NegotiationStatus.NEGOTIATING_FAILED]: z.object({}).optional(),
    [NegotiationStatus.EXTRA_REQUEST]: z.object({}).optional(),
    [NegotiationStatus.EXTRA_REPLY_EDIT]: z.object({}).optional(),
    [NegotiationStatus.EXTRA_REPLY_FINISH]: z.object({}).optional(),
    [NegotiationStatus.EXTRA_REPLY_AUTO]: z.object({}).optional(),
    [NegotiationStatus.EXTRA_REPLY_FAILED]: z.object({}).optional(),
    [NegotiationStatus.FINISH]: z.object({}).optional(),
  }),
});

export class InternalApiNegotiationRefreshDto extends createZodDto(
  InternalApiNegotiationRefreshSchema,
) {}
