import { Injectable } from '@nestjs/common';
import { AvailableCapacityNegotiationService } from './available-capacity-negotiation.service';
import { AvailableCapacityEmergencyService } from './available-capacity-emergency.service';
import { ChargingStationService } from '../charging-station/charging-station.service';
import { DateTime } from 'luxon';

@Injectable()
export class AvailableCapacityService {
  constructor(
    private readonly chargingStationService: ChargingStationService,
    private readonly negotiationService: AvailableCapacityNegotiationService,
    private readonly emergencyService: AvailableCapacityEmergencyService,
  ) {}

  async getAvailableCapacityByDateTime(
    chargingStationId: number,
    dateTime: Date,
  ): Promise<number> {
    // Get contract capacity
    let capacity =
      await this.chargingStationService.getContractCapacityById(
        chargingStationId,
      );

    // Compare with negotiation capacity
    const negotiationCapacity =
      await this.negotiationService.getNegotiationCapacityByDateTime(
        chargingStationId,
        dateTime,
      );
    if (negotiationCapacity !== null && negotiationCapacity < capacity) {
      capacity = negotiationCapacity;
    }

    // Compare with emergency capacity
    const emergencyCapacity =
      await this.emergencyService.getEmergencyCapacityByDateTime(
        chargingStationId,
        dateTime,
      );
    if (emergencyCapacity !== null && emergencyCapacity < capacity) {
      capacity = emergencyCapacity;
    }

    return capacity;
  }

  async getAvailableCapacitiesByDateRangeInFifteenMinuteInterval(
    chargingStationId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<
    { datetime: Date; availableCapacity: number; isInEmergency: boolean }[]
  > {
    const start = DateTime.fromJSDate(startDate);
    if (start.minute !== 0) {
      throw new Error('startDate minutes must be 0');
    }

    const end = DateTime.fromJSDate(endDate);
    const intervalDuration = { minutes: 15 };

    // Query all capacities and emergencies within the date range
    const [negotiationCapacities, emergencyCapacities] = await Promise.all([
      this.negotiationService.getNegotiationCapacitiesByDateRange(
        chargingStationId,
        startDate,
        endDate,
      ),
      this.emergencyService.getEmergencyCapacitiesByDateRange(
        chargingStationId,
        startDate,
        endDate,
      ),
    ]);

    const results = [];
    for (
      let current = start;
      current <= end;
      current = current.plus(intervalDuration)
    ) {
      const { availableCapacity, isInEmergency } =
        this.calculateAvailableCapacityAndIsInEmergency(
          current.toJSDate(),
          negotiationCapacities,
          emergencyCapacities,
        );
      results.push({
        datetime: current.toJSDate(),
        availableCapacity,
        isInEmergency,
      });
    }

    return results;
  }

  async getAvailableCapacitiesByDateRangeInOneHourInterval(
    chargingStationId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<{ datetime: Date; availableCapacity: number }[]> {
    const results =
      await this.getAvailableCapacitiesByDateRangeInFifteenMinuteInterval(
        chargingStationId,
        startDate,
        endDate,
      );

    const aggregatedResults = [];
    for (let i = 0; i < results.length; i += 4) {
      const hourBlock = results.slice(i, i + 4);
      const minCapacity = Math.min(
        ...hourBlock.map((r) => r.availableCapacity),
      );
      aggregatedResults.push({
        datetime: hourBlock[0].datetime,
        availableCapacity: minCapacity,
      });
    }
    return aggregatedResults;
  }

  private calculateAvailableCapacityAndIsInEmergency(
    dateTime: Date,
    negotiationCapacities: { dateTime: Date; capacity: number }[],
    emergencyCapacities: { dateTime: Date; capacity: number }[],
  ): { availableCapacity: number; isInEmergency: boolean } {
    let availableCapacity = Infinity;
    let isInEmergency = false;

    // Compare with negotiation capacities
    const negotiationCapacity = findCapacity(
      dateTime,
      negotiationCapacities,
      (current, next) =>
        current.dateTime <= dateTime && (!next || dateTime < next.dateTime),
    );
    if (negotiationCapacity && negotiationCapacity < availableCapacity) {
      availableCapacity = negotiationCapacity;
    }

    // Compare with emergency capacities
    const emergencyCapacity = findCapacity(
      dateTime,
      emergencyCapacities,
      (current, next) =>
        current.dateTime <= dateTime && (!next || dateTime < next.dateTime),
    );
    if (emergencyCapacity && emergencyCapacity < availableCapacity) {
      availableCapacity = emergencyCapacity;
      isInEmergency = true;
    }

    if (availableCapacity === Infinity) {
      availableCapacity = 0;
    }

    return { availableCapacity, isInEmergency };
  }
}

function findCapacity(
  targetDatetime: Date,
  capacities: { dateTime: Date; capacity: number }[],
  conditionCallback: (
    current: { dateTime: Date; capacity: number },
    next: { dateTime: Date; capacity: number } | undefined,
  ) => boolean,
): number | null {
  let left = 0;
  let right = capacities.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const current = capacities[mid];
    const next = capacities[mid + 1];

    if (conditionCallback(current, next)) {
      return current.capacity;
    }

    if (current.dateTime > targetDatetime) {
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }

  return null;
}
