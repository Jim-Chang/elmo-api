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
import { ChargingStationService } from '../charging-station/charging-station.service';
import { AvailableCapacityNegotiationService } from './available-capacity-negotiation.service';
import { TAIPEI_TZ } from '../../../constants';
import { EmergencyStatus } from './types';

@Injectable()
export class AvailableCapacityEmergencyService {
  private readonly logger = new Logger(AvailableCapacityEmergencyService.name);

  constructor(
    @InjectRepository(AvailableCapacityEmergencyEntity)
    private readonly emergencyRepo: EntityRepository<AvailableCapacityEmergencyEntity>,
    private readonly chargingStationService: ChargingStationService,
    private readonly negotiationService: AvailableCapacityNegotiationService,
    private readonly oscpRequestHelper: CsmsOscpRequestHelper,
  ) {}

  async getEmergencyById(
    id: number,
  ): Promise<AvailableCapacityEmergencyEntity | null> {
    return this.emergencyRepo.findOne({ id });
  }

  determineLastEmergencyStatusByDateTime(
    lastEmergency: AvailableCapacityEmergencyEntity,
    dateTime: Date,
  ): EmergencyStatus {
    const time = DateTime.fromJSDate(dateTime);
    const periodStartAt = DateTime.fromJSDate(lastEmergency.periodStartAt);
    const periodEndAt = DateTime.fromJSDate(lastEmergency.periodEndAt);

    if (!lastEmergency.isSuccessSent) {
      return EmergencyStatus.EMERGENCY_CONTROL_FAILED;
    }

    if (time < periodStartAt) {
      return EmergencyStatus.PREPARE_EMERGENCY_CONTROL;
    } else if (time >= periodStartAt && time < periodEndAt) {
      return EmergencyStatus.EMERGENCY_CONTROL;
    } else {
      return EmergencyStatus.EMERGENCY_CONTROL_FINISH;
    }
  }

  async getEmergencyCapacityByDateTime(
    chargingStationId: number,
    dateTime: Date,
  ): Promise<number | null> {
    const emergencies = await this.emergencyRepo.find({
      chargingStation: { id: chargingStationId },
      periodStartAt: { $lte: dateTime },
      periodEndAt: { $gt: dateTime },
      isSuccessSent: true,
    });

    if (emergencies.length === 0) {
      return null;
    }

    return emergencies.reduce(
      (min, emergency) => (emergency.capacity < min ? emergency.capacity : min),
      Infinity,
    );
  }

  async getEmergencyCapacitiesByDateRange(
    chargingStationId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<{ dateTime: Date; capacity: number | null }[]> {
    const intervalMinutes = 15;
    const dateCapacityMap = new Map<string, number>();

    // Generate the date-capacity map with 15-minute intervals
    for (
      let current = DateTime.fromJSDate(startDate);
      current < DateTime.fromJSDate(endDate);
      current = current.plus({ minutes: intervalMinutes })
    ) {
      dateCapacityMap.set(current.toISO(), Infinity);
    }

    // Query emergencies within the date range
    const emergencies = await this.emergencyRepo.find(
      {
        chargingStation: { id: chargingStationId },
        $or: [
          {
            periodEndAt: { $gt: startDate, $lt: endDate },
          },
          {
            periodStartAt: { $lte: startDate },
            periodEndAt: { $gt: endDate },
          },
          {
            periodStartAt: { $gte: startDate, $lt: endDate },
          },
        ],
        isSuccessSent: true,
      },
      {
        orderBy: { periodStartAt: 'asc' },
      },
    );

    // Update the map with the lowest capacity for each interval
    for (const emergency of emergencies) {
      const emergencyStart = DateTime.fromJSDate(emergency.periodStartAt);
      const emergencyEnd = DateTime.fromJSDate(emergency.periodEndAt);

      for (
        let current = emergencyStart;
        current < emergencyEnd;
        current = current.plus({ minutes: intervalMinutes })
      ) {
        const key = current.toISO();
        if (dateCapacityMap.has(key)) {
          const currentCapacity = dateCapacityMap.get(key);
          if (emergency.capacity < currentCapacity) {
            dateCapacityMap.set(key, emergency.capacity);
          }
        }
      }
    }

    // Convert the map to an array of objects
    return Array.from(dateCapacityMap.entries()).map(
      ([dateTime, capacity]) => ({
        dateTime: new Date(dateTime),
        capacity: capacity === Infinity ? null : capacity,
      }),
    );
  }

  async createAndSendEmergency(
    negotiationId: number,
    periodStartAt: Date,
    periodEndAt: Date,
    capacity: number,
  ): Promise<AvailableCapacityEmergencyEntity> {
    // assert negotiation exists
    const negotiation =
      await this.negotiationService.getNegotiationById(negotiationId);
    if (!negotiation) {
      throw new Error(`Negotiation[${negotiationId}] not found`);
    }

    // 檢查 periodStartAt 與 negotiation.date 需在同一天
    const periodStartAtDate = DateTime.fromJSDate(periodStartAt, {
      zone: TAIPEI_TZ,
    });
    const negotiationDate = DateTime.fromJSDate(negotiation.date, {
      zone: TAIPEI_TZ,
    });

    if (!periodStartAtDate.hasSame(negotiationDate, 'day')) {
      throw new Error(
        `periodStartAt (${periodStartAtDate.toISODate()}) is not in negotiation date (${negotiationDate.toISODate()})`,
      );
    }

    // 檢查充電站是否已連線
    const chargingStation =
      await this.chargingStationService.getConnectedChargingStationById(
        negotiation.chargingStation.id,
      );
    if (!chargingStation) {
      throw new Error(
        `ChargingStation[${negotiation.chargingStation.id}] not connected`,
      );
    }

    const em = this.emergencyRepo.getEntityManager();
    const emergency = await em.transactional(async (em: EntityManager) => {
      // 建立「可用容量緊急通知」
      const emergency = em.create(AvailableCapacityEmergencyEntity, {
        negotiation,
        chargingStation: negotiation.chargingStation,
        periodStartAt,
        periodEndAt,
        capacity,
        isSuccessSent: false,
      });
      await em.persistAndFlush(emergency);

      // 更新 Negotiation 最後一筆緊急通知
      negotiation.lastEmergency = emergency;
      await em.persistAndFlush(negotiation);

      return emergency;
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
