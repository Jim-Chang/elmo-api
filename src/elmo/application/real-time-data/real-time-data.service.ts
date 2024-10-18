import { Injectable } from '@nestjs/common';
import { RedisHelper } from '../../adapter/out/redis/redis-helper';
import { ChargingStationRealTimeData, TransformerRealTimeData } from './types';

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

  async getTransformerRealTimeData(
    transformerUid: string,
  ): Promise<TransformerRealTimeData> {
    const redisKey = this.buildTransformerRedisKey(transformerUid);
    const jsonData = await this.redisHelper.getJsonDataFromString(redisKey);

    return {
      uid: transformerUid,
      time_mark: new Date(jsonData?.time_mark) ?? null,
      ac_power_meter_output_kw: jsonData?.ac_power_meter_output_kw ?? null,
      ac_power_meter_output_kvar: jsonData?.ac_power_meter_output_kvar ?? null,
      ac_power_meter_output_kva: jsonData?.ac_power_meter_output_kva ?? null,
      ac_power_meter_output_pf: jsonData?.ac_power_meter_output_pf ?? null,
      ac_power_meter_freq: jsonData?.ac_power_meter_freq ?? null,
      ac_power_meter_line_amps_a: jsonData?.ac_power_meter_line_amps_a ?? null,
      ac_power_meter_line_amps_b: jsonData?.ac_power_meter_line_amps_b ?? null,
      ac_power_meter_line_amps_c: jsonData?.ac_power_meter_line_amps_c ?? null,
      ac_power_meter_line_volts_a_b:
        jsonData?.ac_power_meter_line_volts_a_b ?? null,
      ac_power_meter_line_volts_b_c:
        jsonData?.ac_power_meter_line_volts_b_c ?? null,
      ac_power_meter_line_volts_c_a:
        jsonData?.ac_power_meter_line_volts_c_a ?? null,
      ac_power_meter_output_kwh: jsonData?.ac_power_meter_output_kwh ?? null,
      ac_power_meter_output_kvarh:
        jsonData?.ac_power_meter_output_kvarh ?? null,
      ac_power_meter_output_kvah: jsonData?.ac_power_meter_output_kvah ?? null,
      ac_power_meter_input_kwh: jsonData?.ac_power_meter_input_kwh ?? null,
      ac_power_meter_input_kvarh: jsonData?.ac_power_meter_input_kvarh ?? null,
      ac_power_meter_input_kvah: jsonData?.ac_power_meter_input_kvah ?? null,
    };
  }

  buildTransformerRedisKey(transformerUid: string): string {
    return `elmo:transformer:${transformerUid}`;
  }
}
