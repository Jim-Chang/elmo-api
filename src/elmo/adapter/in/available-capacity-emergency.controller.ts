import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { DateTime } from 'luxon';
import { API_PREFIX } from '../../../constants';
import { AvailableCapacityEmergencyService } from '../../application/available-capacity/available-capacity-emergency.service';
import { ChargingStationService } from '../../application/charging-station/charging-station.service';
import { CreateAndSendEmergencyDto } from './dto/create-and-send-emergency.dto';

@Controller(`${API_PREFIX}/available-capacity-emergency`)
export class AvailableCapacityEmergencyController {
  constructor(
    private readonly chargingStationService: ChargingStationService,
    private readonly emergencyService: AvailableCapacityEmergencyService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createAndSendEmergency(@Body() dto: CreateAndSendEmergencyDto) {
    // 檢查充電站是否存在且已連線
    const chargingStation =
      await this.chargingStationService.getConnectedChargingStationById(
        dto.chargingStationId,
      );
    if (!chargingStation) {
      throw new NotFoundException(
        `ChargingStation[${dto.chargingStationId}] not exist or not connected`,
      );
    }

    return await this.emergencyService.createAndSendEmergency(
      chargingStation,
      DateTime.fromISO(dto.periodStartAt).toJSDate(),
      DateTime.fromISO(dto.periodEndAt).toJSDate(),
      dto.capacity,
    );
  }
}
