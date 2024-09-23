import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { AvailableCapacityNegotiationEntity } from '../../adapter/out/entities/available-capacity-negotiation.entity';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { DateTime } from 'luxon';
import { TAIPEI_TZ } from '../../../constants';
import { NegotiationStatus } from './types';
import {
  AvailableCapacityNegotiationDetailEntity,
  AvailableCapacityNegotiationHourCapacity,
} from '../../adapter/out/entities/available-capacity-negotiation-detail.entity';
import { ChargingStationService } from '../charging-station/charging-station.service';
import { ChargingStationEntity } from '../../adapter/out/entities/charging-station.entity';

@Injectable()
export class AvailableCapacityNegotiationService {
  constructor(
    @InjectRepository(AvailableCapacityNegotiationEntity)
    private readonly negotiationRepo: EntityRepository<AvailableCapacityNegotiationEntity>,
    private readonly chargingStationService: ChargingStationService,
  ) {}

  /**
   * 建立初始「日前型協商」
   */
  async initiateNegotiation() {
    const zonedNextDay = this.getZonedNextDay(TAIPEI_TZ);

    const chargingStations =
      await this.chargingStationService.getConnectedChargingStations();

    const em = this.negotiationRepo.getEntityManager();
    return await em.transactional(async (em: EntityManager) => {
      await Promise.all(
        chargingStations.map((cs) =>
          this.initiateNegotiationByChargingStation(em, cs, zonedNextDay),
        ),
      );
    });
  }

  async initiateNegotiationByChargingStation(
    em: EntityManager,
    chargingStation: ChargingStationEntity,
    negotiationDate: Date,
  ): Promise<AvailableCapacityNegotiationEntity> {
    const status = NegotiationStatus.INITIAL_EDIT;
    const hourCapacities = await this.predictHourCapacities(chargingStation);

    // Create negotiation
    const negotiation = em.create(AvailableCapacityNegotiationEntity, {
      date: negotiationDate,
      chargingStation,
      lastDetailStatus: status,
    });
    await em.persistAndFlush(negotiation);

    // Create detail
    const detail = em.create(AvailableCapacityNegotiationDetailEntity, {
      negotiation,
      status,
      hourCapacities,
    });
    await em.persistAndFlush(detail);

    return negotiation;
  }

  getZonedNextDay(timeZone: string): Date {
    const now = DateTime.now().setZone(timeZone);
    const nextDayMidnight = now.plus({ days: 1 }).startOf('day');
    return nextDayMidnight.toJSDate();
  }

  async predictHourCapacities(
    chargingStation: ChargingStationEntity,
  ): Promise<AvailableCapacityNegotiationHourCapacity[]> {
    // TODO: 預測各時段用電量 by 充電站
    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      capacity: chargingStation.contractCapacity,
    }));
  }
}
