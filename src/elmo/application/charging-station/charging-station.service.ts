import { Injectable } from '@nestjs/common';
import { ChargingStationEntity } from '../../adapter/out/entities/charging-station.entity';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';
import { MqTopicPublishHelper } from '../../adapter/out/mq/mq-topic-publish-helper';
import { UpdateGroupMeasurementsDto } from '../../adapter/in/oscp/dto/update-group-measurements.dto';
import { ChargingStationMeasureData } from './types';
import { DateTime } from 'luxon';
import { EnergyMeasurementUnit } from '../../adapter/in/oscp/dto/enums';
import { EnergyMeasurementDto } from '../../adapter/in/oscp/dto/energy-measurement.dto';
import {
  EmergencyStatus,
  NegotiationStatus,
} from '../available-capacity/types';
import { AvailableCapacityNegotiationEntity } from '../../adapter/out/entities/available-capacity-negotiation.entity';

@Injectable()
export class ChargingStationService {
  constructor(
    @InjectRepository(ChargingStationEntity)
    private readonly chargingStationRepo: EntityRepository<ChargingStationEntity>,
    @InjectRepository(AvailableCapacityNegotiationEntity)
    private readonly availableCapacityNegotiationRepo: EntityRepository<AvailableCapacityNegotiationEntity>,
    private readonly mqHelper: MqTopicPublishHelper,
  ) {}

  async getAllChargingStations(): Promise<ChargingStationEntity[]> {
    return this.chargingStationRepo.findAll();
  }

  async isChargingStationExist(uid: string): Promise<boolean> {
    const chargingStation = await this.chargingStationRepo.findOne({ uid });
    return !!chargingStation;
  }

  async getChargingStationByUid(uid: string): Promise<ChargingStationEntity> {
    return this.chargingStationRepo.findOne({ uid });
  }

  async getConnectedChargingStations(): Promise<ChargingStationEntity[]> {
    return this.chargingStationRepo.find({
      csms: {
        isConnected: true,
      },
    });
  }

  async getContractCapacityById(chargingStationId: number): Promise<number> {
    const chargingStation =
      await this.chargingStationRepo.findOneOrFail(chargingStationId);
    return chargingStation.contractCapacity;
  }

  async findChargingStationByNegotiationId(
    negotiationId: number,
  ): Promise<ChargingStationEntity> {
    const negotiation =
      await this.availableCapacityNegotiationRepo.findOneOrFail(negotiationId, {
        populate: ['chargingStation'],
      });

    return negotiation.chargingStation;
  }

  async findChargingStationWithNegotiation(filterBy: {
    date: Date;
    districtId?: number;
    feedLineId?: number;
    loadSiteId?: number;
    negotiationStatusList?: NegotiationStatus[];
    emergencyStatus?: EmergencyStatus;
    keyword?: string;
  }): Promise<ChargingStationEntity[]> {
    const {
      date,
      districtId,
      feedLineId,
      loadSiteId,
      negotiationStatusList,
      emergencyStatus,
      keyword,
    } = filterBy;

    // filter charging stations by feed line, load site, keyword
    let chargingStationFilters: any = {};

    if (districtId) {
      chargingStationFilters.district = { id: districtId };
    }

    if (feedLineId) {
      chargingStationFilters.feedLine = { id: feedLineId };
    }

    if (loadSiteId) {
      chargingStationFilters.loadSite = { id: loadSiteId };
    }

    if (keyword) {
      chargingStationFilters = {
        ...chargingStationFilters,
        ...{
          $or: [
            { name: { $like: `%${keyword}%` } },
            { electricityAccountNo: { $like: `%${keyword}%` } },
            { loadSite: { name: { $like: `%${keyword}%` } } },
          ],
        },
      };
    }

    const chargingStations = await this.chargingStationRepo.find(
      chargingStationFilters,
      {
        populate: ['feedLine', 'loadSite'],
      },
    );

    // filter negotiations by date, charging stations, negotiation status, emergency status
    const negotiationFilter: any = {
      date,
      chargingStation: {
        $in: chargingStations,
      },
    };

    if (negotiationStatusList && negotiationStatusList.length > 0) {
      negotiationFilter.lastDetailStatus = { $in: negotiationStatusList };
    }

    if (emergencyStatus) {
      const now = DateTime.now().toJSDate();
      if (emergencyStatus === EmergencyStatus.PREPARE_EMERGENCY_CONTROL) {
        negotiationFilter.lastEmergency = {
          periodStartAt: { $gt: now },
          isSuccessSent: true,
        };
      } else if (emergencyStatus === EmergencyStatus.EMERGENCY_CONTROL) {
        negotiationFilter.lastEmergency = {
          periodStartAt: { $lte: now },
          periodEndAt: { $gt: now },
          isSuccessSent: true,
        };
      } else if (emergencyStatus === EmergencyStatus.EMERGENCY_CONTROL_FINISH) {
        negotiationFilter.lastEmergency = {
          periodEndAt: { $lte: now },
          isSuccessSent: true,
        };
      } else if (emergencyStatus === EmergencyStatus.EMERGENCY_CONTROL_FAILED) {
        negotiationFilter.lastEmergency = {
          isSuccessSent: false,
        };
      }
    }

    const negotiations = await this.availableCapacityNegotiationRepo.find(
      negotiationFilter,
      {
        orderBy: { chargingStation: { id: 'asc' } },
        populate: ['lastEmergency'],
      },
    );

    // combine charging stations with negotiations
    const chargingStationIdMap = chargingStations.reduce(
      (map, chargingStation) => {
        map[chargingStation.id] = chargingStation;
        return map;
      },
      {},
    );

    return negotiations.map((negotiation) => {
      const chargingStation =
        chargingStationIdMap[negotiation.chargingStation.id];
      chargingStation.negotiations = [negotiation];
      return chargingStation;
    });
  }

  async getConnectedChargingStationById(
    id: number,
  ): Promise<ChargingStationEntity | null> {
    return this.chargingStationRepo.findOne(
      {
        id,
        csms: { isConnected: true },
      },
      {
        populate: ['csms'],
      },
    );
  }

  async publishChargingStationMeasurements(
    measurementsDto: UpdateGroupMeasurementsDto,
  ) {
    const chargingStationId = measurementsDto.group_id;

    const dataList: ChargingStationMeasureData[] =
      measurementsDto.measurements.map((energyMeas) =>
        this.buildChargingStationMeasureData(chargingStationId, energyMeas),
      );

    await Promise.all(
      dataList.map((data) =>
        this.mqHelper.publishToChargingStationExchange(data),
      ),
    );
  }

  private buildChargingStationMeasureData(
    chargingStationId: string,
    energyMeasureDto: EnergyMeasurementDto,
  ): ChargingStationMeasureData {
    const { measure_time, value, unit } = energyMeasureDto;

    let kwhTotal = 0;
    if (unit === EnergyMeasurementUnit.Kwh) {
      kwhTotal = value;
    } else if (unit === EnergyMeasurementUnit.Wh) {
      kwhTotal = value / 1000;
    } else {
      throw new Error(`Invalid energy measurement unit: ${unit}`);
    }

    return {
      charging_station_id: chargingStationId,
      log_timestamp: measure_time,
      life_kwh_total: kwhTotal,
    };
  }
}
