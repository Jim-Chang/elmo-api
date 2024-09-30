import { ZodValidationPipe } from '@anatine/zod-nestjs';
import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import { InternalApiNegotiationRefreshDto } from './dto/internal-api-negotiation-refresh.dto';
import { InternalNegotiationHelper } from './internal-api/internal-negotiation-helper';
import { AvailableCapacityNegotiationEntity } from '../out/entities/available-capacity-negotiation.entity';

@Controller('internal-api')
@UsePipes(ZodValidationPipe)
export class InternalApiController {
  constructor(
    private readonly internalNegotiationHelper: InternalNegotiationHelper,
  ) {}

  /**
   * 調整 negotiation 到指定 status
   *
   * Example request body:
   * {
   *   "chargingStationUid": "CS_UID",
   *   "date": "2024-01-01T00:00:00+08:00",
   *   "targetStatus": "EXTRA_REPLY_FINISH",
   *   "detailData": {}
   * }
   */
  @Post('negotiation/refresh')
  async refreshNegotiation(
    @Body() dto: InternalApiNegotiationRefreshDto,
  ): Promise<AvailableCapacityNegotiationEntity> {
    return await this.internalNegotiationHelper.refreshNegotiation(dto);
  }
}
