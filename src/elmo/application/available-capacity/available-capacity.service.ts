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
    for (let i = 0; i < negotiationCapacities.length; i++) {
      const negotiation = negotiationCapacities[i];
      const nextNegotiation = negotiationCapacities[i + 1];

      if (
        negotiation.dateTime <= dateTime &&
        (!nextNegotiation || dateTime < nextNegotiation.dateTime) &&
        negotiation.capacity < availableCapacity
      ) {
        availableCapacity = negotiation.capacity;
        break;
      }
    }
    // Compare with emergency capacities
    for (let i = 0; i < emergencyCapacities.length; i++) {
      const emergency = emergencyCapacities[i];
      const nextEmergency = emergencyCapacities[i + 1];

      if (
        emergency.dateTime <= dateTime &&
        (!nextEmergency || dateTime < nextEmergency.dateTime) &&
        emergency.capacity !== null &&
        emergency.capacity < availableCapacity
      ) {
        availableCapacity = emergency.capacity;
        isInEmergency = true;
        break;
      }
    }

    if (availableCapacity === Infinity) {
      availableCapacity = 0;
    }

    return { availableCapacity, isInEmergency };
  }
}
