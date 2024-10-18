import { Injectable } from '@nestjs/common';
import { RedisHelper } from '../../adapter/out/redis/redis-helper';
import { ChargingStationRealTimeData } from './types';

@Injectable()
export class RealTimeDataService {
  constructor(private readonly redisHelper: RedisHelper) {}

  async getChargingStationRealTimeData(
    chargingStationUid: string,
  ): Promise<ChargingStationRealTimeData> {
    const redisKey = this.buildChargingStationRedisKey(chargingStationUid);
    const jsonData = await this.redisHelper.getJsonDataFromList(redisKey, 0);

    return {
      uid: chargingStationUid,
      time_mark: new Date(jsonData?.time_mark) ?? null,
      kw: jsonData?.kw ?? null,
    };
  }

  buildChargingStationRedisKey(chargingStationUid: string): string {
    return `elmo:charging_station:${chargingStationUid}`;
  }
}
