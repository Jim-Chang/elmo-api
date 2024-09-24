import { InjectRepository } from '@mikro-orm/nestjs';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
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
import {
  CapacityForecastType,
  ForecastedBlockUnit,
  PhaseIndicator,
} from '../../adapter/in/dto/enums';
import { CsmsOscpRequestHelper } from '../../adapter/out/csms-oscp/csms-oscp-request-helper';
import { UpdateGroupCapacityForecast } from '../oscp/types';

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
    private readonly oscpRequestHelper: CsmsOscpRequestHelper,
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
        chargingStation: { csms: { isConnected: true } },
        lastDetailStatus: NegotiationStatus.INITIAL_EDIT,
      },
      {
        populate: ['chargingStation', 'chargingStation.csms'],
      },
    );

    const em = this.negotiationRepo.getEntityManager();
    return await em.transactional(async (em: EntityManager) => {
      await Promise.all(
        negotiations.map((negotiation) =>
          this.assignAvailableCapacityByNegotiation(
            em,
            negotiation,
            negotiation.chargingStation,
          ),
        ),
      );
    });
  }

  async assignAvailableCapacityByNegotiation(
    em: EntityManager,
    negotiation: AvailableCapacityNegotiationEntity,
    chargingStation: ChargingStationEntity,
  ): Promise<AvailableCapacityNegotiationEntity> {
    const initialEditDetail = await this.getNegotiationDetailByStatus(
      negotiation,
      NegotiationStatus.INITIAL_EDIT,
    );
    const hourCapacities = initialEditDetail.hourCapacities;

    // 準備「指定可用容量」，並發送給充電站
    const message = this.buildUpdateGroupCapacityForecast(
      chargingStation,
      negotiation,
      hourCapacities,
    );
    try {
      await this.oscpRequestHelper.sendUpdateGroupCapacityForecastToCsms(
        chargingStation.csms,
        message,
      );
      this.logger.log(
        `ChargingStation[${chargingStation.uid}] assigned available capacity`,
      );
    } catch (error) {
      this.logger.error(
        `ChargingStation[${chargingStation.uid}] failed to assign available capacity`,
      );
      return negotiation;
    }

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
   * 接收充電站的「申請額外可用容量」
   */
  async requestExtraCapacity(
    chargingStationUid: string,
    hourCapacities: AvailableCapacityNegotiationHourCapacity[],
  ) {
    const validOldStatusList = [NegotiationStatus.NEGOTIATING];

    // 取得明日的協商
    const zonedNextDay = this.getZonedNextDay(TAIPEI_TZ);
    const negotiation = await this.negotiationRepo.findOne({
      date: zonedNextDay,
      chargingStation: { uid: chargingStationUid },
    });

    // 驗證協商狀態
    if (!negotiation) {
      const errorMessage = `ChargingStation[${chargingStationUid}] negotiation not found`;
      this.logger.error(errorMessage);
      throw new NotFoundException(errorMessage);
    }
    this.validateNegotiationStatusOrFail(
      negotiation.lastDetailStatus,
      validOldStatusList,
      `ChargingStation[${chargingStationUid}] negotiation status (${negotiation.lastDetailStatus}) is not valid ${validOldStatusList}`,
    );

    // 更新協商狀態
    const em = this.negotiationRepo.getEntityManager();
    return await em.transactional(async (em: EntityManager) => {
      // 建立 Detail (存放充電站申請額外可用容量資訊)
      const detailData = {
        negotiation,
        status: NegotiationStatus.EXTRA_REQUEST,
        hourCapacities,
      };
      await this.transitionNegotiationStatus(
        em,
        negotiation,
        detailData,
        false,
      );

      // 建立 Detail (管理員待確認變更容量)
      const detailDataForReply = {
        negotiation,
        status: NegotiationStatus.EXTRA_REPLY_EDIT,
        hourCapacities,
      };
      await this.transitionNegotiationStatus(
        em,
        negotiation,
        detailDataForReply,
        false,
      );

      return negotiation;
    });
  }

  /**
   * 管理員回覆充電站的「申請額外可用容量」
   */
  async replyExtraCapacity(negotiationId: number): Promise<boolean> {
    const validOldStatusList = [NegotiationStatus.EXTRA_REPLY_EDIT];

    // 取得協商
    const negotiation = await this.negotiationRepo.findOne(
      {
        id: negotiationId,
      },
      {
        populate: ['chargingStation', 'chargingStation.csms'],
      },
    );

    // 驗證協商狀態
    if (!negotiation) {
      const errorMessage = `Negotiation[${negotiationId}] not found`;
      this.logger.error(errorMessage);
      throw new NotFoundException(errorMessage);
    }
    this.validateNegotiationStatusOrFail(
      negotiation.lastDetailStatus,
      validOldStatusList,
      `Negotiation[${negotiationId}] status (${negotiation.lastDetailStatus}) is not valid ${validOldStatusList}`,
    );

    // 發送「申請額外可用容量回覆」給充電站，並更新協商狀態
    const em = this.negotiationRepo.getEntityManager();
    return await em.transactional(async (em: EntityManager) => {
      return await this.replyExtraCapacityByNegotiation(
        em,
        negotiation,
        NegotiationStatus.EXTRA_REPLY_FINISH,
      );
    });
  }

  /**
   * 系統自動發送「申請額外可用容量回覆」給尚未回覆「申請額外可用容量」的充電站
   */
  async replyExtraCapacityAuto() {
    const zonedNextDay = this.getZonedNextDay(TAIPEI_TZ);

    const negotiations = await this.negotiationRepo.find(
      {
        date: zonedNextDay,
        lastDetailStatus: NegotiationStatus.EXTRA_REPLY_EDIT,
      },
      {
        populate: ['chargingStation', 'chargingStation.csms'],
      },
    );

    // 發送「申請額外可用容量回覆」給充電站，並更新協商狀態
    const em = this.negotiationRepo.getEntityManager();
    for (const negotiation of negotiations) {
      await em.transactional(async (em: EntityManager) => {
        await this.replyExtraCapacityByNegotiation(
          em,
          negotiation,
          NegotiationStatus.EXTRA_REPLY_AUTO,
        );
      });
    }
  }

  async replyExtraCapacityByNegotiation(
    em: EntityManager,
    negotiation: AvailableCapacityNegotiationEntity,
    statusOnSuccess: NegotiationStatus,
  ): Promise<boolean> {
    const chargingStation = negotiation.chargingStation;

    const extraReplyEditDetail = await this.getNegotiationDetailByStatus(
      negotiation,
      NegotiationStatus.EXTRA_REPLY_EDIT,
    );
    const hourCapacities = extraReplyEditDetail.hourCapacities;

    // 準備「申請額外可用容量回覆」，並發送給充電站
    const message = this.buildUpdateGroupCapacityForecast(
      chargingStation,
      negotiation,
      hourCapacities,
    );

    let success: boolean;
    try {
      await this.oscpRequestHelper.sendUpdateGroupCapacityForecastToCsms(
        chargingStation.csms,
        message,
      );
      this.logger.log(
        `ChargingStation[${chargingStation.uid}] replied extra capacity`,
      );
      success = true;
    } catch (error) {
      this.logger.error(
        `ChargingStation[${chargingStation.uid}] failed to reply extra capacity`,
      );
      success = false;
    }

    // 決定協商的下一個 status 與 hourCapacities
    let nextStatus: NegotiationStatus;
    let applyHourCapacities: AvailableCapacityNegotiationHourCapacity[];
    if (success) {
      nextStatus = statusOnSuccess;
      applyHourCapacities = hourCapacities;
    } else {
      // 若發送失敗，以 ELMO 第一次指定容量作結
      const negotiatingDetail = await this.getNegotiationDetailByStatus(
        negotiation,
        NegotiationStatus.NEGOTIATING,
      );
      nextStatus = NegotiationStatus.EXTRA_REPLY_FAILED;
      applyHourCapacities = negotiatingDetail.hourCapacities;
    }

    // 更新協商狀態
    const detailData = {
      negotiation,
      status: nextStatus,
      hourCapacities: applyHourCapacities,
    };
    await this.transitionNegotiationStatus(em, negotiation, detailData, true);

    return success;
  }

  buildUpdateGroupCapacityForecast(
    chargingStation: ChargingStationEntity,
    negotiation: AvailableCapacityNegotiationEntity,
    hourCapacities: AvailableCapacityNegotiationHourCapacity[],
  ): UpdateGroupCapacityForecast {
    return {
      group_id: chargingStation.uid,
      type: CapacityForecastType.Consumption,
      forecasted_blocks: hourCapacities.map((hc) => ({
        capacity: hc.capacity,
        phase: PhaseIndicator.All,
        unit: ForecastedBlockUnit.Kw,
        start_time: this.getZonedDateTimeISO(
          negotiation.date,
          hc.hour,
          TAIPEI_TZ,
        ),
        end_time: this.getZonedDateTimeISO(
          negotiation.date,
          hc.hour + 1,
          TAIPEI_TZ,
        ),
      })),
    };
  }

  validateNegotiationStatusOrFail(
    status: NegotiationStatus,
    validStatusList: NegotiationStatus[],
    errorMessage: string,
  ) {
    if (!this.validateNegotiationStatus(status, validStatusList)) {
      this.logger.error(errorMessage);
      throw new BadRequestException(errorMessage);
    }
  }

  validateNegotiationStatus(
    status: NegotiationStatus,
    validStatusList: NegotiationStatus[],
  ) {
    return validStatusList.includes(status);
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

  getZonedDateTimeISO(
    startOfDay: Date,
    hour: number,
    timeZone: string,
  ): string {
    return DateTime.fromJSDate(startOfDay)
      .setZone(timeZone)
      .set({ hour })
      .toISO();
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
