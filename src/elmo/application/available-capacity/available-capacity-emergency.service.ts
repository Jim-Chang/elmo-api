import { EntityManager, EntityRepository, wrap } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { CsmsOscpRequestHelper } from '../../adapter/out/csms-oscp/csms-oscp-request-helper';
import { AvailableCapacityEmergencyEntity } from '../../adapter/out/entities/available-capacity-emergency.entity';
import { ChargingStationEntity } from '../../adapter/out/entities/charging-station.entity';
import { UpdateGroupCapacityForecast } from '../oscp/types';
import {
  CapacityForecastType,
  ForecastedBlockUnit,
  PhaseIndicator,
} from '../../adapter/in/oscp/dto/enums';

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
    // 建立「可用容量緊急通知」
    const em = this.emergencyRepo.getEntityManager();
    const emergency = await em.transactional(async (em: EntityManager) => {
      const entity = em.create(AvailableCapacityEmergencyEntity, {
        chargingStation,
        periodStartAt,
        periodEndAt,
        capacity,
        isSuccessSent: false,
      });
      await em.persistAndFlush(entity);
      return entity;
    });

    // 發送「可用容量緊急通知」給 ChargingStation
    try {
      const message = this.buildUpdateGroupCapacityForecast(
        emergency,
        chargingStation,
      );
      await this.oscpRequestHelper.sendUpdateGroupCapacityForecastToCsms(
        chargingStation.csms,
        message,
      );
    } catch (error) {
      this.logger.error(
        `ChargingStation[${chargingStation.uid}] failed to send emergency (error: ${error})`,
      );
      return emergency;
    }

    // 更新「可用容量緊急通知」為已成功發送
    wrap(emergency).assign(
      { isSuccessSent: true },
      { em, mergeObjectProperties: true },
    );
    await em.persistAndFlush(emergency);

    return emergency;
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
