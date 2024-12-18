import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { RedisHelper } from '../../adapter/out/redis/redis-helper';
import { ChargingStationRealTimeData, TransformerRealTimeData } from './types';

@Injectable()
export class RealTimeDataService {
  constructor(private readonly redisHelper: RedisHelper) {}

  async collectMultipleChargingStationRealTimeData(
    chargingStationUidList: string[],
  ): Promise<ChargingStationRealTimeData[]> {
    return await Promise.all(
      chargingStationUidList.map((uid) =>
        this.getChargingStationRealTimeData(uid),
      ),
    );
  }

  async getChargingStationRealTimeData(
    chargingStationUid: string,
  ): Promise<ChargingStationRealTimeData> {
    const redisKey = this.buildChargingStationRedisKey(chargingStationUid);
    const jsonData = await this.redisHelper.getJsonDataFromList(redisKey, 0);
    const timeMark = jsonData
      ? DateTime.fromISO(jsonData.time_mark).toJSDate()
      : null;

    return {
      uid: chargingStationUid,
      time_mark: timeMark,
      kw: jsonData?.kw ?? null,
    };
  }

  buildChargingStationRedisKey(chargingStationUid: string): string {
    return `elmo:charging_station:${chargingStationUid}`;
  }

  async collectMultipleTransformerRealTimeData(
    transformerUidList: string[],
  ): Promise<TransformerRealTimeData[]> {
    return await Promise.all(
      transformerUidList.map((uid) => this.getTransformerRealTimeData(uid)),
    );
  }

  async getTransformerRealTimeData(
    transformerUid: string,
  ): Promise<TransformerRealTimeData> {
    const redisKey = this.buildTransformerRedisKey(transformerUid);
    const jsonData = await this.redisHelper.getJsonDataFromString(redisKey);
    const timeMark = jsonData
      ? DateTime.fromISO(jsonData.time_mark).toJSDate()
      : null;

    return {
      uid: transformerUid,
      time_mark: timeMark,
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

  getEarliestTimeMark(timeMarks: (DateTime | null)[]): DateTime | null {
    return timeMarks.reduce((acc: DateTime | null, curr: DateTime | null) => {
      if (acc !== null && curr !== null) {
        return acc < curr ? acc : curr;
      }
      return acc ?? curr;
    }, null);
  }

  determineUpdateAt(
    transformerTimeMark: DateTime | null,
    chargingStationTimeMark: DateTime | null,
  ): DateTime | null {
    if (!transformerTimeMark && !chargingStationTimeMark) {
      return null;
    } else if (transformerTimeMark && chargingStationTimeMark) {
      return transformerTimeMark > chargingStationTimeMark
        ? chargingStationTimeMark
        : transformerTimeMark;
    } else {
      return transformerTimeMark ?? chargingStationTimeMark;
    }
  }

  determineTotalLoadKw(
    transformerDataset: TransformerRealTimeData[],
  ): number | null {
    return transformerDataset.reduce(
      (acc: number | null, curr: TransformerRealTimeData) => {
        if (curr.ac_power_meter_output_kw !== null) {
          return (acc ?? 0) + curr.ac_power_meter_output_kw;
        }
        return acc;
      },
      null,
    );
  }

  determineChargeLoadKw(
    chargingStationDataset: ChargingStationRealTimeData[],
  ): number | null {
    return chargingStationDataset.reduce(
      (acc: number | null, curr: ChargingStationRealTimeData) => {
        if (curr.kw !== null) {
          return (acc ?? 0) + curr.kw;
        }
        return acc;
      },
      null,
    );
  }

  determineDemandLoadKw(
    totalLoadKw: number | null,
    chargeLoadKw: number | null,
  ): number | null {
    if (totalLoadKw === null || chargeLoadKw === null) {
      return null;
    }

    return totalLoadKw - chargeLoadKw;
  }

  calculateChargeLoadPercentage(
    chargeLoad: number | null,
    totalLoad: number | null,
  ): number | null {
    if (
      chargeLoad === null ||
      !totalLoad // totalLoad is null or 0
    ) {
      return null;
    }

    return (chargeLoad / totalLoad) * 100;
  }
}
