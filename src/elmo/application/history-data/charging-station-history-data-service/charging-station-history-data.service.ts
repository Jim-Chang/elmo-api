import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import {
  ChargingStationFifteenMinuteESRawData,
  ChargingStationOneDayESRawData,
  ChargingStationOneHourESRawData,
} from './types';
import {
  buildFifteenMinuteIntervalIndexNameList,
  ensureTimeMarkIsISOFormat,
  fillMissingDataPoints,
  getDataSizeOfFifteenMinuteInterval,
  getDataSizeOfOneDayInterval,
} from '../utils';

// log-elmo-charging-station-concentrated-{YYYY}-{mm}
const FIFTEEN_MINUTE_INTERVAL_BASE_INDEX_NAME =
  'log-elmo-charging_station-concentrated-';

// log-elmo-charging-station-statistics
const ONE_DAY_INTERVAL_INDEX_NAME = 'log-elmo-charging_station-statistics';

const FIFTEEN_MINUTE_FIELDS: (keyof ChargingStationFifteenMinuteESRawData)[] = [
  'time_mark',
  'kw',
];
const ONE_DAY_FIELDS: (keyof ChargingStationOneDayESRawData)[] = [
  'time_mark',
  'kwh',
  'life_kwh_total',
];

@Injectable()
export class ChargingStationHistoryDataService {
  constructor(private readonly es: ElasticsearchService) {}

  async queryInFifteenMinuteDataInterval(
    uid: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ChargingStationFifteenMinuteESRawData[]> {
    const indexNameList = buildFifteenMinuteIntervalIndexNameList(
      FIFTEEN_MINUTE_INTERVAL_BASE_INDEX_NAME,
      startDate,
      endDate,
    );

    const query = {
      bool: {
        must: [
          { match: { charging_station_id: uid } },
          {
            range: {
              time_mark: {
                gte: startDate.toISOString(),
                lte: endDate.toISOString(),
              },
            },
          },
        ],
      },
    };

    const size = getDataSizeOfFifteenMinuteInterval(startDate, endDate);

    const result = await this.es.search({
      index: indexNameList.join(','),
      query,
      size,
      sort: [{ time_mark: { order: 'asc' } }],
      _source: FIFTEEN_MINUTE_FIELDS,
    });

    const data = result.hits.hits
      .map((hit) => hit._source as any)
      .map((source) => ({
        ...source,
        time_mark: ensureTimeMarkIsISOFormat(source.time_mark),
      }));

    return fillMissingDataPoints(data, startDate, endDate, 15, (timeMark) => {
      return {
        time_mark: timeMark,
        kw: null,
      };
    });
  }

  async queryInOneHourDataInterval(
    uid: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ChargingStationOneHourESRawData[]> {
    const indexNameList = buildFifteenMinuteIntervalIndexNameList(
      FIFTEEN_MINUTE_INTERVAL_BASE_INDEX_NAME,
      startDate,
      endDate,
    );

    const query = {
      bool: {
        must: [
          { match: { charging_station_id: uid } },
          {
            range: {
              time_mark: {
                gte: startDate.toISOString(),
                lte: endDate.toISOString(),
              },
            },
          },
        ],
      },
    };

    const aggs = {
      hourly_data: {
        date_histogram: {
          field: 'time_mark',
          fixed_interval: '1h',
        },
        aggs: {
          avg_kw: { avg: { field: 'kw' } },
        },
      },
    };

    const size = getDataSizeOfFifteenMinuteInterval(startDate, endDate);

    const result = await this.es.search({
      index: indexNameList.join(','),
      query,
      aggs,
      size,
      sort: [{ time_mark: { order: 'asc' } }],
    });

    // @ts-ignore
    const buckets = result.aggregations.hourly_data.buckets;
    const data = buckets.map((bucket: any) => {
      return {
        time_mark: ensureTimeMarkIsISOFormat(bucket.key_as_string),
        kw: bucket.avg_kw.value ?? null,
      };
    });

    return fillMissingDataPoints(data, startDate, endDate, 60, (timeMark) => {
      return {
        time_mark: timeMark,
        kw: null,
      };
    });
  }

  async queryInOneDayDataInterval(
    uid: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ChargingStationOneDayESRawData[]> {
    const query = {
      bool: {
        must: [
          { match: { charging_station_id: uid } },
          {
            range: {
              time_mark: {
                gte: startDate.toISOString(),
                lte: endDate.toISOString(),
              },
            },
          },
        ],
      },
    };

    const size = getDataSizeOfOneDayInterval(startDate, endDate);

    const result = await this.es.search({
      index: ONE_DAY_INTERVAL_INDEX_NAME,
      query,
      size,
      sort: [{ time_mark: { order: 'asc' } }],
      _source: ONE_DAY_FIELDS,
    });

    return result.hits.hits
      .map((hit) => hit._source as any)
      .map((source) => ({
        ...source,
        time_mark: ensureTimeMarkIsISOFormat(source.time_mark),
      }));
  }
}
