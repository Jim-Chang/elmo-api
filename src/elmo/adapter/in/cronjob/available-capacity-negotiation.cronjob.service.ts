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

  // 系統自動建立初始「日前型協商」，每天 00:00 執行
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

  // 系統自動發送「指定可用容量」給充電站，每天 10:00 執行
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

  // 系統針對未收到「申請額外可用容量」的充電站，結束協商流程，每天 14:05 執行
  @Cron('0 5 14 * * *', {
    timeZone: TAIPEI_TZ,
  })
  @CreateRequestContext()
  async handleFinishNegotiationsUnderNegotiating() {
    this.logger.log(
      '[AvailableCapacityNegotiationCronjobService]: trigger handleFinishNegotiationsUnderNegotiating',
    );
    await this.negotiationService.finishNegotiationsUnderNegotiating();
    this.logger.log(
      '[AvailableCapacityNegotiationCronjobService]: handleFinishNegotiationsUnderNegotiating finished',
    );
  }

  // 系統自動發送「申請額外可用容量回覆」給尚未回覆「申請額外可用容量」的充電站，每天 16:00 執行
  @Cron(CronExpression.EVERY_DAY_AT_4PM, {
    timeZone: TAIPEI_TZ,
  })
  @CreateRequestContext()
  async handleReplyExtraCapacityAuto() {
    this.logger.log(
      '[AvailableCapacityNegotiationCronjobService]: trigger handleReplyExtraCapacityAuto',
    );
    await this.negotiationService.replyExtraCapacityAuto();
    this.logger.log(
      '[AvailableCapacityNegotiationCronjobService]: handleReplyExtraCapacityAuto finished',
    );
  }

  // 系統自動結束所有未完成協商，每天 16:05 執行
  @Cron('0 5 16 * * *', {
    timeZone: TAIPEI_TZ,
  })
  @CreateRequestContext()
  async handleFinishAllNegotiations() {
    this.logger.log(
      '[AvailableCapacityNegotiationCronjobService]: trigger handleFinishAllNegotiations',
    );
    await this.negotiationService.finishAllNegotiations();
    this.logger.log(
      '[AvailableCapacityNegotiationCronjobService]: handleFinishAllNegotiations finished',
    );
  }
}
