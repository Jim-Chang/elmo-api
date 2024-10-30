import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import {
  LoadSiteFifteenMinuteESRawData,
  LoadSiteOneDayESRawData,
  LoadSiteOneHourESRawData,
} from './types';
import {
  buildFifteenMinuteIntervalIndexNameList,
  ensureTimeMarkIsISOFormat,
  fillMissingDataPoints,
  getDataSizeOfFifteenMinuteInterval,
  getDataSizeOfOneDayInterval,
} from '../utils';

// log-elmo-load_site-concentrated-{YYYY}-{mm}
const FIFTEEN_MINUTE_INTERVAL_BASE_INDEX_NAME =
  'log-elmo-load_site-concentrated-';

// log-elmo-load_site-statistics
const ONE_DAY_INTERVAL_INDEX_NAME = 'log-elmo-load_site-statistics';

const FIFTEEN_MINUTE_FIELDS: (keyof LoadSiteFifteenMinuteESRawData)[] = [
  'time_mark',
  'total_load_kw',
  'charge_load_kw',
];
const ONE_DAY_FIELDS: (keyof LoadSiteOneDayESRawData)[] = [
  'time_mark',
  'total_load_kwh',
  'charge_load_kwh',
];

@Injectable()
export class LoadSiteHistoryDataService {
  constructor(private readonly es: ElasticsearchService) {}

  async queryInFifteenMinuteDataInterval(
    uid: string,
    startDate: Date,
    endDate: Date,
  ): Promise<LoadSiteFifteenMinuteESRawData[]> {
    const indexNameList = buildFifteenMinuteIntervalIndexNameList(
      FIFTEEN_MINUTE_INTERVAL_BASE_INDEX_NAME,
      startDate,
      endDate,
    );

    const query = {
      bool: {
        must: [
          { match: { load_site_id: uid } },
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
        demand_load_kw:
          source.total_load_kw !== null && source.charge_load_kw !== null
            ? source.total_load_kw - source.charge_load_kw
            : null,
      }));

    return fillMissingDataPoints(data, startDate, endDate, 15, (timeMark) => {
      return {
        time_mark: timeMark,
        total_load_kw: null,
        charge_load_kw: null,
        demand_load_kw: null,
      };
    });
  }

  async queryInOneHourDataInterval(
    uid: string,
    startDate: Date,
    endDate: Date,
  ): Promise<LoadSiteOneHourESRawData[]> {
    const indexNameList = buildFifteenMinuteIntervalIndexNameList(
      FIFTEEN_MINUTE_INTERVAL_BASE_INDEX_NAME,
      startDate,
      endDate,
    );

    const query = {
      bool: {
        must: [
          { match: { load_site_id: uid } },
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
          avg_total_load_kw: { avg: { field: 'total_load_kw' } },
          avg_charge_load_kw: { avg: { field: 'charge_load_kw' } },
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
        total_load_kw: bucket.avg_total_load_kw.value ?? null,
        charge_load_kw: bucket.avg_charge_load_kw.value ?? null,
        demand_load_kw:
          bucket.avg_total_load_kw.value !== null &&
          bucket.avg_charge_load_kw.value !== null
            ? bucket.avg_total_load_kw.value - bucket.avg_charge_load_kw.value
            : null,
      };
    });

    return fillMissingDataPoints(data, startDate, endDate, 60, (timeMark) => {
      return {
        time_mark: timeMark,
        total_load_kw: null,
        charge_load_kw: null,
        demand_load_kw: null,
      };
    });
  }

  async queryInOneDayDataInterval(
    uid: string,
    startDate: Date,
    endDate: Date,
  ): Promise<LoadSiteOneDayESRawData[]> {
    const query = {
      bool: {
        must: [
          { match: { load_site_id: uid } },
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
        demand_load_kwh:
          source.total_load_kwh !== null && source.charge_load_kwh !== null
            ? source.total_load_kwh - source.charge_load_kwh
            : null,
      }));
  }
}
