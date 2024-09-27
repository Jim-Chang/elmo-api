import { z } from 'zod';
import {
  ForecastedBlockDto,
  ForecastedBlockSchema,
} from './forecasted-block.dto';
import { createZodDto } from '@anatine/zod-nestjs';
import { CapacityForecastType } from './enums';
import { DateTime } from 'luxon';
import { TAIPEI_TZ } from '../../../../../constants';

const FORECASTED_BLOCKS_COUNT = 24;

const AdjustGroupCapacityForecastSchema = z.object({
  group_id: z.string(),
  type: z.nativeEnum(CapacityForecastType),
  forecasted_blocks: z
    .array(ForecastedBlockSchema)
    .min(FORECASTED_BLOCKS_COUNT)
    .refine(validateForecastedBlocks, {
      message:
        'Must be 24 consecutive hourly blocks starting from the same day',
    }),
});

export class AdjustGroupCapacityForecastDto extends createZodDto(
  AdjustGroupCapacityForecastSchema,
) {}

function validateForecastedBlocks(blocks: ForecastedBlockDto[]) {
  if (blocks.length !== FORECASTED_BLOCKS_COUNT) {
    return false;
  }

  const firstBlockStartTime = DateTime.fromISO(blocks[0].start_time)
    .setZone(TAIPEI_TZ)
    .startOf('day');

  for (let i = 0; i < FORECASTED_BLOCKS_COUNT; i++) {
    const block = blocks[i];
    const startTime = DateTime.fromISO(block.start_time).setZone(TAIPEI_TZ);
    const endTime = DateTime.fromISO(block.end_time).setZone(TAIPEI_TZ);

    // Check if the start and end times are on the same day as the first block
    if (i < FORECASTED_BLOCKS_COUNT - 1) {
      if (
        !startTime.hasSame(firstBlockStartTime, 'day') ||
        !endTime.hasSame(firstBlockStartTime, 'day')
      ) {
        return false;
      }
    } else {
      // For the last block, the end time should be on the next day
      if (
        !startTime.hasSame(firstBlockStartTime, 'day') ||
        !endTime.hasSame(firstBlockStartTime.plus({ days: 1 }), 'day')
      ) {
        return false;
      }
    }

    // Check if the block times are consecutive and cover a full hour
    if (i > 0) {
      const lastEndTime = DateTime.fromISO(blocks[i - 1].end_time).setZone(
        TAIPEI_TZ,
      );
      if (!startTime.equals(lastEndTime)) {
        return false;
      }
    }

    if (endTime.diff(startTime, 'hours').hours !== 1) {
      return false;
    }
  }

  return true;
}
