import { EntityManager, EntityRepository, wrap } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AvailableCapacityNegotiationEntity } from '../../out/entities/available-capacity-negotiation.entity';
import { AvailableCapacityNegotiationService } from '../../../application/available-capacity/available-capacity-negotiation.service';
import { ChargingStationService } from '../../../application/charging-station/charging-station.service';
import {
  AvailableCapacityNegotiationDetailEntity,
  AvailableCapacityNegotiationHourCapacity,
} from '../../out/entities/available-capacity-negotiation-detail.entity';
import { NegotiationStatus } from '../../../application/available-capacity/types';
import { ChargingStationEntity } from '../../out/entities/charging-station.entity';
import { InternalApiNegotiationRefreshDto } from '../oscp/dto/internal-api-negotiation-refresh.dto';

const ALL_STATUS_IN_ORDER = [
  NegotiationStatus.INITIAL,
  NegotiationStatus.INITIAL_EDIT,
  NegotiationStatus.NEGOTIATING,
  NegotiationStatus.NEGOTIATING_FAILED,
  NegotiationStatus.EXTRA_REQUEST,
  NegotiationStatus.EXTRA_REPLY_EDIT,
  NegotiationStatus.EXTRA_REPLY_FINISH,
  NegotiationStatus.EXTRA_REPLY_AUTO,
  NegotiationStatus.EXTRA_REPLY_FAILED,
  NegotiationStatus.FINISH,
];

@Injectable()
export class InternalNegotiationHelper {
  private readonly logger = new Logger(InternalNegotiationHelper.name);

  constructor(
    @InjectRepository(AvailableCapacityNegotiationEntity)
    private readonly negotiationRepo: EntityRepository<AvailableCapacityNegotiationEntity>,
    @InjectRepository(AvailableCapacityNegotiationDetailEntity)
    private readonly detailRepo: EntityRepository<AvailableCapacityNegotiationDetailEntity>,
    private readonly availableCapacityNegotiationService: AvailableCapacityNegotiationService,
    private readonly chargingStationService: ChargingStationService,
  ) {}

  /**
   * 將 negotiation 更新為指定的 status、detail data
   */
  async refreshNegotiation(
    dto: InternalApiNegotiationRefreshDto,
  ): Promise<AvailableCapacityNegotiationEntity> {
    const chargingStationUid = dto.chargingStationUid;
    const date = new Date(dto.date);
    const targetStatus = dto.targetStatus;
    const detailData = dto.detailData;

    // 取得 charging station
    const chargingStation =
      await this.chargingStationService.getChargingStationByUid(
        chargingStationUid,
      );

    if (!chargingStation) {
      throw new NotFoundException(
        `ChargingStation[${chargingStationUid}] not found`,
      );
    }

    // 取得 negotiation
    const negotiation = await this.getOrInitiateNegotiation(
      chargingStation,
      date,
    );

    // 取得 negotiation 的所有 details
    const details = await this.detailRepo.find({
      negotiation,
    });

    // 將 negotiation 的 details 依照 status 分類
    const statusDetails = ALL_STATUS_IN_ORDER.reduce((acc, status) => {
      acc[status] = details.filter((d) => d.status === status);
      return acc;
    }, {});

    // 取得 negotiation 在 target status 時，所有應該存在的 detail status 清單
    const transitionStatuses = getTransitionStatuses(targetStatus);

    const em = this.negotiationRepo.getEntityManager();
    await em.transactional(async (em: EntityManager) => {
      // 逐一處理各 status 的 negotiation detail
      for (const status of ALL_STATUS_IN_ORDER) {
        const details = statusDetails[status];
        const customDetailData = detailData[status];

        const isDetailAlreadyExist = details.length > 0;
        const isDetailShouldExist = transitionStatuses.includes(status);

        if (isDetailShouldExist && !isDetailAlreadyExist) {
          // 建立 negotiation detail
          await this.createNegotiationDetail(
            em,
            negotiation,
            status,
            customDetailData,
          );
        } else if (isDetailShouldExist && isDetailAlreadyExist) {
          // 更新 negotiation detail
          await this.updateNegotiationDetail(em, details, customDetailData);
        } else if (!isDetailShouldExist && isDetailAlreadyExist) {
          // 刪除 negotiation detail
          await this.removeNegotiationDetail(em, details);
        } else {
          // do nothing
        }
      }

      // 更新 negotiation
      const applyDetail = await this.getApplyDetail(negotiation, targetStatus);
      const negotiationData = {
        lastDetailStatus: targetStatus,
        applyDetail,
      };
      wrap(negotiation).assign(negotiationData, { em });
      this.logger.log(
        `UPDATE negotiation[${negotiation.id}] (${targetStatus})`,
      );
    });

    return negotiation;
  }

  /**
   * 取得 negotiation，若不存在則建立新的 negotiation
   */
  async getOrInitiateNegotiation(
    chargingStation: ChargingStationEntity,
    date: Date,
  ): Promise<AvailableCapacityNegotiationEntity> {
    let negotiation = await this.negotiationRepo.findOne({
      chargingStation,
      date,
    });

    if (negotiation) {
      this.logger.log(`GET negotiation[${negotiation.id}]`);
      return negotiation;
    }

    // 建立 negotiation
    const em = this.negotiationRepo.getEntityManager();
    negotiation = await em.transactional(async (em: EntityManager) => {
      return await this.availableCapacityNegotiationService.initiateNegotiationByChargingStation(
        em,
        chargingStation,
        date,
      );
    });
    this.logger.log(`CREATE negotiation[${negotiation.id}]`);
    return negotiation;
  }

  /**
   * 建立 negotiation detail
   */
  async createNegotiationDetail(
    em: EntityManager,
    negotiation: AvailableCapacityNegotiationEntity,
    status: NegotiationStatus,
    customDetailData: any,
  ) {
    // TODO: 從 customDetailData 取得 detail 設定資料
    const hourCapacities = await this.buildHourCapacities(
      negotiation,
      status,
      customDetailData,
    );
    const detail = em.create(AvailableCapacityNegotiationDetailEntity, {
      negotiation,
      status,
      hourCapacities,
    });
    await em.persistAndFlush(detail);
    this.logger.log(`CREATE detail[${detail.id}] (${detail.status})`);
  }

  /**
   * 更新 negotiation detail
   */
  async updateNegotiationDetail(
    em: EntityManager,
    details: AvailableCapacityNegotiationDetailEntity[],
    customDetailData: any,
  ) {
    // 移除多餘的 details
    if (details.length > 1) {
      const detailsToRemove = details.slice(1);
      await this.removeNegotiationDetail(em, detailsToRemove);
    }

    // 更新 detail
    const detail = details[0];
    // TODO: 從 customDetailData 取得 detail 設定資料
    // const detailData = {};
    // wrap(detail).assign(detailData, { em, mergeObjectProperties: true });
    // await em.persistAndFlush(detail);
    this.logger.log(`UPDATE detail[${detail.id}] (${detail.status})`);
  }

  /**
   * 移除 negotiation detail
   */
  async removeNegotiationDetail(
    em: EntityManager,
    details: AvailableCapacityNegotiationDetailEntity[],
  ) {
    // 逐一移除 detail
    for (const detail of details) {
      this.logger.log(`REMOVE detail[${detail.id}] (${detail.status})`);
      em.remove(detail);
      await em.flush();
    }
  }

  /**
   * 建立 negotiation detail 的 hour capacities
   */
  async buildHourCapacities(
    negotiation: AvailableCapacityNegotiationEntity,
    status: NegotiationStatus,
    customDetailData: any,
  ): Promise<AvailableCapacityNegotiationHourCapacity[]> {
    const contractCapacity = negotiation.chargingStation.contractCapacity;

    // 根據 status 設定不同的 capacity
    // TODO: 從 customDetailData 取得 hour capacities 設定資料
    let capacity: number;
    switch (status) {
      case NegotiationStatus.INITIAL:
      case NegotiationStatus.INITIAL_EDIT:
      case NegotiationStatus.NEGOTIATING:
      case NegotiationStatus.EXTRA_REPLY_FAILED:
      case NegotiationStatus.FINISH:
        capacity = contractCapacity * 0.5;
        break;
      case NegotiationStatus.EXTRA_REQUEST:
      case NegotiationStatus.EXTRA_REPLY_EDIT:
      case NegotiationStatus.EXTRA_REPLY_FINISH:
      case NegotiationStatus.EXTRA_REPLY_AUTO:
        capacity = contractCapacity * 0.8;
        break;
      default:
        capacity = contractCapacity;
        break;
    }

    // 產生 24 小時的 capacity
    return Array.from({ length: 24 }).map((_, hour) => ({
      hour,
      capacity,
    }));
  }

  /**
   * 取得 negotiation 在 target status 時，應該套用的 detail (可用容量)
   */
  async getApplyDetail(
    negotiation: AvailableCapacityNegotiationEntity,
    targetStatus: NegotiationStatus,
  ): Promise<AvailableCapacityNegotiationDetailEntity | null> {
    let applyDetailStatus: NegotiationStatus;
    switch (targetStatus) {
      case NegotiationStatus.NEGOTIATING:
      case NegotiationStatus.EXTRA_REQUEST:
      case NegotiationStatus.EXTRA_REPLY_EDIT:
        applyDetailStatus = NegotiationStatus.NEGOTIATING;
        break;

      case NegotiationStatus.NEGOTIATING_FAILED:
        applyDetailStatus = NegotiationStatus.NEGOTIATING_FAILED;
        break;

      case NegotiationStatus.EXTRA_REPLY_FINISH:
        applyDetailStatus = NegotiationStatus.EXTRA_REPLY_FINISH;
        break;

      case NegotiationStatus.EXTRA_REPLY_AUTO:
        applyDetailStatus = NegotiationStatus.EXTRA_REPLY_AUTO;
        break;

      case NegotiationStatus.EXTRA_REPLY_FAILED:
        applyDetailStatus = NegotiationStatus.EXTRA_REPLY_FAILED;
        break;

      case NegotiationStatus.FINISH:
        applyDetailStatus = NegotiationStatus.FINISH;
        break;

      default:
        return null;
    }

    return this.detailRepo.findOne({
      negotiation,
      status: applyDetailStatus,
    });
  }
}

/**
 * 取得 negotiation 在 target status 時，所有應該存在的 detail status 清單
 */
function getTransitionStatuses(
  targetStatus: NegotiationStatus,
): NegotiationStatus[] {
  switch (targetStatus) {
    case NegotiationStatus.INITIAL_EDIT:
      return [NegotiationStatus.INITIAL, NegotiationStatus.INITIAL_EDIT];
    case NegotiationStatus.NEGOTIATING:
      return [
        NegotiationStatus.INITIAL,
        NegotiationStatus.INITIAL_EDIT,
        NegotiationStatus.NEGOTIATING,
      ];
    case NegotiationStatus.NEGOTIATING_FAILED:
      return [
        NegotiationStatus.INITIAL,
        NegotiationStatus.INITIAL_EDIT,
        NegotiationStatus.NEGOTIATING_FAILED,
      ];
    case NegotiationStatus.EXTRA_REQUEST:
      return [
        NegotiationStatus.INITIAL,
        NegotiationStatus.INITIAL_EDIT,
        NegotiationStatus.NEGOTIATING,
        NegotiationStatus.EXTRA_REQUEST,
      ];
    case NegotiationStatus.EXTRA_REPLY_EDIT:
      return [
        NegotiationStatus.INITIAL,
        NegotiationStatus.INITIAL_EDIT,
        NegotiationStatus.NEGOTIATING,
        NegotiationStatus.EXTRA_REQUEST,
        NegotiationStatus.EXTRA_REPLY_EDIT,
      ];
    case NegotiationStatus.EXTRA_REPLY_FINISH:
      return [
        NegotiationStatus.INITIAL,
        NegotiationStatus.INITIAL_EDIT,
        NegotiationStatus.NEGOTIATING,
        NegotiationStatus.EXTRA_REQUEST,
        NegotiationStatus.EXTRA_REPLY_EDIT,
        NegotiationStatus.EXTRA_REPLY_FINISH,
      ];
    case NegotiationStatus.EXTRA_REPLY_AUTO:
      return [
        NegotiationStatus.INITIAL,
        NegotiationStatus.INITIAL_EDIT,
        NegotiationStatus.NEGOTIATING,
        NegotiationStatus.EXTRA_REQUEST,
        NegotiationStatus.EXTRA_REPLY_EDIT,
        NegotiationStatus.EXTRA_REPLY_AUTO,
      ];
    case NegotiationStatus.EXTRA_REPLY_FAILED:
      return [
        NegotiationStatus.INITIAL,
        NegotiationStatus.INITIAL_EDIT,
        NegotiationStatus.NEGOTIATING,
        NegotiationStatus.EXTRA_REQUEST,
        NegotiationStatus.EXTRA_REPLY_EDIT,
        NegotiationStatus.EXTRA_REPLY_FAILED,
      ];
    case NegotiationStatus.FINISH:
      return [
        NegotiationStatus.INITIAL,
        NegotiationStatus.INITIAL_EDIT,
        NegotiationStatus.NEGOTIATING,
        NegotiationStatus.FINISH,
      ];
    default:
      throw new Error(`Invalid negotiation status: ${targetStatus}`);
  }
}
