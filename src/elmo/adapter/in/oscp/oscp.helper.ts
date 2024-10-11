import { DateTime } from 'luxon';
import { AvailableCapacityNegotiationHourCapacity } from '../../out/entities/available-capacity-negotiation-detail.entity';
import { ForecastedBlockDto } from './dto/forecasted-block.dto';
import { TAIPEI_TZ } from '../../../../constants';

export function transformNegotiationForecastedBlocksToHourCapacities(
  blocks: ForecastedBlockDto[],
): AvailableCapacityNegotiationHourCapacity[] {
  return blocks.map((fb) => ({
    hour: DateTime.fromISO(fb.start_time).setZone(TAIPEI_TZ).hour,
    capacity: fb.capacity,
  }));
}
