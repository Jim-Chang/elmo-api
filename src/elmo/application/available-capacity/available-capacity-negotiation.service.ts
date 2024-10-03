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
} from '../../adapter/in/oscp/dto/enums';
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

  async getNegotiationById(
    id: number,
  ): Promise<AvailableCapacityNegotiationEntity | null> {
    return this.negotiationRepo.findOne({ id });
  }

  async getNegotiationDetailById(
    id: number,
  ): Promise<AvailableCapacityNegotiationDetailEntity | null> {
    return this.detailRepo.findOne({ id });
  }

  async getNegotiationDetailByStatus(
    negotiation: AvailableCapacityNegotiationEntity,
    status: NegotiationStatus,
  ): Promise<AvailableCapacityNegotiationDetailEntity | null> {
    return this.detailRepo.findOne({ negotiation, status });
  }

  async getAllNegotiationDetailsByNegotiation(
    negotiation: AvailableCapacityNegotiationEntity,
  ): Promise<AvailableCapacityNegotiationDetailEntity[]> {
    return this.detailRepo.find({ negotiation }, { orderBy: { id: 'asc' } });
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

  async updateInitialNegotiation(
    negotiationId: number,
    hourCapacities: { hour: number; capacity: number }[],
  ): Promise<AvailableCapacityNegotiationDetailEntity> {
    const negotiation = await this.negotiationRepo.findOneOrFail(negotiationId);
    // assert negotiation is in status INITIAL_EDIT
    if (negotiation.lastDetailStatus !== NegotiationStatus.INITIAL_EDIT) {
      throw new Error(
        `Negotiation[${negotiationId}] is not in status ${NegotiationStatus.INITIAL_EDIT} when update initial negotiation`,
      );
    }

    // update detail with new hourCapacities
    const detail = await this.detailRepo.findOneOrFail({
      negotiation,
      status: NegotiationStatus.INITIAL_EDIT,
    });

    detail.hourCapacities = hourCapacities;

    const em = this.detailRepo.getEntityManager();
    await em.persistAndFlush(detail);

    return detail;
  }

  async updateExtraReplyNegotiation(
    negotiationId: number,
    hourCapacities: { hour: number; capacity: number }[],
  ): Promise<AvailableCapacityNegotiationDetailEntity> {
    const negotiation = await this.negotiationRepo.findOneOrFail(negotiationId);
    // assert negotiation is in status EXTRA_REPLY_EDIT
    if (negotiation.lastDetailStatus !== NegotiationStatus.EXTRA_REPLY_EDIT) {
      throw new Error(
        `Negotiation[${negotiationId}] is not in status ${NegotiationStatus.EXTRA_REPLY_EDIT} when update extra reply negotiation`,
      );
    }

    // update detail with new hourCapacities
    const detail = await this.detailRepo.findOneOrFail({
      negotiation,
      status: NegotiationStatus.EXTRA_REPLY_EDIT,
    });

    detail.hourCapacities = hourCapacities;

    const em = this.detailRepo.getEntityManager();
    await em.persistAndFlush(detail);

    return detail;
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

    await Promise.all(
      negotiations.map((negotiation) =>
        this.assignAvailableCapacityByNegotiation(
          negotiation,
          negotiation.chargingStation,
        ),
      ),
    );
  }

  async assignAvailableCapacityByNegotiation(
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

    let success: boolean;
    try {
      await this.oscpRequestHelper.sendUpdateGroupCapacityForecastToCsms(
        chargingStation.csms,
        message,
      );
      this.logger.log(
        `ChargingStation[${chargingStation.uid}] assigned available capacity`,
      );
      success = true;
    } catch (error) {
      this.logger.error(
        `ChargingStation[${chargingStation.uid}] failed to assign available capacity`,
      );
      success = false;
    }

    // 更新協商狀態
    let detailData: RequiredEntityData<AvailableCapacityNegotiationDetailEntity>;
    if (success) {
      // 若發送成功，進入「NEGOTIATING」狀態
      detailData = {
        negotiation,
        status: NegotiationStatus.NEGOTIATING,
        hourCapacities,
      };
    } else {
      // 若發送失敗，以充電站契約容量作結
      detailData = {
        negotiation,
        status: NegotiationStatus.NEGOTIATING_FAILED,
        hourCapacities:
          this.buildHourCapacitiesByChargingStationContractCapacity(
            chargingStation,
          ),
      };
    }

    const em = this.negotiationRepo.getEntityManager();
    await em.transactional(async (em: EntityManager) => {
      await this.transitionNegotiationStatus(em, negotiation, detailData, true);
    });

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
    return await this.replyExtraCapacityByNegotiation(
      negotiation,
      NegotiationStatus.EXTRA_REPLY_FINISH,
    );
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
    await Promise.all(
      negotiations.map((negotiation) =>
        this.replyExtraCapacityByNegotiation(
          negotiation,
          NegotiationStatus.EXTRA_REPLY_AUTO,
        ),
      ),
    );
  }

  async replyExtraCapacityByNegotiation(
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

    const em = this.negotiationRepo.getEntityManager();
    await em.transactional(async (em: EntityManager) => {
      await this.transitionNegotiationStatus(em, negotiation, detailData, true);
    });

    return success;
  }

  /**
   * 針對未收到「申請額外可用容量」的充電站，結束協商流程
   */
  async finishNegotiationsUnderNegotiating() {
    const zonedNextDay = this.getZonedNextDay(TAIPEI_TZ);

    const negotiations = await this.negotiationRepo.find(
      {
        date: zonedNextDay,
        lastDetailStatus: NegotiationStatus.NEGOTIATING,
      },
      {
        populate: ['chargingStation'],
      },
    );

    await Promise.all(
      negotiations.map((negotiation) =>
        this.finishNegotiationByNegotiation(
          negotiation,
          negotiation.chargingStation,
        ),
      ),
    );
  }

  /**
   * 結束所有未完成的協商
   */
  async finishAllNegotiations() {
    const unfinishedStatusList = [
      NegotiationStatus.INITIAL_EDIT,
      NegotiationStatus.NEGOTIATING,
      NegotiationStatus.EXTRA_REQUEST,
      NegotiationStatus.EXTRA_REPLY_EDIT,
    ];

    const zonedNextDay = this.getZonedNextDay(TAIPEI_TZ);

    const negotiations = await this.negotiationRepo.find(
      {
        date: zonedNextDay,
        lastDetailStatus: { $in: unfinishedStatusList },
      },
      {
        populate: ['chargingStation'],
      },
    );

    await Promise.all(
      negotiations.map((negotiation) =>
        this.finishNegotiationByNegotiation(
          negotiation,
          negotiation.chargingStation,
        ),
      ),
    );
  }

  async finishNegotiationByNegotiation(
    negotiation: AvailableCapacityNegotiationEntity,
    chargingStation: ChargingStationEntity,
  ) {
    // 決定協商的下一個 status 與 hourCapacities
    const finalStatusMap = {
      [NegotiationStatus.INITIAL_EDIT]: NegotiationStatus.NEGOTIATING_FAILED,
      [NegotiationStatus.NEGOTIATING]: NegotiationStatus.FINISH,
      [NegotiationStatus.EXTRA_REQUEST]: NegotiationStatus.EXTRA_REPLY_FAILED,
      [NegotiationStatus.EXTRA_REPLY_EDIT]:
        NegotiationStatus.EXTRA_REPLY_FAILED,
    };
    const nextStatus = finalStatusMap[negotiation.lastDetailStatus];

    if (!nextStatus) {
      return; // 協商已結束
    }

    let hourCapacities: AvailableCapacityNegotiationHourCapacity[];
    switch (negotiation.lastDetailStatus) {
      // 以充電站契約容量作結
      case NegotiationStatus.INITIAL_EDIT:
        hourCapacities =
          this.buildHourCapacitiesByChargingStationContractCapacity(
            chargingStation,
          );
        break;

      // 以 ELMO 第一次指定容量作結
      case NegotiationStatus.NEGOTIATING:
      case NegotiationStatus.EXTRA_REQUEST:
      case NegotiationStatus.EXTRA_REPLY_EDIT:
        const negotiatingDetail = await this.getNegotiationDetailByStatus(
          negotiation,
          NegotiationStatus.NEGOTIATING,
        );
        hourCapacities = negotiatingDetail.hourCapacities;
        break;

      // 協商已結束
      default:
        return;
    }

    // 更新協商狀態
    const detailData = {
      negotiation,
      status: nextStatus,
      hourCapacities,
    };

    const em = this.negotiationRepo.getEntityManager();
    return await em.transactional(async (em: EntityManager) => {
      await this.transitionNegotiationStatus(em, negotiation, detailData, true);
    });
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
    return this.buildHourCapacitiesByChargingStationContractCapacity(
      chargingStation,
    );
  }

  buildHourCapacitiesByChargingStationContractCapacity(
    chargingStation: ChargingStationEntity,
  ): AvailableCapacityNegotiationHourCapacity[] {
    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      capacity: chargingStation.contractCapacity,
    }));
  }
}
