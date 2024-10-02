import { ZodValidationPipe } from '@anatine/zod-nestjs';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  UsePipes,
} from '@nestjs/common';
import { API_PREFIX } from '../../../constants';
import { AvailableCapacityEmergencyService } from '../../application/available-capacity/available-capacity-emergency.service';
import { ChargingStationService } from '../../application/charging-station/charging-station.service';
import { CreateAndSendEmergencyDto } from './oscp/dto/create-and-send-emergency.dto';

@Controller(`${API_PREFIX}/charging-station-emergency`)
@UsePipes(ZodValidationPipe)
export class ChargingStationEmergencyController {
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
        dto.charging_station_id,
      );
    if (!chargingStation) {
      throw new NotFoundException(
        `ChargingStation[${dto.charging_station_id}] not exist or not connected`,
      );
    }

    return await this.emergencyService.createAndSendEmergency(
      chargingStation,
      dto.period_start_at,
      dto.period_end_at,
      dto.capacity,
    );
  }
}
