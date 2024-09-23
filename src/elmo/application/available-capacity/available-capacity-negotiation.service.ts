import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, Logger } from '@nestjs/common';
import { AvailableCapacityNegotiationEntity } from '../../adapter/out/entities/available-capacity-negotiation.entity';
import {
  EntityManager,
  EntityRepository,
  RequiredEntityData,
  wrap,
} from '@mikro-orm/core';
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
  private readonly logger = new Logger(
    AvailableCapacityNegotiationService.name,
  );

  constructor(
    @InjectRepository(AvailableCapacityNegotiationEntity)
    private readonly negotiationRepo: EntityRepository<AvailableCapacityNegotiationEntity>,
    @InjectRepository(AvailableCapacityNegotiationDetailEntity)
    private readonly detailRepo: EntityRepository<AvailableCapacityNegotiationDetailEntity>,
    private readonly chargingStationService: ChargingStationService,
  ) {}

  async getNegotiationDetailByStatus(
    negotiation: AvailableCapacityNegotiationEntity,
    status: NegotiationStatus,
  ): Promise<AvailableCapacityNegotiationDetailEntity | null> {
    return this.detailRepo.findOne({ negotiation, status });
  }

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

  /**
   * 發送「指定可用容量」給充電站
   */
  async assignAvailableCapacity() {
    const zonedNextDay = this.getZonedNextDay(TAIPEI_TZ);

    const negotiations = await this.negotiationRepo.find(
      {
        date: zonedNextDay,
        chargingStation: { isConnected: true },
        lastDetailStatus: NegotiationStatus.INITIAL_EDIT,
      },
      { populate: ['chargingStation'] },
    );

    const em = this.negotiationRepo.getEntityManager();
    return await em.transactional(async (em: EntityManager) => {
      await Promise.all(
        negotiations.map((negotiation) =>
          this.assignAvailableCapacityByNegotiation(
            em,
            negotiation,
            negotiation.chargingStation.uid,
          ),
        ),
      );
    });
  }

  async assignAvailableCapacityByNegotiation(
    em: EntityManager,
    negotiation: AvailableCapacityNegotiationEntity,
    chargingStationUid: string,
  ): Promise<AvailableCapacityNegotiationEntity> {
    const initialEditDetail = await this.getNegotiationDetailByStatus(
      negotiation,
      NegotiationStatus.INITIAL_EDIT,
    );

    const hourCapacities = initialEditDetail.hourCapacities;

    // TODO: 發送「指定可用容量」給充電站

    // 更新協商狀態
    const detailData = {
      negotiation,
      status: NegotiationStatus.NEGOTIATING,
      hourCapacities,
    };
    await this.transitionNegotiationStatus(em, negotiation, detailData, true);

    return negotiation;
  }

  /**
   * 更新「日前型協商」的狀態
   */
  async transitionNegotiationStatus(
    em: EntityManager,
    negotiation: AvailableCapacityNegotiationEntity,
    detailData: RequiredEntityData<AvailableCapacityNegotiationDetailEntity>,
    isApplyDetail: boolean,
  ) {
    // Create a new detail with new status
    const newDetailEntity = em.create(
      AvailableCapacityNegotiationDetailEntity,
      detailData,
    );
    await em.persistAndFlush(newDetailEntity);

    // Update the negotiation with the new detail
    const updateData = {
      lastDetailStatus: newDetailEntity.status,
    };
    if (isApplyDetail) {
      updateData['applyDetail'] = newDetailEntity;
    }
    wrap(negotiation).assign(updateData, { em, mergeObjectProperties: true });

    this.logger.log(
      `Transition negotiation[${negotiation.id}] to "${newDetailEntity.status}", detail[${newDetailEntity.id}], apply[${isApplyDetail}]`,
    );
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
