import { ZodValidationPipe } from '@anatine/zod-nestjs';
import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { API_PREFIX } from '../../../../constants';
import { AvailableCapacityEmergencyService } from '../../../application/available-capacity/available-capacity-emergency.service';
import { CreateAndSendEmergencyDto } from '../oscp/dto/create-and-send-emergency.dto';
import { AvailableCapacityNegotiationService } from '../../../application/available-capacity/available-capacity-negotiation.service';
import { AuthUserGuard } from '../guard/auth-user.guard';

@Controller(`${API_PREFIX}/charging-station-emergency`)
@UseGuards(AuthUserGuard)
@UsePipes(ZodValidationPipe)
export class ChargingStationEmergencyController {
  constructor(
    private readonly emergencyService: AvailableCapacityEmergencyService,
    private readonly negotiationService: AvailableCapacityNegotiationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createAndSendEmergency(@Body() dto: CreateAndSendEmergencyDto) {
    // 檢查 Negotiation 是否存在
    const negotiation = await this.negotiationService.getNegotiationById(
      dto.negotiation_id,
    );
    if (!negotiation) {
      throw new NotFoundException(
        `Negotiation[${dto.negotiation_id}] not found`,
      );
    }

    try {
      return await this.emergencyService.createAndSendEmergency(
        dto.negotiation_id,
        dto.period_start_at,
        dto.period_end_at,
        dto.capacity,
      );
    } catch (error) {
      throw new ForbiddenException(error.message);
    }
  }
}
