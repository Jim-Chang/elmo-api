import { ZodValidationPipe } from '@anatine/zod-nestjs';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Roles } from '../decorator/roles';
import { AuthUserGuard } from '../guard/auth-user.guard';
import { ADMIN_ROLE } from '../../../application/user/types';
import { InternalNegotiationHelper } from './internal-negotiation-helper';
import { AvailableCapacityNegotiationEntity } from '../../out/entities/available-capacity-negotiation.entity';
import { InternalApiNegotiationRefreshDto } from '../oscp/dto/internal-api-negotiation-refresh.dto';
import { RedisHelper } from '../../out/redis/redis-helper';

@Controller('internal-api')
@UsePipes(ZodValidationPipe)
export class InternalApiController {
  private readonly logger = new Logger(InternalApiController.name);

  constructor(
    private readonly internalNegotiationHelper: InternalNegotiationHelper,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly redisHelper: RedisHelper,
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
  @UseGuards(AuthUserGuard)
  @Roles(ADMIN_ROLE)
  async refreshNegotiation(
    @Body() dto: InternalApiNegotiationRefreshDto,
  ): Promise<AvailableCapacityNegotiationEntity> {
    return await this.internalNegotiationHelper.refreshNegotiation(dto);
  }

  @Post('cronjob/trigger/:jobName')
  @UseGuards(AuthUserGuard)
  @Roles(ADMIN_ROLE)
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

  @Get('redis/json-from-list')
  @UseGuards(AuthUserGuard)
  @Roles(ADMIN_ROLE)
  @HttpCode(HttpStatus.OK)
  async getRedisListJson(
    @Query('key') key: string,
    @Query('index') index: number,
  ) {
    this.logger.log(`[Internal API] redis LIST: key[${key}] index[${index}]`);
    const data = await this.redisHelper.getJsonDataFromList(key, index);
    return { data };
  }

  @Get('redis/json-from-string')
  @UseGuards(AuthUserGuard)
  @Roles(ADMIN_ROLE)
  @HttpCode(HttpStatus.OK)
  async getRedisStringJson(@Query('key') key: string) {
    this.logger.log(`[Internal API] redis STRING: key[${key}]`);
    const data = await this.redisHelper.getJsonDataFromString(key);
    return { data };
  }
}
