import { Injectable } from '@nestjs/common';
import { ChargingStationEntity } from '../adapter/out/entities/charging-station.entity';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';

@Injectable()
export class ChargingStationService {
  constructor(
    @InjectRepository(ChargingStationEntity)
    private readonly chargingStationRepo: EntityRepository<ChargingStationEntity>,
  ) {}

  async isChargingStationExist(uid: string): Promise<boolean> {
    const chargingStation = await this.chargingStationRepo.findOne({ uid });
    return !!chargingStation;
  }
}
