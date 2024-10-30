import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import {
  TransformerFifteenMinuteESRawData,
  TransformerOneDayESRawData,
  TransformerOneHourESRawData,
} from './types';
import {
  buildFifteenMinuteIntervalIndexNameList,
  ensureTimeMarkIsISOFormat,
  fillMissingDataPoints,
  getDataSizeOfFifteenMinuteInterval,
  getDataSizeOfOneDayInterval,
} from '../utils';

// log-elmo-transformer-concentrated-{YYYY}-{mm}
const FIFTEEN_MINUTE_INTERVAL_BASE_INDEX_NAME =
  'log-elmo-transformer-concentrated-';

// log-elmo-transformer-statistics
const ONE_DAY_INTERVAL_INDEX_NAME = 'log-elmo-transformer-statistics';

const FIFTEEN_MINUTE_FIELDS = [
  'time_mark',
  'ac_power_meter_output_kw',
  'ac_power_meter_output_kvar',
  'ac_power_meter_output_kva',
  'ac_power_meter_output_pf',
  'ac_power_meter_freq',
  'ac_power_meter_line_amps_a',
  'ac_power_meter_line_amps_b',
  'ac_power_meter_line_amps_c',
  'ac_power_meter_line_volts_a_b',
  'ac_power_meter_line_volts_b_c',
  'ac_power_meter_line_volts_c_a',
];

const ONE_DAY_FIELDS = [
  'time_mark',
  'ac_power_meter_input_kwh_today',
  'ac_power_meter_input_kvarh_today',
  'ac_power_meter_input_kvah_today',
  'ac_power_meter_output_kwh',
  'ac_power_meter_output_kvarh',
  'ac_power_meter_output_kvah',
  'ac_power_meter_input_kwh',
  'ac_power_meter_input_kvarh',
  'ac_power_meter_input_kvah',
];

@Injectable()
export class TransformerHistoryDataService {
  constructor(private readonly es: ElasticsearchService) {}

  async queryInFifteenMinuteDataInterval(
    uid: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TransformerFifteenMinuteESRawData[]> {
    const indexNameList = buildFifteenMinuteIntervalIndexNameList(
      FIFTEEN_MINUTE_INTERVAL_BASE_INDEX_NAME,
      startDate,
      endDate,
    );

    const query = {
      bool: {
        must: [
          { match: { transformer_id: uid } },
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
        ac_power_meter_output_kw: null,
        ac_power_meter_output_kvar: null,
        ac_power_meter_output_kva: null,
        ac_power_meter_output_pf: null,
        ac_power_meter_freq: null,
        ac_power_meter_line_amps_a: null,
        ac_power_meter_line_amps_b: null,
        ac_power_meter_line_amps_c: null,
        ac_power_meter_line_volts_a_b: null,
        ac_power_meter_line_volts_b_c: null,
        ac_power_meter_line_volts_c_a: null,
      };
    });
  }

  async queryInOneHourDataInterval(
    uid: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TransformerOneHourESRawData[]> {
    const indexNameList = buildFifteenMinuteIntervalIndexNameList(
      FIFTEEN_MINUTE_INTERVAL_BASE_INDEX_NAME,
      startDate,
      endDate,
    );

    const query = {
      bool: {
        must: [
          { match: { transformer_id: uid } },
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
          avg_ac_power_meter_output_kw: {
            avg: { field: 'ac_power_meter_output_kw' },
          },
          avg_ac_power_meter_output_kvar: {
            avg: { field: 'ac_power_meter_output_kvar' },
          },
          avg_ac_power_meter_output_kva: {
            avg: { field: 'ac_power_meter_output_kva' },
          },
          avg_ac_power_meter_output_pf: {
            avg: { field: 'ac_power_meter_output_pf' },
          },
          avg_ac_power_meter_freq: { avg: { field: 'ac_power_meter_freq' } },
          avg_ac_power_meter_line_amps_a: {
            avg: { field: 'ac_power_meter_line_amps_a' },
          },
          avg_ac_power_meter_line_amps_b: {
            avg: { field: 'ac_power_meter_line_amps_b' },
          },
          avg_ac_power_meter_line_amps_c: {
            avg: { field: 'ac_power_meter_line_amps_c' },
          },
          avg_ac_power_meter_line_volts_a_b: {
            avg: { field: 'ac_power_meter_line_volts_a_b' },
          },
          avg_ac_power_meter_line_volts_b_c: {
            avg: { field: 'ac_power_meter_line_volts_b_c' },
          },
          avg_ac_power_meter_line_volts_c_a: {
            avg: { field: 'ac_power_meter_line_volts_c_a' },
          },
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
        ac_power_meter_output_kw:
          bucket.avg_ac_power_meter_output_kw.value ?? null,
        ac_power_meter_output_kvar:
          bucket.avg_ac_power_meter_output_kvar.value ?? null,
        ac_power_meter_output_kva:
          bucket.avg_ac_power_meter_output_kva.value ?? null,
        ac_power_meter_output_pf:
          bucket.avg_ac_power_meter_output_pf.value ?? null,
        ac_power_meter_freq: bucket.avg_ac_power_meter_freq.value ?? null,
        ac_power_meter_line_amps_a:
          bucket.avg_ac_power_meter_line_amps_a.value ?? null,
        ac_power_meter_line_amps_b:
          bucket.avg_ac_power_meter_line_amps_b.value ?? null,
        ac_power_meter_line_amps_c:
          bucket.avg_ac_power_meter_line_amps_c.value ?? null,
        ac_power_meter_line_volts_a_b:
          bucket.avg_ac_power_meter_line_volts_a_b.value ?? null,
        ac_power_meter_line_volts_b_c:
          bucket.avg_ac_power_meter_line_volts_b_c.value ?? null,
        ac_power_meter_line_volts_c_a:
          bucket.avg_ac_power_meter_line_volts_c_a.value ?? null,
      };
    });

    return fillMissingDataPoints(data, startDate, endDate, 60, (timeMark) => {
      return {
        time_mark: timeMark,
        ac_power_meter_output_kw: null,
        ac_power_meter_output_kvar: null,
        ac_power_meter_output_kva: null,
        ac_power_meter_output_pf: null,
        ac_power_meter_freq: null,
        ac_power_meter_line_amps_a: null,
        ac_power_meter_line_amps_b: null,
        ac_power_meter_line_amps_c: null,
        ac_power_meter_line_volts_a_b: null,
        ac_power_meter_line_volts_b_c: null,
        ac_power_meter_line_volts_c_a: null,
      };
    });
  }

  async queryInOneDayDataInterval(
    uid: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TransformerOneDayESRawData[]> {
    const query = {
      bool: {
        must: [
          { match: { transformer_id: uid } },
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
