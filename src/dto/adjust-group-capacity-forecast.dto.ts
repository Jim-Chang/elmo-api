import { z } from 'zod';
import {
  ForecastedBlockDto,
  ForecastedBlockSchema,
} from './forecasted-block.dto';
import { createZodDto } from '@anatine/zod-nestjs';
import { CapacityForecastType } from './enums';
import dayjs from 'dayjs';

const FORECASTED_BLOCKS_COUNT = 24;

const AdjustGroupCapacityForecastSchema = z.object({
  group_id: z.string(),
  type: z.nativeEnum(CapacityForecastType),
  forecasted_blocks: z
    .array(ForecastedBlockSchema)
    .min(FORECASTED_BLOCKS_COUNT)
    .refine(validateForecastedBlocks, {
      message:
        'Forecasted blocks must be 24 consecutive hourly blocks starting from the same day',
    }),
});

export class AdjustGroupCapacityForecastDto extends createZodDto(
  AdjustGroupCapacityForecastSchema,
) {}

function validateForecastedBlocks(blocks: ForecastedBlockDto[]) {
  if (blocks.length !== FORECASTED_BLOCKS_COUNT) {
    return false;
  }

  const firstBlockStartTime = dayjs(blocks[0].start_time).startOf('day');

  for (let i = 0; i < FORECASTED_BLOCKS_COUNT; i++) {
    const block = blocks[i];
    const startTime = dayjs(block.start_time);
    const endTime = dayjs(block.end_time);

    // Check if the start and end times are on the same day as the first block
    if (i < FORECASTED_BLOCKS_COUNT - 1) {
      if (
        !startTime.isSame(firstBlockStartTime, 'day') ||
        !endTime.isSame(firstBlockStartTime, 'day')
      ) {
        return false;
      }
    } else {
      // For the last block, the end time should be on the next day
      if (
        !startTime.isSame(firstBlockStartTime, 'day') ||
        !endTime.isSame(firstBlockStartTime.add(1, 'day'), 'day')
      ) {
        return false;
      }
    }

    // Check if the block times are consecutive and cover a full hour
    if (i > 0 && !startTime.isSame(blocks[i - 1].end_time)) {
      return false;
    }

    if (endTime.diff(startTime, 'hour') !== 1) {
      return false;
    }
  }

  return true;
}
