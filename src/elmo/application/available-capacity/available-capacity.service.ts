import { Injectable } from '@nestjs/common';
import { AvailableCapacityNegotiationService } from './available-capacity-negotiation.service';
import { AvailableCapacityEmergencyService } from './available-capacity-emergency.service';
import { ChargingStationService } from '../charging-station/charging-station.service';

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
  ): Promise<number | null> {
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
}
