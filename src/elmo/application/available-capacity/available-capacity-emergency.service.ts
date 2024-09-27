import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { CsmsOscpRequestHelper } from '../../adapter/out/csms-oscp/csms-oscp-request-helper';
import { AvailableCapacityEmergencyEntity } from '../../adapter/out/entities/available-capacity-emergency.entity';
import { ChargingStationEntity } from '../../adapter/out/entities/charging-station.entity';
import { UpdateGroupCapacityForecast } from '../oscp/types';
import {
  CapacityForecastType,
  ForecastedBlockUnit,
  PhaseIndicator,
} from '../../adapter/in/dto/enums';

@Injectable()
export class AvailableCapacityEmergencyService {
  private readonly logger = new Logger(AvailableCapacityEmergencyService.name);

  constructor(
    @InjectRepository(AvailableCapacityEmergencyEntity)
    private readonly emergencyRepo: EntityRepository<AvailableCapacityEmergencyEntity>,
    private readonly oscpRequestHelper: CsmsOscpRequestHelper,
  ) {}

  async createAndSendEmergency(
    chargingStation: ChargingStationEntity,
    periodStartAt: Date,
    periodEndAt: Date,
    capacity: number,
  ): Promise<AvailableCapacityEmergencyEntity> {
    // 檢查 periodStartAt、periodEndAt 是否合法
    this.validateEmergencyPeriodOrFail(periodStartAt, periodEndAt);

    // 建立「可用容量緊急通知」
    const em = this.emergencyRepo.getEntityManager();
    const emergency = await em.transactional(async (em: EntityManager) => {
      const entity = em.create(AvailableCapacityEmergencyEntity, {
        chargingStation,
        periodStartAt,
        periodEndAt,
        capacity,
      });
      await em.persistAndFlush(entity);
      return entity;
    });

    // 發送「可用容量緊急通知」給 ChargingStation
    const message = this.buildUpdateGroupCapacityForecast(
      emergency,
      chargingStation,
    );
    await this.oscpRequestHelper.sendUpdateGroupCapacityForecastToCsms(
      chargingStation.csms,
      message,
    );

    // TODO: 處理發送失敗的情況

    return emergency;
  }

  validateEmergencyPeriodOrFail(periodStartAt: Date, periodEndAt: Date) {
    const startAt = DateTime.fromJSDate(periodStartAt);
    const endAt = DateTime.fromJSDate(periodEndAt);
    const now = DateTime.now();

    // periodStartAt 需在今日
    if (!startAt.hasSame(now, 'day')) {
      throw new BadRequestException('{periodStartAt} must be today');
    }

    // periodStartAt 不可在未來 15 分鐘前
    if (startAt < now.plus({ minutes: 15 })) {
      throw new BadRequestException(
        '{periodStartAt} must be at least 15 minutes later',
      );
    }

    // periodEndAt 不可在 periodStartAt 之前
    if (endAt < startAt) {
      throw new BadRequestException(
        '{periodEndAt} must be later than {periodStartAt}',
      );
    }

    // periodEndAt 不可在明天 00:00 之後
    if (endAt >= now.plus({ days: 1 }).startOf('day')) {
      throw new BadRequestException(
        '{periodEndAt} cannot be later than 00:00 tomorrow',
      );
    }
  }

  buildUpdateGroupCapacityForecast(
    emergency: AvailableCapacityEmergencyEntity,
    chargingStation: ChargingStationEntity,
  ): UpdateGroupCapacityForecast {
    return {
      group_id: chargingStation.uid,
      type: CapacityForecastType.Consumption,
      forecasted_blocks: [
        {
          capacity: emergency.capacity,
          phase: PhaseIndicator.All,
          unit: ForecastedBlockUnit.Kw,
          start_time: DateTime.fromJSDate(emergency.periodStartAt).toISO(),
          end_time: DateTime.fromJSDate(emergency.periodEndAt).toISO(),
        },
      ],
    };
  }
}
