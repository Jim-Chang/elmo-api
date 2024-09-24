import { CreateRequestContext, MikroORM } from '@mikro-orm/core';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TAIPEI_TZ } from '../../../../constants';
import { AvailableCapacityNegotiationService } from '../../../application/available-capacity/available-capacity-negotiation.service';

@Injectable()
export class AvailableCapacityNegotiationCronjobService {
  private readonly logger = new Logger(
    AvailableCapacityNegotiationCronjobService.name,
  );

  constructor(
    // for @CreateRequestContext use
    private readonly orm: MikroORM,
    private readonly negotiationService: AvailableCapacityNegotiationService,
  ) {}

  // This cron job is set to run at midnight (00:00:00) every day, based on the Asia/Taipei timezone.
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    timeZone: TAIPEI_TZ,
  })
  @CreateRequestContext()
  async handleInitiateNegotiation() {
    this.logger.log(
      '[AvailableCapacityNegotiationCronjobService]: trigger handleInitiateNegotiation',
    );
    await this.negotiationService.initiateNegotiation();
    this.logger.log(
      '[AvailableCapacityNegotiationCronjobService]: handleInitiateNegotiation finished',
    );
  }

  // This cron job is set to run at 10:00 AM every day, based on the Asia/Taipei timezone.
  @Cron(CronExpression.EVERY_DAY_AT_10AM, {
    timeZone: TAIPEI_TZ,
  })
  @CreateRequestContext()
  async handleAssignAvailableCapacity() {
    this.logger.log(
      '[AvailableCapacityNegotiationCronjobService]: trigger handleAssignAvailableCapacity',
    );
    await this.negotiationService.assignAvailableCapacity();
    this.logger.log(
      '[AvailableCapacityNegotiationCronjobService]: handleAssignAvailableCapacity finished',
    );
  }
}
