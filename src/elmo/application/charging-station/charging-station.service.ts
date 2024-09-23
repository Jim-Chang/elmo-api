import { Injectable } from '@nestjs/common';
import { ChargingStationEntity } from '../../adapter/out/entities/charging-station.entity';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';
import { MqTopicPublishHelper } from '../../adapter/out/mq/mq-topic-publish-helper';
import { UpdateGroupMeasurementsDto } from '../../adapter/in/dto/update-group-measurements.dto';
import { ChargingStationMeasureData } from './types';
import { DateTime } from 'luxon';
import { EnergyMeasurementUnit } from '../../adapter/in/dto/enums';
import { EnergyMeasurementDto } from '../../adapter/in/dto/energy-measurement.dto';

@Injectable()
export class ChargingStationService {
  constructor(
    @InjectRepository(ChargingStationEntity)
    private readonly chargingStationRepo: EntityRepository<ChargingStationEntity>,
    private readonly mqHelper: MqTopicPublishHelper,
  ) {}

  async isChargingStationExist(uid: string): Promise<boolean> {
    const chargingStation = await this.chargingStationRepo.findOne({ uid });
    return !!chargingStation;
  }

  async getConnectedChargingStations(): Promise<ChargingStationEntity[]> {
    return this.chargingStationRepo.find({
      csms: {
        isConnected: true,
      },
    });
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

    const epochTime = DateTime.fromISO(measure_time).toSeconds();

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
      timestamp: measure_time,
      epoch_time: epochTime,
      life_kwh_total: kwhTotal,
    };
  }
}
