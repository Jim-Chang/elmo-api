import { ZodValidationPipe } from '@anatine/zod-nestjs';
import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  UsePipes,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InternalNegotiationHelper } from './internal-negotiation-helper';
import { AvailableCapacityNegotiationEntity } from '../../out/entities/available-capacity-negotiation.entity';
import { InternalApiNegotiationRefreshDto } from '../oscp/dto/internal-api-negotiation-refresh.dto';

@Controller('internal-api')
@UsePipes(ZodValidationPipe)
export class InternalApiController {
  private readonly logger = new Logger(InternalApiController.name);

  constructor(
    private readonly internalNegotiationHelper: InternalNegotiationHelper,
    private readonly schedulerRegistry: SchedulerRegistry,
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

  @Post('cronjob/trigger/:jobName')
  @HttpCode(HttpStatus.OK)
  async triggerCronjob(@Param('jobName') jobName: string) {
    try {
      const job = this.schedulerRegistry.getCronJob(jobName);
      this.logger.log(`[Internal API] trigger cronjob: ${jobName}`);
      job.fireOnTick();
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    return `Triggered: ${jobName}`;
  }
}
